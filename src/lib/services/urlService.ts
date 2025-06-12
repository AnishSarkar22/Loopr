import { databases, ID } from '$lib/appwrite';
import type { Log, PingURL, PingURLDatabase } from '$lib/types';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_COLLECTION_ID;

// Helper functions for data transformation
function dbToApp(dbData: PingURLDatabase): PingURL {
    return {
        ...dbData,
        id: dbData.$id,
        logs: JSON.parse(dbData.logs || '[]')
    };
}

function appToDb(appData: Partial<PingURL>): Partial<PingURLDatabase> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id: _id, logs, ...dbData } = appData;
	return {
		...dbData,
		...(logs && { logs: JSON.stringify(logs) })
	};
}

export const urlService = {
	async createURL(
        url: string, 
        userId: string, 
        name?: string, 
        pingInterval?: number, 
        description?: string
    ): Promise<PingURL> {
		 // Normalize URL (add https if missing)
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

		const data = {
			url: normalizedUrl,
            userId,
            isEnabled: false, // Start disabled by default for safety
            lastPingTime: '',
            lastPingStatus: '',
            lastPingStatusCode: null,
            successCount: 0,
            logs: JSON.stringify([]),
            pingInterval: pingInterval || 15,
            nextPingTime: new Date().toISOString(),
            ...(name && { name }),
            ...(description && { description })
		};

		const response = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);
		return dbToApp(response);
	},

	async getURLs(userId: string, limit: number = 100): Promise<PingURL[]> {
		const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
			Query.equal('userId', userId),
            Query.limit(limit),
            Query.orderDesc('$createdAt')
		]);

		// Map all documents using the helper function
        return response.documents.map(dbToApp);
	},

	async getURL(urlId: string): Promise<PingURL> {
        const response = await databases.getDocument(DATABASE_ID, COLLECTION_ID, urlId);
        return dbToApp(response);
    },

	// async updateURL(id: string, data: Partial<PingURL>): Promise<PingURL> {
	// 	const response = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, data);
	// 	return response;
	// },
	async updateURL(id: string, data: Partial<PingURL>): Promise<PingURL> {
        // Use helper function to convert app data to database format
        const updateData = appToDb(data);
        
        const response = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, updateData);
        return dbToApp(response);
    },

	async deleteURL(id: string): Promise<void> {
		await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
	},

	async toggleURL(id: string, isEnabled: boolean): Promise<PingURL> {
        const updateData: Partial<PingURL> = { 
            isEnabled,
            // Set next ping time if enabling
            ...(isEnabled && { nextPingTime: new Date().toISOString() })
        };
        return await this.updateURL(id, updateData);
    },

	async togglePing(
		id: string,
		url: string,
		isEnabled: boolean,
		userId: string
	): Promise<PingURL> {
        if (!id) {
            if (isEnabled) {
                return await this.createURL(url, userId);
            }
            throw new Error('Cannot create disabled URL');
        } else {
            return await this.toggleURL(id, isEnabled);
        }
    },

	async addLog(
		urlId: string,
		message: string,
		type: 'success' | 'error' | 'warning' | 'info'
	): Promise<void> {
		const url = await databases.getDocument(DATABASE_ID, COLLECTION_ID, urlId);

		const newLog: Log = {
			timestamp: new Date().toISOString(),
			message,
			type
		};

		// Parse existing logs, add new log, and keep last 100
        const existingLogs = JSON.parse(url.logs || '[]');
        const logs = [...existingLogs, newLog].slice(-100);

		// Update with stringified logs
		await this.updateURL(urlId, { logs });
	},

	async reportClientPings(
		urlId: string,
		results: Array<{ success: boolean; timestamp: string; status: number }>
	): Promise<void> {
		if (results.length === 0) return;

		try {
			const url = await databases.getDocument(DATABASE_ID, COLLECTION_ID, urlId);

			// Update success count
			const additionalSuccesses = results.filter((r) => r.success).length;
			const newSuccessCount = url.successCount + additionalSuccesses;

			// Find most recent ping
			const sortedResults = [...results].sort(
				(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);
			const latestResult = sortedResults[0];

			// Update URL document
			await this.updateURL(urlId, {
				lastPingTime: latestResult.timestamp,
				lastPingStatus: latestResult.success ? 'success' : 'error',
				lastPingStatusCode: latestResult.status,
				successCount: newSuccessCount
			});

			// Add a log entry
			await this.addLog(
				urlId,
				`Processed ${results.length} client pings (${additionalSuccesses} successful)`,
				'info'
			);
		} catch (error) {
			console.error('Failed to report client pings:', error);
		}
	}
};
