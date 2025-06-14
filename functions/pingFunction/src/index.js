// for ping Function - Dynamic Batch Processing

import { Client, Databases, Query } from 'appwrite';

export default async function ({ res }) {
	const client = new Client()
		.setEndpoint('https://cloud.appwrite.io/v1')
		.setProject(process.env.APPWRITE_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_ENDPOINT);

	const databases = new Databases(client);
	const nodeId = process.env.NODE_ID || `node-${Math.floor(Math.random() * 5) + 1}`;
	const now = new Date().toISOString();

	// Dynamic processing based on available time
	const FUNCTION_TIMEOUT = 300; // 5 minutes
	const PROCESSING_BUFFER = 30; // 30 seconds buffer
	const AVAILABLE_TIME = FUNCTION_TIMEOUT - PROCESSING_BUFFER;

	let totalProcessed = 0;
	let offset = 0;
	const BATCH_SIZE = 50; // Process in chunks

	const startTime = Date.now();

	try {
		while (true) {
			// Check remaining time
			const elapsed = (Date.now() - startTime) / 1000;
			if (elapsed > AVAILABLE_TIME) {
				console.log(`Time limit reached. Processed ${totalProcessed} URLs.`);
				break;
			}

			// Get next batch of due URLs
			const urlsDue = await databases.listDocuments(
				process.env.DATABASE_ID,
				process.env.URLS_COLLECTION_ID,
				[
					Query.equal('nodeId', nodeId),
					Query.equal('isEnabled', true),
					Query.lessThanEqual('nextPingTime', now),
					Query.limit(BATCH_SIZE),
					Query.offset(offset)
				]
			);

			if (urlsDue.documents.length === 0) {
				console.log(`No more URLs to process. Total: ${totalProcessed}`);
				break;
			}

			// Process this batch efficiently
			await processBatch(databases, urlsDue.documents);

			totalProcessed += urlsDue.documents.length;
			offset += urlsDue.documents.length;

			// If we got fewer than batch size, we're done
			if (urlsDue.documents.length < BATCH_SIZE) break;
		}

		return res.json({
			success: true,
			processed: totalProcessed,
			timestamp: now,
			nodeId: nodeId,
			processingTime: (Date.now() - startTime) / 1000
		});
	} catch (error) {
		console.error('Error in ping function:', error);
		return res.json(
			{
				success: false,
				error: error.message,
				processed: totalProcessed
			},
			500
		);
	}
}

async function processBatch(databases, urlDocuments) {
	// Process URLs in smaller parallel chunks to avoid memory issues
	const PARALLEL_CHUNK_SIZE = 10;

	// Collect all updates first, then batch them (more efficient)
	const allUrlUpdates = [];
	const allResultsByUser = {};

	for (let i = 0; i < urlDocuments.length; i += PARALLEL_CHUNK_SIZE) {
		const chunk = urlDocuments.slice(i, i + PARALLEL_CHUNK_SIZE);

		try {
			// Ping URLs in parallel
			const pingResults = await Promise.all(chunk.map((doc) => pingUrl(doc.url, doc.$id)));

			// Group results and updates for this chunk
			const resultsByUser = {};
			const urlUpdates = [];

			for (const result of pingResults) {
				const urlDoc = chunk.find((doc) => doc.$id === result.urlId);
				if (!urlDoc) continue;

				// Group by user with pingInterval info
				const userId = urlDoc.userId;
				if (!resultsByUser[userId]) {
					resultsByUser[userId] = [];
				}
				resultsByUser[userId].push({
					...result,
					pingInterval: urlDoc.pingInterval || '15m'
				});

				// Calculate next ping time
				const nextPingTime = calculateNextPingTime(urlDoc.pingInterval || '15m');

				urlUpdates.push({
					id: urlDoc.$id,
					data: {
						lastPingTime: result.timestamp,
						lastPingStatus: result.success ? 'success' : 'error',
						lastPingStatusCode: result.status,
						lastResponseTime: result.responseTime,
						nextPingTime: nextPingTime.toISOString(),
						successCount: (urlDoc.successCount || 0) + (result.success ? 1 : 0),
						totalPings: (urlDoc.totalPings || 0) + 1,
						lastError: result.error || null
					}
				});
			}

			// Collect instead of immediately storing
			allUrlUpdates.push(...urlUpdates);

			// Merge results by user
			for (const [userId, results] of Object.entries(resultsByUser)) {
				if (!allResultsByUser[userId]) {
					allResultsByUser[userId] = [];
				}
				allResultsByUser[userId].push(...results);
			}
		} catch (error) {
			console.error(`Error processing chunk starting at index ${i}:`, error);
			// Continue with next chunk instead of failing entire batch
			continue;
		}
	}

	// Store all at once (more efficient)
	if (allUrlUpdates.length > 0 || Object.keys(allResultsByUser).length > 0) {
		await Promise.all([
			storeResultsByUser(databases, allResultsByUser),
			updateUrlsInBatches(databases, allUrlUpdates, 25)
		]);
	}
}

// Helper function to calculate next ping time based on user's interval choice
function calculateNextPingTime(pingInterval) {
	const nextPing = new Date();

	switch (pingInterval) {
		case '5m':
			nextPing.setMinutes(nextPing.getMinutes() + 5);
			break;
		case '10m':
			nextPing.setMinutes(nextPing.getMinutes() + 10);
			break;
		case '15m':
			nextPing.setMinutes(nextPing.getMinutes() + 15);
			break;
		case '30m':
			nextPing.setMinutes(nextPing.getMinutes() + 30);
			break;
		case '1h':
			nextPing.setHours(nextPing.getHours() + 1);
			break;
		case '3h':
			nextPing.setHours(nextPing.getHours() + 3);
			break;
		case '6h':
			nextPing.setHours(nextPing.getHours() + 6);
			break;
		case '12h':
			nextPing.setHours(nextPing.getHours() + 12);
			break;
		case '24h':
			nextPing.setHours(nextPing.getHours() + 24);
			break;
		default:
			nextPing.setMinutes(nextPing.getMinutes() + 15); // Default 15 minutes
	}

	return nextPing;
}

// Helper function to ping a URL
async function pingUrl(url, urlId) {
	const startTime = Date.now();

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'Loopr-Monitor/1.0'
			},
			signal: AbortSignal.timeout(30000) // 30 second timeout
		});

		const responseTime = Date.now() - startTime;

		return {
			urlId,
			url,
			status: response.status,
			success: response.ok,
			responseTime,
			timestamp: new Date().toISOString(),
			error: null
		};
	} catch (error) {
		const responseTime = Date.now() - startTime;

		return {
			urlId,
			url,
			status: 0,
			success: false,
			responseTime,
			timestamp: new Date().toISOString(),
			error: error.message
		};
	}
}

async function updateUrlsInBatches(databases, urlUpdates, batchSize = 25) {
	const consolidatedUpdates = {};

	for (const update of urlUpdates) {
		if (!consolidatedUpdates[update.id]) {
			consolidatedUpdates[update.id] = update.data;
		} else {
			consolidatedUpdates[update.id] = {
				...consolidatedUpdates[update.id],
				...update.data,
				successCount: Math.max(
					consolidatedUpdates[update.id].successCount || 0,
					update.data.successCount || 0
				),
				totalPings: Math.max(
					consolidatedUpdates[update.id].totalPings || 0,
					update.data.totalPings || 0
				)
			};
		}
	}

	const finalUpdates = Object.entries(consolidatedUpdates).map(([id, data]) => ({
		id,
		data
	}));

	for (let i = 0; i < finalUpdates.length; i += batchSize) {
		const batch = finalUpdates.slice(i, i + batchSize);
		await Promise.all(
			batch.map((update) =>
				databases.updateDocument(
					process.env.DATABASE_ID,
					process.env.URLS_COLLECTION_ID,
					update.id,
					update.data
				)
			)
		);
	}
}

// Enhanced storeResultsByUser function with response times
async function storeResultsByUser(databases, resultsByUser) {
	const batches = [];

	for (const [userId, results] of Object.entries(resultsByUser)) {
		const today = new Date().toISOString().split('T')[0];
		const shardId = `${userId}_${today}`;

		try {
			const existingShard = await databases.getDocument(
				process.env.DATABASE_ID,
				process.env.RESULTS_COLLECTION_ID,
				shardId
			);

			const updatedResults = [...existingShard.results];
			for (const result of results) {
				const existingUrlIdx = updatedResults.findIndex((r) => r.urlId === result.urlId);
				if (existingUrlIdx >= 0) {
					// Adjust MAX_HISTORY based on ping frequency to save space
					let MAX_HISTORY = 288; // Default for 5-minute intervals (24 hours)

					// Store less history for more frequent pings to save storage
					if (result.pingInterval === '5m')
						MAX_HISTORY = 288; // 24 hours
					else if (result.pingInterval === '10m')
						MAX_HISTORY = 144; // 24 hours
					else if (result.pingInterval === '15m')
						MAX_HISTORY = 96; // 24 hours
					else if (result.pingInterval === '30m')
						MAX_HISTORY = 48; // 24 hours
					else if (result.pingInterval === '1h')
						MAX_HISTORY = 168; // 7 days
					else if (result.pingInterval === '3h')
						MAX_HISTORY = 168; // 21 days
					else if (result.pingInterval === '6h')
						MAX_HISTORY = 168; // 42 days
					else if (result.pingInterval === '12h')
						MAX_HISTORY = 168; // 84 days
					else if (result.pingInterval === '24h') MAX_HISTORY = 365; // 1 year

					updatedResults[existingUrlIdx].timestamps.push(result.timestamp);
					updatedResults[existingUrlIdx].statuses.push(result.status);
					updatedResults[existingUrlIdx].responseTimes =
						updatedResults[existingUrlIdx].responseTimes || [];
					updatedResults[existingUrlIdx].responseTimes.push(result.responseTime);

					if (updatedResults[existingUrlIdx].timestamps.length > MAX_HISTORY) {
						updatedResults[existingUrlIdx].timestamps =
							updatedResults[existingUrlIdx].timestamps.slice(-MAX_HISTORY);
						updatedResults[existingUrlIdx].statuses =
							updatedResults[existingUrlIdx].statuses.slice(-MAX_HISTORY);
						updatedResults[existingUrlIdx].responseTimes =
							updatedResults[existingUrlIdx].responseTimes.slice(-MAX_HISTORY);
					}
				} else {
					updatedResults.push({
						urlId: result.urlId,
						timestamps: [result.timestamp],
						statuses: [result.status],
						responseTimes: [result.responseTime]
					});
				}
			}

			const MAX_URLS_PER_SHARD = 50;

			if (updatedResults.length > MAX_URLS_PER_SHARD) {
				const shardCounter = existingShard.counter || 0;
				const newShardId = `${userId}_${today}_${shardCounter + 1}`;

				const halfPoint = Math.floor(updatedResults.length / 2);
				const firstHalf = updatedResults.slice(0, halfPoint);
				const secondHalf = updatedResults.slice(halfPoint);

				batches.push(
					databases.updateDocument(
						process.env.DATABASE_ID,
						process.env.RESULTS_COLLECTION_ID,
						shardId,
						{
							results: JSON.stringify(firstHalf),
							counter: shardCounter + 1
						}
					)
				);

				batches.push(
					databases.createDocument(
						process.env.DATABASE_ID,
						process.env.RESULTS_COLLECTION_ID,
						newShardId,
						{
							userId,
							date: today,
							shardId: newShardId,
							results: JSON.stringify(secondHalf)
						}
					)
				);
			} else {
				batches.push(
					databases.updateDocument(
						process.env.DATABASE_ID,
						process.env.RESULTS_COLLECTION_ID,
						shardId,
						{
							results: JSON.stringify(updatedResults)
						}
					)
				);
			}
		} catch {
			const newResults = results.map((result) => ({
				urlId: result.urlId,
				timestamps: [result.timestamp],
				statuses: [result.status],
				responseTimes: [result.responseTime]
			}));

			batches.push(
				databases.createDocument(
					process.env.DATABASE_ID,
					process.env.RESULTS_COLLECTION_ID,
					shardId,
					{
						userId,
						date: today,
						shardId,
						results: JSON.stringify(newResults)
					}
				)
			);
		}
	}

	await Promise.all(batches);
}
