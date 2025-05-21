import { databases, functions, ID } from '$lib/appwrite';
import type { Log, PingURL } from '$lib/types';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = 'ping_urls';
const PING_FUNCTION_ID = import.meta.env.VITE_PING_FUNCTION_ID;

export const urlService = {
	async createURL(appName: string, endpoint: string, userId: string): Promise<PingURL> {
		// Construct the full URL
		const url = `https://${appName}.onrender.com/${endpoint || ''}`;

		// Allow for custom full URLs:
		// const url = appName.includes('://')
		// 	? `${appName}${endpoint ? `/${endpoint}` : ''}`
		// 	: `https://${appName}.onrender.com/${endpoint || ''}`;

		const data = {
			url,
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

	async getURLs(userId: string): Promise<PingURL[]> {
		const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
			Query.equal('userId', userId)
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
		appName: string,
		endpoint: string,
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

	async executePingFunction(urlId: string): Promise<void> {
		await functions.createExecution(PING_FUNCTION_ID, JSON.stringify({ urlId }), false);
	}
};
