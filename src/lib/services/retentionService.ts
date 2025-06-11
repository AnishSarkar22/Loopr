import { databases } from '$lib/appwrite';
import { DATABASE_ID, RESULTS_COLLECTION_ID } from '$lib/config';
import { Query } from 'appwrite';

export const retentionService = {
  /**
   * Apply retention policy to user data
   * @param userId User ID to apply retention for
   * @param isPremium Whether this is a premium user
   */
  async applyRetentionPolicy(userId: string, isPremium: boolean = false): Promise<void> {
    // Set retention period based on user tier
    const MAX_RETENTION_DAYS = isPremium ? 30 : 15;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
    const cutoffString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find old result shards for this user
    const oldShards = await databases.listDocuments(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.lessThan('date', cutoffString)
      ],
      100
    );
    
    // Delete old shards
    if (oldShards.documents.length > 0) {
      await Promise.all(
        oldShards.documents.map(doc =>
          databases.deleteDocument(
            DATABASE_ID,
            RESULTS_COLLECTION_ID,
            doc.$id
          )
        )
      );
    }
    
    // Additionally, for non-premium users, trim shards to keep size under control
    if (!isPremium) {
      const recentShards = await databases.listDocuments(
        DATABASE_ID,
        RESULTS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.greaterThanEqual('date', cutoffString)
        ],
        25
      );
      
      // For each shard, reduce the history length
      for (const shard of recentShards.documents) {
        // Keep only 24 hours of data (96 entries for 15-minute intervals)
        const MAX_ENTRIES_PER_URL = 96;
        
        const trimmedResults = shard.results.map(urlResult => ({
          urlId: urlResult.urlId,
          timestamps: urlResult.timestamps.slice(-MAX_ENTRIES_PER_URL),
          statuses: urlResult.statuses.slice(-MAX_ENTRIES_PER_URL)
        }));
        
        await databases.updateDocument(
          DATABASE_ID,
          RESULTS_COLLECTION_ID,
          shard.$id,
          { results: trimmedResults }
        );
      }
    }
  }
};