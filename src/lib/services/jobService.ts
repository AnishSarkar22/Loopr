import { Client, Databases, Query } from 'appwrite';
import { DATABASE_ID, URLS_COLLECTION_ID } from '$lib/config';

export async function collectJobsDue(client: Client, nodeId: string, shardKey: number) {
    const databases = new Databases(client);
    const now = new Date().toISOString();
    
    // Get all URLs assigned to this node that are due for pinging
    const urlsDue = await databases.listDocuments(
        DATABASE_ID,
        URLS_COLLECTION_ID,
        [
            Query.equal('nodeId', nodeId),
            Query.equal('isEnabled', true),
            Query.equal('shardKey', shardKey),
            Query.lessThanEqual('nextPingTime', now)
        ],
        100  // Process in batches of 100
    );
    
    return urlsDue.documents;
}