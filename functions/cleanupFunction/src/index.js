import { Client, Databases, Query } from 'appwrite';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function({ req, res }) {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  
  const databases = new Databases(client);
  const batchSize = 100; // Adjust based on your needs
  
  // Process URLs in batches
  const now = new Date().toISOString();
  const urlsDue = await databases.listDocuments(
    process.env.DATABASE_ID,
    process.env.URLS_COLLECTION_ID,
    [
      Query.equal('isEnabled', true),
      Query.lessThanEqual('nextPingTime', now)
    ],
    batchSize
  );
  
  // Process in parallel with Promise.all
  const pingResults = await Promise.all(
    urlsDue.documents.map(doc => pingUrl(doc.url, doc.$id))
  );
  
  // Bulk update results, minimizing writes
  await updateResultsInBulk(databases, pingResults);
  
  return res.json({
    success: true,
    processed: pingResults.length
  });
}