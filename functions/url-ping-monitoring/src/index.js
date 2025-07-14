// for url ping monitoring - Dynamic Batch Processing

/*
Copyright (C) 2025 Anish Sarkar
This file is part of Loopr.
Loopr is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Loopr is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Loopr.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Client, Databases, Query, Messaging, ID, Users } from 'node-appwrite';
import fetch from 'node-fetch';

export default async function ({ res }) {
	console.log('=== PING MONITORING FUNCTION STARTED ===');

	const client = new Client()
		.setEndpoint('https://cloud.appwrite.io/v1')
		.setProject(process.env.APPWRITE_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY);

	const databases = new Databases(client);
	const messaging = new Messaging(client);
	const users = new Users(client);
	const nodeId = process.env.NODE_ID || `node-${Math.floor(Math.random() * 5) + 1}`;
	const now = new Date().toISOString();

	console.log(`Node ID: ${nodeId}`);
	console.log(`Current time: ${now}`);

	// Dynamic processing based on available time
	const FUNCTION_TIMEOUT = parseInt(process.env.FUNCTION_TIMEOUT) || 300; // 5 minutes
	const PROCESSING_BUFFER = parseInt(process.env.PROCESSING_BUFFER) || 30; // 30 seconds buffer
	const AVAILABLE_TIME = FUNCTION_TIMEOUT - PROCESSING_BUFFER;

	let totalProcessed = 0;
	let offset = 0;
	const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 100; // Process in chunks

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
			await processBatch(databases, urlsDue.documents, messaging, users);

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

async function processBatch(databases, urlDocuments, messaging, users) {
	// Process URLs in smaller parallel chunks to avoid memory issues
	const PARALLEL_CHUNK_SIZE = parseInt(process.env.PARALLEL_CHUNK_SIZE) || 25;

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

				// EMAIL NOTIFICATIONS (using appwrite messaging)

				// Check if this is a new failure and user wants notifications
				// if (!result.success && urlDoc.lastPingStatus === 'success') {
				if (!result.success) {
					console.log(
						`Triggering email notification for user ${urlDoc.userId} and URL ${urlDoc.url}`
					);
					// This is a new failure, send notification
					await sendFailureNotification(databases, messaging, users, urlDoc, result);
				}

				// Group by user with pingInterval info
				const userId = urlDoc.userId;
				if (!resultsByUser[userId]) {
					resultsByUser[userId] = [];
				}
				resultsByUser[userId].push({
					...result,
					pingInterval: urlDoc.pingInterval || 15
				});

				// Calculate next ping time
				// const nextPingTime = calculateNextPingTime(urlDoc.pingInterval || 15);

				// Create log entry
				const logMessage = result.success
					? `Ping successful (${result.status}) - ${result.responseTime}ms`
					: `Ping failed (${result.status || 'timeout'}) - ${result.error || 'Unknown error'}`;

				const logType = result.success ? 'success' : 'error';

				// Parse existing logs and add new one
				const existingLogs = JSON.parse(urlDoc.logs || '[]');
				const newLog = {
					timestamp: result.timestamp,
					message: logMessage,
					type: logType
				};

				// Store only limited number of logs
				const MAX_LOGS = parseInt(process.env.MAX_LOGS_PER_URL) || 100;
				const updatedLogs = [...existingLogs, newLog].slice(-MAX_LOGS);

				console.log('Debug URL update data:', {
					urlId: urlDoc.$id,
					originalTimestamp: result.timestamp,
					convertedTimestamp: new Date(result.timestamp).toISOString(),
					success: result.success,
					status: result.status,
					responseTime: result.responseTime
				});

				urlUpdates.push({
					id: urlDoc.$id,
					data: {
						lastPingTime: new Date(result.timestamp).toISOString(),
						lastPingStatus: result.success ? 'success' : 'error',
						lastPingStatusCode: parseInt(result.status) || 0,
						lastResponseTime: parseInt(result.responseTime) || 0,
						nextPingTime: calculateNextPingTime(urlDoc.pingInterval || 15),
						successCount: (parseInt(urlDoc.successCount) || 0) + (result.success ? 1 : 0),
						totalPings: (parseInt(urlDoc.totalPings) || 0) + 1,
						lastError: result.error || null,
						logs: JSON.stringify(updatedLogs)
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
		const updateBatchSize = parseInt(process.env.UPDATE_BATCH_SIZE) || 75;
		await Promise.all([
			storeResultsByUser(databases, allResultsByUser),
			updateUrlsInBatches(databases, allUrlUpdates, updateBatchSize)
		]);
	}
}

// Helper function to calculate next ping time based on user's interval choice
function calculateNextPingTime(pingInterval) {
	const nextPing = new Date();
	const intervalMinutes = parseInt(pingInterval) || 15;

	// Add the interval in minutes
	nextPing.setMinutes(nextPing.getMinutes() + intervalMinutes);

	// Return ISO string for DateTime field
	const isoString = nextPing.toISOString();

	console.log(`Server: Next ping scheduled in ${intervalMinutes} minutes: ${isoString}`);

	return isoString;
}

// Helper function to ping a URL
async function pingUrl(url, urlId) {
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Loopr-Monitor/1.0'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

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
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        console.error('Ping error:', error);
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

async function updateUrlsInBatches(databases, urlUpdates, batchSize = 50) {
	const consolidatedUpdates = {};

	// Group updates by URL ID to avoid duplicate calls
	for (const update of urlUpdates) {
		consolidatedUpdates[update.id] = {
			...consolidatedUpdates[update.id],
			...update.data
		};
	}

	const finalUpdates = Object.entries(consolidatedUpdates).map(([id, data]) => ({
		id,
		data
	}));

	// Process in larger batches
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

// Add this new helper function
async function upsertShardDocument(databases, shardId, data) {
	try {
		return await databases.createDocument(
			process.env.DATABASE_ID,
			process.env.RESULTS_COLLECTION_ID,
			shardId,
			data
		);
	} catch (error) {
		if (error.message.includes('already exists')) {
			// Document exists, update instead
			const existing = await databases.getDocument(
				process.env.DATABASE_ID,
				process.env.RESULTS_COLLECTION_ID,
				shardId
			);

			const mergedResults = mergeResults(
				JSON.parse(existing.results || '[]'),
				JSON.parse(data.results)
			);

			return await databases.updateDocument(
				process.env.DATABASE_ID,
				process.env.RESULTS_COLLECTION_ID,
				shardId,
				{ results: JSON.stringify(mergedResults) }
			);
		}
		throw error;
	}
}

// Add this helper function for merging results
function mergeResults(existingResults, newResults) {
	const resultMap = new Map();

	// Add existing results to map
	existingResults.forEach((result) => {
		resultMap.set(result.urlId, result);
	});

	// Merge new results
	newResults.forEach((newResult) => {
		if (resultMap.has(newResult.urlId)) {
			const existing = resultMap.get(newResult.urlId);
			existing.timestamps = [...existing.timestamps, ...newResult.timestamps];
			existing.statuses = [...existing.statuses, ...newResult.statuses];
			existing.responseTimes = [...existing.responseTimes, ...newResult.responseTimes];
		} else {
			resultMap.set(newResult.urlId, { ...newResult });
		}
	});

	return Array.from(resultMap.values());
}

// Enhanced storeResultsByUser function with response times
async function storeResultsByUser(databases, resultsByUser) {
	const batches = [];

	for (const [userId, results] of Object.entries(resultsByUser)) {
		const today = new Date().toISOString().split('T')[0];
		const shardId = `${userId}_${today}`;

		try {
			// Try to get existing document first
			let existingShard;
			try {
				existingShard = await databases.getDocument(
					process.env.DATABASE_ID,
					process.env.RESULTS_COLLECTION_ID,
					shardId
				);
			} catch {
				// Document doesn't exist, we'll create it
				existingShard = null;
			}

			if (existingShard) {
				// Update existing document
				let updatedResults = [];
				try {
					if (typeof existingShard.results === 'string') {
						updatedResults = JSON.parse(existingShard.results);
					} else if (Array.isArray(existingShard.results)) {
						updatedResults = [...existingShard.results];
					} else {
						console.warn('Unexpected results format:', typeof existingShard.results);
						updatedResults = [];
					}
				} catch (parseError) {
					console.error('Failed to parse existing results:', parseError);
					updatedResults = [];
				}

				// Ensure updatedResults is an array
				if (!Array.isArray(updatedResults)) {
					console.warn('Results is not an array, resetting to empty array');
					updatedResults = [];
				}

				for (const result of results) {
					const existingUrlIdx = updatedResults.findIndex((r) => r.urlId === result.urlId);
					if (existingUrlIdx >= 0) {
						// Determine MAX_HISTORY based on ping interval

						// use the below commented code on more capable server

						// if (result.pingInterval <= 5)
						// 	MAX_HISTORY = 288; // 24 hours
						// else if (result.pingInterval <= 10)
						// 	MAX_HISTORY = 144; // 24 hours
						// else if (result.pingInterval <= 15)
						// 	MAX_HISTORY = 96; // 24 hours
						// else if (result.pingInterval <= 30)
						// 	MAX_HISTORY = 48; // 24 hours
						// else if (result.pingInterval <= 60)
						// 	MAX_HISTORY = 168; // 7 days
						// else if (result.pingInterval <= 180)
						// 	MAX_HISTORY = 168; // 21 days
						// else if (result.pingInterval <= 360)
						// 	MAX_HISTORY = 168; // 42 days
						// else if (result.pingInterval <= 720)
						// 	MAX_HISTORY = 168; // 84 days
						// else if (result.pingInterval <= 1440) MAX_HISTORY = 365; // 365 days

						let MAX_HISTORY;
						if (result.pingInterval <= 5)
							MAX_HISTORY = 144; // 12 hours
						else if (result.pingInterval <= 10)
							MAX_HISTORY = 72; // 12 hours
						else if (result.pingInterval <= 15)
							MAX_HISTORY = 48; // 12 hours
						else if (result.pingInterval <= 30)
							MAX_HISTORY = 24; // 12 hours
						else if (result.pingInterval <= 60)
							MAX_HISTORY = 84; // 3.5 days
						else if (result.pingInterval <= 180)
							MAX_HISTORY = 84; // 10.5 days
						else if (result.pingInterval <= 360)
							MAX_HISTORY = 84; // 21 days
						else if (result.pingInterval <= 720)
							MAX_HISTORY = 84; // 42 days
						else if (result.pingInterval <= 1440) MAX_HISTORY = 90; // 90 days

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

				const resultsJson = JSON.stringify(updatedResults);
				console.log(`Updating existing shard for ${userId}: ${updatedResults.length} URLs`);

				// Simple update without complex sharding for now
				batches.push(
					databases.updateDocument(
						process.env.DATABASE_ID,
						process.env.RESULTS_COLLECTION_ID,
						shardId,
						{
							results: resultsJson
						}
					)
				);
			} else {
				// Create new document with race condition protection
				const newResults = results.map((result) => ({
					urlId: result.urlId,
					timestamps: [result.timestamp],
					statuses: [result.status],
					responseTimes: [result.responseTime]
				}));

				console.log(`Creating new shard for ${userId}: ${newResults.length} URLs`);

				// Use upsert pattern to handle race conditions
				batches.push(
					upsertShardDocument(databases, shardId, {
						userId,
						date: today,
						shardId,
						results: JSON.stringify(newResults)
					})
				);
			}
		} catch (error) {
			console.error(`Error processing results for user ${userId}:`, error);
			// Continue processing other users instead of failing completely
			continue;
		}
	}

	// Execute all batches with error handling
	try {
		await Promise.all(batches);
	} catch (error) {
		console.error('Some batch operations failed:', error);
		// Don't throw - allow function to complete partially
	}
}

// Send failure notifications (EMAIL NOTIFICATIONS)
async function sendFailureNotification(databases, messaging, users, urlDoc, result) {
	try {
		let userEmail;
		try {
			const user = await users.get(urlDoc.userId);
			userEmail = user.email;

			if (!userEmail) {
				console.log(`No email found for user ${urlDoc.userId}`);
				return;
			}
		} catch (userError) {
			console.error(`Failed to get user ${urlDoc.userId}:`, userError);
			return;
		}

		const subject = `🚨 URL Down Alert: ${urlDoc.name || urlDoc.url}`;
		const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h3 style="color: #dc2626;">Oops! We Detected a Problem with Your URL</h3>
  				<p>One of your URL(s) is currently <span style="color: #dc2626;">down</span>.</p>
				
				<div style="height: 24px;"></div>

                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>URL:</strong> ${urlDoc.url}</p>
                    <p><strong>Name:</strong> ${urlDoc.name || 'Unnamed URL'}</p>
                    <p><strong>Status Code:</strong> ${result.status || 'No response'}</p>
                    <p><strong>Error:</strong> ${result.error || 'Unknown error'}</p>
                    <p><strong>Time:</strong> ${
											result.timestamp
												? new Date(result.timestamp).toLocaleString('en-US', {
														year: 'numeric',
														month: 'short',
														day: '2-digit',
														hour: '2-digit',
														minute: '2-digit',
														second: '2-digit',
														hour12: false,
														timeZone: 'UTC'
													}) + ' UTC'
												: 'Unknown'
										}</p>
                </div>
                
                <p><a href="${process.env.APP_URL}/dashboard" 
                     style="background: #4f46e5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
                    View Dashboard
                </a></p>
            </div>
        `;

		await messaging.createEmail(
			ID.unique(), // messageId
			subject, // subject
			htmlContent, // content (HTML)
			[], // topics
			[urlDoc.userId], // users
			[], // targets
			[], // cc
			[], // bcc
			[], // attachments
			false, // draft
			true, // html (boolean - indicates content is HTML)
			new Date(Date.now() + 2000).toISOString() // scheduledAt
		);

		await databases.createDocument(
			process.env.DATABASE_ID,
			process.env.NOTIFICATIONS_COLLECTION_ID,
			ID.unique(),
			{
			userId: urlDoc.userId,
			type: 'url_down',
			message: `The URL ${urlDoc.url} is down. Error: ${result.error || 'Unknown error'}`,
			urlId: urlDoc.$id,
			url: urlDoc.url,
			timestamp: new Date().toISOString(),
			read: false
			}
		);

		console.log(`Notification sent to ${userEmail} for URL ${urlDoc.url}`);
	} catch (error) {
		console.error('Failed to send notification:', error);
		// Don't throw - continue processing other URLs
	}
}
