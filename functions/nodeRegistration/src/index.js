import { Client, Databases, ID, Query } from 'appwrite';

export default async function({ req, res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  
  // Register this node or update its heartbeat
  const nodeId = process.env.NODE_ID || `node-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  
  try {
    // Try to update existing node
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
}