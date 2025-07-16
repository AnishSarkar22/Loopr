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

import { Client, Databases, Query, ID } from 'node-appwrite';

export default async function ({ req, res }) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        const method = req.method;
        const path = req.path;

        // Route requests
        if (method === 'POST' && path === '/schedule') {
            return await scheduleWebhook(req, res, databases);
        } else if (method === 'GET' && path.startsWith('/webhooks/')) {
            const userId = path.split('/')[2];
            return await getUserWebhooks(req, res, databases, userId);
        } else if (method === 'POST' && path.includes('/cancel')) {
            // Fixed: Handle cancel webhook requests
            const webhookId = path.split('/')[2];
            return await cancelWebhook(req, res, databases, webhookId);
        } else if (method === 'DELETE' && path.startsWith('/webhook/')) {
            const webhookId = path.split('/')[2];
            return await deleteWebhook(req, res, databases, webhookId);
        } else if (method === 'PUT' && path.startsWith('/webhook/')) {
            const webhookId = path.split('/')[2];
            return await updateWebhook(req, res, databases, webhookId);
        } else {
            return res.json({ error: 'Invalid endpoint' }, 404);
        }

    } catch (error) {
        console.error('Webhook API error:', error);
        return res.json({
            success: false,
            error: error.message
        }, 500);
    }
}

async function scheduleWebhook(req, res, databases) {
    const {
        userId,
        url,
        payload,
        headers,
        method = 'POST',
        scheduledTime,
        maxRetries = 3,
        priority = 1,
        name,
        description
    } = JSON.parse(req.body || '{}');

    // Validation
    if (!userId || !url || !scheduledTime) {
        return res.json({
            success: false,
            error: 'Missing required fields: userId, url, scheduledTime'
        }, 400);
    }

    // Validate URL format
    try {
        new URL(url);
    } catch {
        return res.json({
            success: false,
            error: 'Invalid URL format'
        }, 400);
    }

    // Validate scheduled time
    const scheduleDate = new Date(scheduledTime);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
        return res.json({
            success: false,
            error: 'Invalid scheduledTime: must be a future date'
        }, 400);
    }

    try {
        const webhookData = {
            userId,
            url,
            method: method.toUpperCase(),
            scheduledTime: scheduleDate.toISOString(),
            status: 'pending',
            retries: 0,
            maxRetries: parseInt(maxRetries) || 3,
            priority: parseInt(priority) || 1
        };

        // Add optional fields
        if (payload) webhookData.payload = typeof payload === 'string' ? payload : JSON.stringify(payload);
        if (headers) webhookData.headers = typeof headers === 'string' ? headers : JSON.stringify(headers);
        if (name) webhookData.name = name;
        if (description) webhookData.description = description;

        const webhook = await databases.createDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            ID.unique(),
            webhookData
        );

        return res.json({
            success: true,
            webhook: {
                id: webhook.$id,
                url: webhook.url,
                method: webhook.method,
                scheduledTime: webhook.scheduledTime,
                status: webhook.status,
                priority: webhook.priority
            }
        });

    } catch (error) {
        console.error('Error creating webhook:', error);
        return res.json({
            success: false,
            error: 'Failed to schedule webhook'
        }, 500);
    }
}

async function getUserWebhooks(req, res, databases, userId) {
    try {
        const limit = parseInt(req.query?.limit) || 50;
        const offset = parseInt(req.query?.offset) || 0;
        const status = req.query?.status;

        const queries = [
            Query.equal('userId', userId),
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset(offset)
        ];

        if (status) {
            queries.push(Query.equal('status', status));
        }

        const webhooks = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            queries
        );

        return res.json({
            success: true,
            webhooks: webhooks.documents.map(webhook => ({
                id: webhook.$id,
                url: webhook.url,
                method: webhook.method,
                scheduledTime: webhook.scheduledTime,
                status: webhook.status,
                retries: webhook.retries,
                maxRetries: webhook.maxRetries,
                priority: webhook.priority,
                name: webhook.name,
                description: webhook.description,
                lastAttempt: webhook.lastAttempt,
                lastError: webhook.lastError,
                responseStatus: webhook.responseStatus,
                responseTime: webhook.responseTime,
                createdAt: webhook.$createdAt
            })),
            total: webhooks.total
        });

    } catch (error) {
        console.error('Error fetching webhooks:', error);
        return res.json({
            success: false,
            error: 'Failed to fetch webhooks'
        }, 500);
    }
}

async function cancelWebhook(req, res, databases, webhookId) {
    try {
        // First check if webhook exists and get its current status
        const webhook = await databases.getDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            webhookId
        );

        // Check if webhook can be cancelled
        if (webhook.status !== 'pending') {
            return res.json({
                success: false,
                error: `Cannot cancel webhook with status: ${webhook.status}. Only pending webhooks can be cancelled.`
            }, 400);
        }

        // Update webhook status to cancelled
        await databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            webhookId,
            { 
                status: 'cancelled',
                lastAttempt: new Date().toISOString()
            }
        );

        return res.json({
            success: true,
            message: 'Webhook cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling webhook:', error);
        
        // Handle specific Appwrite errors
        if (error.code === 404) {
            return res.json({
                success: false,
                error: 'Webhook not found'
            }, 404);
        }
        
        return res.json({
            success: false,
            error: 'Failed to cancel webhook'
        }, 500);
    }
}

async function updateWebhook(req, res, databases, webhookId) {
    const updates = JSON.parse(req.body || '{}');
    
    try {
        const webhook = await databases.getDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            webhookId
        );

        if (webhook.status !== 'pending') {
            return res.json({
                success: false,
                error: 'Can only update pending webhooks'
            }, 400);
        }

        const allowedUpdates = ['url', 'payload', 'headers', 'method', 'scheduledTime', 'maxRetries', 'priority', 'name', 'description'];
        const updateData = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                if (key === 'scheduledTime') {
                    const scheduleDate = new Date(value);
                    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
                        return res.json({
                            success: false,
                            error: 'Invalid scheduledTime: must be a future date'
                        }, 400);
                    }
                    updateData[key] = scheduleDate.toISOString();
                } else if (key === 'method') {
                    updateData[key] = value.toUpperCase();
                } else if (['payload', 'headers'].includes(key)) {
                    updateData[key] = typeof value === 'string' ? value : JSON.stringify(value);
                } else {
                    updateData[key] = value;
                }
            }
        }

        const updatedWebhook = await databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            webhookId,
            updateData
        );

        return res.json({
            success: true,
            webhook: {
                id: updatedWebhook.$id,
                url: updatedWebhook.url,
                method: updatedWebhook.method,
                scheduledTime: updatedWebhook.scheduledTime,
                status: updatedWebhook.status,
                priority: updatedWebhook.priority
            }
        });

    } catch (error) {
        console.error('Error updating webhook:', error);
        return res.json({
            success: false,
            error: 'Failed to update webhook'
        }, 500);
    }
}

async function deleteWebhook(req, res, databases, webhookId) {
    try {
        await databases.deleteDocument(
            process.env.DATABASE_ID,
            process.env.WEBHOOKS_COLLECTION_ID,
            webhookId
        );

        return res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting webhook:', error);
        
        if (error.code === 404) {
            return res.json({
                success: false,
                error: 'Webhook not found'
            }, 404);
        }
        
        return res.json({
            success: false,
            error: 'Failed to delete webhook'
        }, 500);
    }
}