import { databases, ID } from '$lib/appwrite';
import type { Log, PingURL } from '$lib/types';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = 'ping_urls';

export const urlService = {
	async createURL(url: string, userId: string): Promise<PingURL> {
		 // Normalize URL (add https if missing)
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

		const data = {
			url: normalizedUrl,
			userId,
			isEnabled: true,
			lastPingTime: new Date().toISOString(),
			lastPingStatus: '',
			lastPingStatusCode: null,
			successCount: 0,
			logs: []
		};

		const response = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);

		return response;
	},

	async getURLs(userId: string, limit: number = 100): Promise<PingURL[]> {
		const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
			Query.equal('userId', userId),
			Query.limit(limit)
		]);

		return response.documents;
	},

	async updateURL(id: string, data: Partial<PingURL>): Promise<PingURL> {
		const response = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, data);
		return response;
	},

	async deleteURL(id: string): Promise<void> {
		await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
	},

	async togglePing(
		id: string,
		url: string,
		isEnabled: boolean,
		userId: string
	): Promise<PingURL> {
		if (!id) {
			// No existing URL, create one
			if (isEnabled) {
				return await this.createURL(appName, endpoint, userId);
			}
			return null;
		} else {
			// Update existing URL
			return await this.updateURL(id, { isEnabled });
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

		const logs = [...(url.logs || []), newLog].slice(-100); // Keep last 100 logs

		await this.updateURL(urlId, { logs });
	},

	async reportClientPings(
		urlId: string,
		results: Array<{ success: boolean; timestamp: string; status: number }>
	): Promise<void> {
		if (results.length === 0) return;

		try {
			const url = await databases.getDocument(DATABASE_ID, URLS_COLLECTION_ID, urlId);

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
