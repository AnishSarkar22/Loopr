/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, Databases, ID, Query } from 'appwrite';

export default async function({ req, res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  
  // Use a fixed pool of worker nodes (e.g., 5 nodes)
  const NODE_POOL_SIZE = 5;
  const nodeIndex = Math.floor(Math.random() * NODE_POOL_SIZE) + 1;
  const nodeId = `node-${nodeIndex}`;
  const now = new Date().toISOString();
  
  try {
    // Try to update existing node
    try {
      await databases.updateDocument(
        process.env.DATABASE_ID,
        'worker_nodes',
        nodeId,
        {
          status: 'online',
          lastHeartbeat: now
        }
      );
    } catch (error) {
      // Node doesn't exist, create it
      await databases.createDocument(
        process.env.DATABASE_ID,
        'worker_nodes',
        nodeId,
        {
          id: nodeId,
          name: `Worker ${nodeId}`,
          status: 'online',
          lastHeartbeat: now,
          urlCount: 0,
          region: process.env.WORKER_REGION || 'default'
        }
      );
    }
    
    // Balance the load - reassign URLs if this node has too few
    await balanceNodeLoad(databases, nodeId);
    
    // Get current URL count for load balancing decisions
    const urlCount = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.URLS_COLLECTION_ID,
      [Query.equal('nodeId', nodeId)]
    );
    
    return res.json({
      success: true,
      nodeId: nodeId,
      urlCount: urlCount.total,
      timestamp: now
    });
  } catch (error) {
    console.error('Node registration error:', error);
    return res.json({
      success: false,
      error: error.message
    }, 500);
  }
}

// Helper function to balance the load between nodes
async function balanceNodeLoad(databases, currentNodeId) {
  // Get all active nodes
  const activeNodes = await databases.listDocuments(
    process.env.DATABASE_ID,
    'worker_nodes',
    [Query.equal('status', 'online')],
    100
  );
  
  if (activeNodes.total <= 1) return; // No need to balance with only one node
  
  // Calculate URL count for each node
  const nodeCounts = await Promise.all(
    activeNodes.documents.map(async node => {
      const urls = await databases.listDocuments(
        process.env.DATABASE_ID,
        process.env.URLS_COLLECTION_ID,
        [Query.equal('nodeId', node.$id)]
      );
      
      return {
        nodeId: node.$id,
        count: urls.total
      };
    })
  );
  
  // Find the node with most URLs and the current node
  const maxNode = nodeCounts.reduce((max, node) => 
    node.count > max.count ? node : max, { count: -1 });
  
  const currentNode = nodeCounts.find(node => node.nodeId === currentNodeId);
  
  // If the current node has much fewer URLs than the max node, steal some
  if (maxNode.count > currentNode.count + 10) {
    const diff = Math.floor((maxNode.count - currentNode.count) / 2);
    const toReassign = Math.min(diff, 50); // Don't move too many at once
    
    // Get URLs to reassign
    const urlsToReassign = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.URLS_COLLECTION_ID,
      [Query.equal('nodeId', maxNode.nodeId)],
      toReassign
    );
    
    // Reassign them
    await Promise.all(
      urlsToReassign.documents.map(url => 
        databases.updateDocument(
          process.env.DATABASE_ID,
          process.env.URLS_COLLECTION_ID,
          url.$id,
          { nodeId: currentNodeId }
        )
      )
    );
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}