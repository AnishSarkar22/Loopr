// for database cleanup

import { Client, Databases, Query } from 'appwrite';

export default async function({ res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_ENDPOINT);
  
  const databases = new Databases(client);
  
  try {
    // Set retention period (keep only 15 days of history for free tier)
    const MAX_RETENTION_DAYS = 15;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
    const cutoffString = cutoffDate.toISOString();
    
    // 1. Clean up old ping results
    const oldResultShards = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.RESULTS_COLLECTION_ID,
      [Query.lessThan('date', cutoffString.split('T')[0])], // YYYY-MM-DD format
      100
    );
    
    // Delete old results in parallel
    if (oldResultShards.documents.length > 0) {
      await Promise.all(
        oldResultShards.documents.map(doc => 
          databases.deleteDocument(
            process.env.DATABASE_ID,
            process.env.RESULTS_COLLECTION_ID,
            doc.$id
          )
        )
      );
    }
    
    // 2. Clean up inactive worker nodes (last heartbeat > 1 day ago)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const staleNodes = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.WORKER_NODES_COLLECTION_ID,
      [Query.lessThan('lastHeartbeat', dayAgo.toISOString())],
      100
    );
    
    if (staleNodes.documents.length > 0) {
      await Promise.all(
        staleNodes.documents.map(node => 
          databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.WORKER_NODES_COLLECTION_ID,
            node.$id,
            { status: 'offline' }
          )
        )
      );
      
      // Reassign URLs from offline nodes to active ones
      await reassignUrls(databases, staleNodes.documents);
    }
    
    return res.json({
      success: true,
      deletedResults: oldResultShards.documents.length,
      offlineNodes: staleNodes.documents.length
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.json({
      success: false,
      error: error.message
    }, 500);
  }
}

// Helper function to reassign URLs from offline nodes to active ones
async function reassignUrls(databases, offlineNodes) {
  if (offlineNodes.length === 0) return;
  
  // Get active nodes
  const activeNodes = await databases.listDocuments(
    process.env.DATABASE_ID,
    process.env.WORKER_NODES_COLLECTION_ID,
    [Query.equal('status', 'online')],
    100
  );
  
  if (activeNodes.documents.length === 0) return; // No active nodes to reassign to
  
  // For each offline node, reassign its URLs
  for (const offlineNode of offlineNodes) {
    // Get URLs assigned to this offline node
    const orphanedUrls = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.URLS_COLLECTION_ID,
      [Query.equal('nodeId', offlineNode.$id)],
      1000
    );
    
    if (orphanedUrls.documents.length === 0) continue;
    
    // Distribute URLs across active nodes
    const updates = orphanedUrls.documents.map((url, index) => {
      // Round-robin assignment
      const targetNode = activeNodes.documents[index % activeNodes.documents.length];
      
      return databases.updateDocument(
        process.env.DATABASE_ID,
        process.env.URLS_COLLECTION_ID,
        url.$id,
        { nodeId: targetNode.$id }
      );
    });
    
    await Promise.all(updates);
  }
}