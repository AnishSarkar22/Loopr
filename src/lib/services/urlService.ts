import { databases, ID } from '$lib/appwrite';
import type { Log, PingURL, PingURLDatabase } from '$lib/types';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_COLLECTION_ID;

// Helper function to format ping interval for display
export function formatPingInterval(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
	} else if (minutes < 1440) {
		const hours = minutes / 60;
		return `${hours} hour${hours !== 1 ? 's' : ''}`;
	} else {
		const days = minutes / 1440;
		return `${days} day${days !== 1 ? 's' : ''}`;
	}
}

// Helper functions for data transformation
function dbToApp(dbData: PingURLDatabase): PingURL {
	// Parse logs if they exist and are a string
	let parsedLogs = [];
	if (dbData.logs) {
		try {
			parsedLogs = typeof dbData.logs === 'string' ? JSON.parse(dbData.logs) : dbData.logs;
		} catch (error) {
			console.error('Failed to parse logs:', error);
			parsedLogs = [];
		}
	}

	return {
		...dbData,
		id: dbData.$id,
		logs: parsedLogs
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

function calculateNextPingTime(pingInterval: number): string {
	const nextPing = new Date();
	const intervalMinutes = parseInt(pingInterval.toString()) || 15;

	// Add interval in minutes
	nextPing.setMinutes(nextPing.getMinutes() + intervalMinutes);

	// Return ISO string - Appwrite will handle DateTime conversion
	const isoString = nextPing.toISOString();

	console.log(`Calculating nextPingTime: interval=${intervalMinutes}min, result=${isoString}`);
	return isoString;
}

function calculateShardKey(userId: string): number {
	// Simple hash-based sharding
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		const char = userId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	// Start with 4 shards (0, 1, 2, 3) - can expand later
	return Math.abs(hash) % 4;
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

		// Calculate initial next ping time based on interval
		const interval = pingInterval || 15;

		const data = {
			url: normalizedUrl,
			userId,
			isEnabled: false, // Start disabled by default for safety
			lastPingTime: '',
			lastPingStatus: '',
			lastPingStatusCode: null,
			lastResponseTime: 0,
			totalPings: 0,
			successCount: 0,
			logs: JSON.stringify([]),
			pingInterval: interval,
			nextPingTime: null,
			lastError: null,
			shardKey: calculateShardKey(userId), // User-based sharding
			// shardKey: 0, (when calculateShardKey is not required - for simple cases)
			nodeId: null,
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

	async toggleURL(id: string, isEnabled: boolean): Promise<PingURL> {
		// Get current URL to access its pingInterval
		const currentUrl = await this.getURL(id);

		const updateData: Partial<PingURL> = {
			isEnabled,
			// Set next ping time if enabling, clear if disabling
			nextPingTime: isEnabled ? calculateNextPingTime(currentUrl.pingInterval || 15) : null
		};
		if (isEnabled && !currentUrl.nodeId) {
			console.log(
				`Enabling URL ${id} without nodeId - will be assigned by node registration function`
			);
			// Keep nodeId as null - the node registration function will assign it
		}
		return await this.updateURL(id, updateData);
	},

	async updateURL(id: string, data: Partial<PingURL>): Promise<PingURL> {
		const dbData = appToDb(data);

		// Handle enabling/disabling logic
		if (dbData.isEnabled !== undefined) {
			if (dbData.isEnabled) {
				// When enabling, calculate nextPingTime if not already set
				const currentUrl = await this.getURL(id);
				const interval = dbData.pingInterval || currentUrl.pingInterval || 15;
				dbData.nextPingTime = calculateNextPingTime(interval);
			} else {
				// When disabling, clear nextPingTime
				dbData.nextPingTime = null;
			}
		}

		// If pingInterval is being updated and URL is enabled, recalculate nextPingTime
		if (dbData.pingInterval !== undefined) {
			const currentUrl = await this.getURL(id);
			if (currentUrl.isEnabled || dbData.isEnabled) {
				dbData.nextPingTime = calculateNextPingTime(dbData.pingInterval);
			}
		}

		// If nextPingTime is being manually set, ensure it's in the correct format
		if (data.nextPingTime) {
			const nextPingDate = new Date(data.nextPingTime);
			if (!isNaN(nextPingDate.getTime())) {
				// Ensure we always use ISO string format for DateTime attributes
				dbData.nextPingTime = nextPingDate.toISOString();
			} else {
				console.error('Invalid nextPingTime provided:', data.nextPingTime);
				// Don't update if invalid
				delete dbData.nextPingTime;
			}
		}

		// Only update specific fields to avoid overwriting server-side updates
		// Remove any undefined values to prevent overwriting existing data
		const cleanedData = Object.fromEntries(
			Object.entries(dbData).filter(([key, value]) => {
				// Always allow these fields to be updated
				const allowedClientFields = [
					'name',
					'description',
					'url',
					'isEnabled',
					'pingInterval',
					'nextPingTime'
				];

				// server-side fields
				const allowedServerFields = [
					'lastPingTime',
					'lastPingStatus',
					'lastPingStatusCode',
					'lastResponseTime',
					'successCount',
					'totalPings',
					'lastError',
					'nodeId',
					'logs' // NEW: Allow logs from server
				];

				// Don't send undefined values and preserve server-only fields
				return (
					value !== undefined &&
					(allowedClientFields.includes(key) ||
						allowedServerFields.includes(key) ||
						// Allow if it's explicitly provided in the original data
						Object.hasOwn(data, key as keyof PingURL))
				);
			})
		);
		console.log('Updating URL with data:', cleanedData);

		const response = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, cleanedData);
		return dbToApp(response);
	},

	async deleteURL(id: string): Promise<void> {
		await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
	},

	async togglePing(id: string, url: string, isEnabled: boolean, userId: string): Promise<PingURL> {
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
	},

	async fixMissingNextPingTimes(userId: string): Promise<void> {
		try {
			console.log('Fixing missing nextPingTimes for user:', userId);

			const urls = await this.getURLs(userId);
			const now = new Date();

			const urlsToFix = urls.filter((url) => {
				if (!url.isEnabled) return false;

				const needsFix =
					!url.nextPingTime || url.nextPingTime === 'n/a' || new Date(url.nextPingTime) <= now; // Past or invalid time

				if (needsFix) {
					console.log(`URL ${url.id} needs fix. Current nextPingTime:`, url.nextPingTime);
				}

				return needsFix;
			});

			if (urlsToFix.length > 0) {
				console.log(`Fixing ${urlsToFix.length} URLs with missing/invalid nextPingTime`);

				const updates = urlsToFix.map(async (url) => {
					const newNextPingTime = calculateNextPingTime(url.pingInterval || 15);
					console.log(`Fixing URL ${url.id}: ${url.nextPingTime} -> ${newNextPingTime}`);

					return this.updateURL(url.id!, {
						nextPingTime: newNextPingTime
					});
				});

				await Promise.all(updates);
				console.log('Successfully fixed all URLs');
			}
		} catch (error) {
			console.error('Failed to fix missing nextPingTimes:', error);
		}
	}
};
