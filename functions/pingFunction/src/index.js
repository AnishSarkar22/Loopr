/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, Databases, Query } from 'appwrite';

export default async function({ req, res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  
  const databases = new Databases(client);
  const batchSize = 100; // Adjust based on your needs
  const nodeId = process.env.NODE_ID || `node-${Math.floor(Math.random() * 5) + 1}`; // Fixed node pool
  const now = new Date().toISOString();
  
  try {
    // 1. Get URLs assigned to this node that are due for pinging
    const urlsDue = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.URLS_COLLECTION_ID,
      [
        Query.equal('nodeId', nodeId),
        Query.equal('isEnabled', true),
        Query.lessThanEqual('nextPingTime', now)
      ],
      batchSize
    );
    
    if (urlsDue.total === 0) {
      return res.json({
        success: true,
        message: `No URLs due for pinging on node ${nodeId}`
      });
    }
    
    // 2. Process URLs in parallel with efficient promises
    const pingResults = await Promise.all(
      urlsDue.documents.map(doc => pingUrl(doc.url, doc.$id))
    );
    
    // 3. Group results by user for efficient storage
    const resultsByUser = {};
    const urlUpdates = [];
    
    for (const result of pingResults) {
      const urlDoc = urlsDue.documents.find(doc => doc.$id === result.urlId);
      if (!urlDoc) continue;
      
      // Group by user
      const userId = urlDoc.userId;
      if (!resultsByUser[userId]) {
        resultsByUser[userId] = [];
      }
      resultsByUser[userId].push(result);
      
      // Prepare URL update
      const pingInterval = urlDoc.pingInterval || 15; // Default to 15 minutes
      const nextPingTime = new Date();
      nextPingTime.setMinutes(nextPingTime.getMinutes() + pingInterval);
      
      urlUpdates.push({
        id: urlDoc.$id,
        data: {
          lastPingTime: result.timestamp,
          lastPingStatus: result.success ? 'success' : 'error',
          lastPingStatusCode: result.status,
          nextPingTime: nextPingTime.toISOString(),
          successCount: urlDoc.successCount + (result.success ? 1 : 0)
        }
      });
    }
    
    // 4. Store results by user in time-based shards
    await storeResultsByUser(databases, resultsByUser);
    
    // 5. Update URL documents in batches
    await updateUrlsInBatches(databases, urlUpdates);
    
    return res.json({
      success: true,
      processed: pingResults.length,
      timestamp: now
    });
  } catch (error) {
    console.error('Error in ping function:', error);
    return res.json({
      success: false,
      error: error.message
    }, 500);
  }
}

// Helper function to ping a URL
async function pingUrl(url, urlId) {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'User-Agent': 'KeepAlive-Bot/1.0',
        'X-Ping': 'keepalive' 
      },
      cache: 'no-cache',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000) // 15 second timeout for any URL
    });
    
    const endTime = Date.now();
    return {
      url,
      urlId,
      status: response.status,
      success: response.status >= 200 && response.status < 400,
      timestamp: new Date().toISOString(),
      responseTime: endTime - startTime
    };
  } catch (error) {
    return {
      url,
      urlId,
      status: 0,
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Helper function to update URLs in batches
async function updateUrlsInBatches(databases, urlUpdates, batchSize = 25) {
  // Group updates by the same URL ID
  const consolidatedUpdates = {};
  
  for (const update of urlUpdates) {
    if (!consolidatedUpdates[update.id]) {
      consolidatedUpdates[update.id] = update.data;
    } else {
      // Merge with any existing updates for this URL
      consolidatedUpdates[update.id] = {
        ...consolidatedUpdates[update.id],
        ...update.data,
        // Handle special case for successCount
        successCount: Math.max(
          consolidatedUpdates[update.id].successCount || 0,
          update.data.successCount || 0
        )
      };
    }
  }
  
  // Convert back to array format
  const finalUpdates = Object.entries(consolidatedUpdates).map(([id, data]) => ({
    id,
    data
  }));
  
  // Process in batches
  for (let i = 0; i < finalUpdates.length; i += batchSize) {
    const batch = finalUpdates.slice(i, i + batchSize);
    await Promise.all(
      batch.map(update => 
        databases.updateDocument(
          process.env.DATABASE_ID,
          process.env.URLS_COLLECTION_ID,
          update.id,
          update.data
        )
      )
    );
  }
}

// Helper function to implement time-based data sharding
async function storeResultsByUser(databases, resultsByUser) {
  const batches = [];
  
  for (const [userId, results] of Object.entries(resultsByUser)) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const shardId = `${userId}_${today}`;
    
    try {
      // Try to get existing shard
      const existingShard = await databases.getDocument(
        process.env.DATABASE_ID,
        process.env.RESULTS_COLLECTION_ID,
        shardId
      );
      
      // Update existing shard
      const updatedResults = [...existingShard.results];
      for (const result of results) {
        const existingUrlIdx = updatedResults.findIndex(r => r.urlId === result.urlId);
        if (existingUrlIdx >= 0) {
          // Limit array sizes to prevent document size issues
          const MAX_HISTORY = 288; // 24 hours of 5-minute intervals
          
          // Add new result using push for timestamps and statuses
          updatedResults[existingUrlIdx].timestamps.push(result.timestamp);
          updatedResults[existingUrlIdx].statuses.push(result.status);
          
          // Keep only the most recent MAX_HISTORY entries
          if (updatedResults[existingUrlIdx].timestamps.length > MAX_HISTORY) {
            updatedResults[existingUrlIdx].timestamps = 
              updatedResults[existingUrlIdx].timestamps.slice(-MAX_HISTORY);
            updatedResults[existingUrlIdx].statuses = 
              updatedResults[existingUrlIdx].statuses.slice(-MAX_HISTORY);
          }
        } else {
          // Add new URL result
          updatedResults.push({
            urlId: result.urlId,
            timestamps: [result.timestamp],
            statuses: [result.status]
          });
        }
      }

      const MAX_URLS_PER_SHARD = 50;

      
      // After checking the number of URLs in a shard:
      if (updatedResults.length > MAX_URLS_PER_SHARD) {
        // Create a new shard with a unique name
        const shardCounter = existingShard.counter || 0;
        const newShardId = `${userId}_${today}_${shardCounter + 1}`;
        
        // Split the results between shards
        const halfPoint = Math.floor(updatedResults.length / 2);
        const firstHalf = updatedResults.slice(0, halfPoint);
        const secondHalf = updatedResults.slice(halfPoint);
        
        // Update the original shard
        batches.push(
          databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.RESULTS_COLLECTION_ID,
            shardId,
            { 
              results: firstHalf,
              counter: shardCounter + 1 
            }
          )
        );
        
        // Create a new shard with the rest
        batches.push(
          databases.createDocument(
            process.env.DATABASE_ID,
            process.env.RESULTS_COLLECTION_ID,
            newShardId,
            {
              userId,
              date: today,
              shardId: newShardId,
              results: secondHalf
            }
          )
        );
      } else {
        batches.push(
          databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.RESULTS_COLLECTION_ID,
            shardId,
            { results: updatedResults }
          )
        );
      }

    } catch (error) {
      // Shard doesn't exist, create it
      const newResults = results.map(result => ({
        urlId: result.urlId,
        timestamps: [result.timestamp],
        statuses: [result.status]
      }));
      
      batches.push(
        databases.createDocument(
          process.env.DATABASE_ID,
          process.env.RESULTS_COLLECTION_ID,
          shardId,
          {
            userId,
            date: today,
            shardId,
            results: newResults
          }
        )
      );
    }
  }
  
  // Execute all shard operations
  await Promise.all(batches);
}