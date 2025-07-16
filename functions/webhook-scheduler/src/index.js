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

import { Client, Databases, Query } from 'node-appwrite';
import fetch from 'node-fetch';

export default async function ({ res }) {
    console.log('=== WEBHOOK SCHEDULER FUNCTION STARTED ===');

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const now = new Date().toISOString();

    // Dynamic processing based on available time
    const FUNCTION_TIMEOUT = parseInt(process.env.FUNCTION_TIMEOUT) || 300;
    const PROCESSING_BUFFER = parseInt(process.env.PROCESSING_BUFFER) || 30;
    const AVAILABLE_TIME = FUNCTION_TIMEOUT - PROCESSING_BUFFER;

    let totalProcessed = 0;
    let successCount = 0;
    let failureCount = 0;
    let retryCount = 0;
    let offset = 0;
    const BATCH_SIZE = parseInt(process.env.WEBHOOK_BATCH_SIZE) || 50;

    const startTime = Date.now();

    try {
        while (true) {
            // Check remaining time
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > AVAILABLE_TIME) {
                console.log(`Time limit reached. Processed ${totalProcessed} webhooks.`);
                break;
            }

            // Get next batch of due webhooks (ordered by priority then time)
            const dueWebhooks = await databases.listDocuments(
                process.env.DATABASE_ID,
                process.env.WEBHOOKS_COLLECTION_ID,
                [
                    Query.equal('status', 'pending'),
                    Query.lessThanEqual('scheduledTime', now),
                    Query.orderDesc('priority'),
                    Query.orderAsc('scheduledTime'),
                    Query.limit(BATCH_SIZE),
                    Query.offset(offset)
                ]
            );

            if (dueWebhooks.documents.length === 0) {
                console.log(`No more webhooks to process. Total: ${totalProcessed}`);
                break;
            }

            // Process this batch
            const batchResults = await processBatch(databases, dueWebhooks.documents);
            
            totalProcessed += batchResults.processed;
            successCount += batchResults.success;
            failureCount += batchResults.failures;
            retryCount += batchResults.retries;

            offset += dueWebhooks.documents.length;

            // If we got fewer than batch size, we're done
            if (dueWebhooks.documents.length < BATCH_SIZE) break;
        }

        return res.json({
            success: true,
            processed: totalProcessed,
            successful: successCount,
            failed: failureCount,
            retried: retryCount,
            timestamp: now,
            processingTime: (Date.now() - startTime) / 1000
        });

    } catch (error) {
        console.error('Error in webhook scheduler:', error);
        return res.json({
            success: false,
            error: error.message,
            processed: totalProcessed
        }, 500);
    }
}

async function processBatch(databases, webhookDocuments) {
    const PARALLEL_CHUNK_SIZE = parseInt(process.env.WEBHOOK_PARALLEL_CHUNK_SIZE) || 20;
    
    let processed = 0;
    let success = 0;
    let failures = 0;
    let retries = 0;

    // Process webhooks in parallel chunks
    for (let i = 0; i < webhookDocuments.length; i += PARALLEL_CHUNK_SIZE) {
        const chunk = webhookDocuments.slice(i, i + PARALLEL_CHUNK_SIZE);

        try {
            // Execute webhooks in parallel
            const webhookResults = await Promise.all(
                chunk.map(doc => executeWebhook(doc))
            );

            // Batch update all webhook documents
            const updates = [];
            for (let j = 0; j < webhookResults.length; j++) {
                const result = webhookResults[j];
                const doc = chunk[j];
                processed++;

                const updateData = {
                    lastAttempt: new Date().toISOString(),
                    responseStatus: result.status,
                    responseTime: result.responseTime,
                    lastError: result.error
                };

                if (result.success) {
                    updateData.status = 'sent';
                    success++;
                } else {
                    const newRetries = (doc.retries || 0) + 1;
                    const maxRetries = doc.maxRetries || 3;

                    if (newRetries >= maxRetries) {
                        updateData.status = 'failed';
                        updateData.retries = newRetries;
                        failures++;
                    } else {
                        // Schedule retry with exponential backoff
                        const retryDelay = Math.min(300, 60 * Math.pow(2, newRetries)); // Max 5 minutes
                        const retryTime = new Date(Date.now() + retryDelay * 1000);
                        
                        updateData.status = 'pending';
                        updateData.retries = newRetries;
                        updateData.scheduledTime = retryTime.toISOString();
                        retries++;
                    }
                }

                updates.push({
                    id: doc.$id,
                    data: updateData
                });
            }

            // Execute updates in smaller batches
            const UPDATE_BATCH_SIZE = parseInt(process.env.WEBHOOK_UPDATE_BATCH_SIZE) || 25;
            await updateWebhooksInBatches(databases, updates, UPDATE_BATCH_SIZE);

        } catch (error) {
            console.error(`Error processing webhook chunk starting at index ${i}:`, error);
            continue;
        }
    }

    return { processed, success, failures, retries };
}

async function executeWebhook(webhookDoc) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        let headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Loopr-Webhook/1.0'
        };

        // Parse custom headers if provided
        if (webhookDoc.headers) {
            try {
                const customHeaders = JSON.parse(webhookDoc.headers);
                headers = { ...headers, ...customHeaders };
            } catch (parseError) {
                console.warn(`Invalid headers for webhook ${webhookDoc.$id}:`, parseError.message);
            }
        }

        const requestOptions = {
            method: webhookDoc.method || 'POST',
            headers: headers,
            signal: controller.signal
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(requestOptions.method.toUpperCase())) {
            if (webhookDoc.payload) {
                // Try to parse as JSON, fallback to string
                try {
                    JSON.parse(webhookDoc.payload);
                    requestOptions.body = webhookDoc.payload;
                } catch {
                    requestOptions.body = JSON.stringify({ data: webhookDoc.payload });
                }
            } else {
                requestOptions.body = JSON.stringify({});
            }
        }

        console.log(`Executing webhook: ${webhookDoc.method || 'POST'} ${webhookDoc.url}`);

        const response = await fetch(webhookDoc.url, requestOptions);
        clearTimeout(timeout);

        const responseTime = Date.now() - startTime;
        const isSuccess = response.status >= 200 && response.status < 300;

        return {
            success: isSuccess,
            status: response.status,
            responseTime,
            error: isSuccess ? null : `HTTP ${response.status}: ${response.statusText}`
        };

    } catch (error) {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        console.error(`Webhook execution failed for ${webhookDoc.url}:`, error.message);
        
        return {
            success: false,
            status: 0,
            responseTime,
            error: error.message
        };
    }
}

async function updateWebhooksInBatches(databases, updates, batchSize = 25) {
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        try {
            await Promise.all(
                batch.map(update =>
                    databases.updateDocument(
                        process.env.DATABASE_ID,
                        process.env.WEBHOOKS_COLLECTION_ID,
                        update.id,
                        update.data
                    )
                )
            );
        } catch (error) {
            console.error(`Error updating webhook batch starting at ${i}:`, error);
            // Continue with next batch instead of failing
        }
    }
}