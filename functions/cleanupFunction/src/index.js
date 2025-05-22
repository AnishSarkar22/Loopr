import { Client, Databases, Query } from 'appwrite';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function({ req, res, log, error }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  
  // Delete results older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  const oldResults = await databases.listDocuments(
    process.env.DATABASE_ID,
    process.env.RESULTS_COLLECTION_ID,
    [Query.lessThan('date', cutoffDate)]
  );
  
  let deletedCount = 0;
  for (const doc of oldResults.documents) {
    await databases.deleteDocument(
      process.env.DATABASE_ID,
      process.env.RESULTS_COLLECTION_ID,
      doc.$id
    );
    deletedCount++;
  }
  
  return res.json({
    success: true,
    message: `Deleted ${deletedCount} old result shards`,
    timestamp: new Date().toISOString()
  });
}