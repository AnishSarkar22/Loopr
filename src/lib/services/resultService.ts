// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Client, Databases, ID } from 'appwrite';
import { DATABASE_ID, RESULTS_COLLECTION_ID } from '$lib/config';
import type { PingResult } from '$lib/types';

export async function storeResults(client: Client, results: PingResult[], userId: string) {
    const databases = new Databases(client);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const shardId = `${userId}_${today}`;
    
    // Try to find existing shard
    try {
        const existingShard = await databases.getDocument(
            DATABASE_ID,
            RESULTS_COLLECTION_ID,
            shardId
        );
        
        // Update existing shard
        const updatedResults = [...existingShard.results];
        
        results.forEach(result => {
            const existingUrlIndex = updatedResults.findIndex(r => r.urlId === result.url);
            if (existingUrlIndex >= 0) {
                updatedResults[existingUrlIndex].timestamps.push(result.timestamp);
                updatedResults[existingUrlIndex].statuses.push(result.status);
            } else {
                updatedResults.push({
                    urlId: result.url,
                    timestamps: [result.timestamp],
                    statuses: [result.status]
                });
            }
        });
        
        await databases.updateDocument(
            DATABASE_ID,
            RESULTS_COLLECTION_ID,
            shardId,
            { results: updatedResults }
        );
        
    } catch {
        // Create new shard
        const newResults = results.map(result => ({
            urlId: result.url,
            timestamps: [result.timestamp],
            statuses: [result.status]
        }));
        
        await databases.createDocument(
            DATABASE_ID,
            RESULTS_COLLECTION_ID,
            shardId,
            {
                userId,
                date: today,
                shardId,
                results: newResults
            }
        );
    }
}