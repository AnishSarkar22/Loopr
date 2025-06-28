// for node Registration

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

const MAX_REDISTRIBUTION_ATTEMPTS = parseInt(process.env.MAX_REDISTRIBUTION_ATTEMPTS) || 3;
const LOAD_BALANCE_BATCH_SIZE = parseInt(process.env.LOAD_BALANCE_BATCH_SIZE) || 10;

class LoadBalancer {
    constructor(databases) {
        this.databases = databases;
        this.batchSize = LOAD_BALANCE_BATCH_SIZE;
        this.maxRetries = MAX_REDISTRIBUTION_ATTEMPTS;
    }

    async getActiveNodesWithCounts() {
        const activeNodes = await this.databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.WORKER_NODES_COLLECTION_ID,
            [Query.equal('status', 'online')],
            100
        );

        const nodeCounts = [];
        for (const node of activeNodes.documents) {
            try {
                const urls = await this.databases.listDocuments(
                    process.env.DATABASE_ID,
                    process.env.URLS_COLLECTION_ID,
                    [Query.equal('nodeId', node.$id)]
                );

                nodeCounts.push({
                    nodeId: node.$id,
                    count: urls.total,
                    nodeType: node.nodeType || 'dynamic'
                });
            } catch (error) {
                console.error(`Failed to get URL count for node ${node.$id}:`, error.message);
                nodeCounts.push({
                    nodeId: node.$id,
                    count: 0,
                    nodeType: node.nodeType || 'dynamic'
                });
            }
        }

        return nodeCounts;
    }

    async reassignUrls(sourceNodeId, targetNodeId, count) {
        const urlsToReassign = await this.databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.URLS_COLLECTION_ID,
            [Query.equal('nodeId', sourceNodeId)],
            count
        );

        if (urlsToReassign.documents.length === 0) return 0;

        let successCount = 0;
        const batches = [];
        for (let i = 0; i < urlsToReassign.documents.length; i += this.batchSize) {
            batches.push(urlsToReassign.documents.slice(i, i + this.batchSize));
        }

        for (const batch of batches) {
            try {
                await retryOperation(async () => {
                    await Promise.all(
                        batch.map(async (url) => {
                            await this.databases.updateDocument(
                                process.env.DATABASE_ID,
                                process.env.URLS_COLLECTION_ID,
                                url.$id,
                                { nodeId: targetNodeId }
                            );
                            successCount++;
                        })
                    );
                }, this.maxRetries);
            } catch (error) {
                console.error(`Batch reassignment error:`, error.message);
            }
        }

        return successCount;
    }
}

class FixedNodeBalancer extends LoadBalancer {
    async balance(currentNodeId, nodeCounts) {
        const currentNode = nodeCounts.find(node => node.nodeId === currentNodeId);
        if (!currentNode) return;

        const avgLoad = nodeCounts.reduce((sum, node) => sum + node.count, 0) / nodeCounts.length;

        if (currentNode.count < avgLoad * 0.5) {
            const maxNode = nodeCounts.reduce((max, node) => 
                node.count > max.count ? node : max
            );

            if (maxNode.nodeId !== currentNodeId && maxNode.count > currentNode.count + 20) {
                const toReassign = Math.min(25, Math.floor((maxNode.count - currentNode.count) / 3));
                
                if (toReassign > 0) {
                    console.log(`Fixed node balancing: moving ${toReassign} URLs from ${maxNode.nodeId} to ${currentNodeId}`);
                    await this.reassignUrls(maxNode.nodeId, currentNodeId, toReassign);
                }
            }
        }
    }
}

class DynamicNodeBalancer extends LoadBalancer {
    async balance(currentNodeId, nodeCounts) {
        const currentNode = nodeCounts.find(node => node.nodeId === currentNodeId);
        if (!currentNode) return;

        const maxNode = nodeCounts.reduce((max, node) => 
            node.count > max.count ? node : max, { count: -1 }
        );

        if (maxNode.count > currentNode.count + 10) {
            const diff = Math.floor((maxNode.count - currentNode.count) / 2);
            const toReassign = Math.min(diff, 50);

            if (toReassign > 0) {
                console.log(`Dynamic balancing: moving ${toReassign} URLs from ${maxNode.nodeId} to ${currentNodeId}`);
                await this.reassignUrls(maxNode.nodeId, currentNodeId, toReassign);
            }
        }
    }
}

// Consolidated load balancing function
async function performLoadBalancing(databases, currentNodeId, strategy = 'dynamic') {
    try {
        const balancer = strategy === 'fixed' ? 
            new FixedNodeBalancer(databases) : 
            new DynamicNodeBalancer(databases);
        
        const activeNodes = await balancer.getActiveNodesWithCounts();
        
        if (activeNodes.length <= 1) {
            console.log('Skipping load balancing: only one active node');
            return;
        }
        
        await balancer.balance(currentNodeId, activeNodes);
    } catch (error) {
        console.error('Load balancing error:', error.message);
    }
}

// Simplified URL assignment utility
async function assignUrlsToNodes(databases, urls, activeNodes) {
    if (!urls.length || !activeNodes.length) return;

    const assignments = urls.map((url, index) => {
        const nodeIndex = index % activeNodes.length;
        const targetNode = activeNodes[nodeIndex];
        
        return databases.updateDocument(
            process.env.DATABASE_ID,
            process.env.URLS_COLLECTION_ID,
            url.$id,
            { nodeId: targetNode.$id }
        );
    });

    // Process in batches
    const batchSize = LOAD_BALANCE_BATCH_SIZE;
    for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        try {
            await Promise.all(batch);
        } catch (error) {
            console.error(`Assignment batch error:`, error);
        }
    }
}


async function retryOperation(operation, maxRetries = 3, delay = 1000) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (attempt === maxRetries) throw error;
			console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
			await new Promise((resolve) => setTimeout(resolve, delay));
			delay *= 2; // Exponential backoff
		}
	}
}

export default async function ({ res }) {
	const client = new Client()
		.setEndpoint('https://cloud.appwrite.io/v1')
		.setProject(process.env.APPWRITE_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY);

	const databases = new Databases(client);

	// Use NODE_ID if provided, otherwise use dynamic pool
	const nodeId =
		process.env.NODE_ID ||
		(() => {
			const NODE_POOL_SIZE = parseInt(process.env.NODE_POOL_SIZE) || 5;
			const nodeIndex = Math.floor(Math.random() * NODE_POOL_SIZE) + 1;
			return `node-${nodeIndex}`;
		})();

	const now = new Date().toISOString();

	try {
		// Try to update existing node
		try {
			await databases.updateDocument(
				process.env.DATABASE_ID,
				process.env.WORKER_NODES_COLLECTION_ID,
				nodeId,
				{
					status: 'online',
					lastHeartbeat: now,
					// Mark if this is a fixed node for different balancing strategy
					nodeType: process.env.NODE_ID ? 'fixed' : 'dynamic'
				}
			);
		} catch {
			// Node doesn't exist, create it
			await databases.createDocument(
				process.env.DATABASE_ID,
				process.env.WORKER_NODES_COLLECTION_ID,
				nodeId,
				{
					name: `Worker ${nodeId}`,
					status: 'online',
					lastHeartbeat: now,
					urlCount: 0,
					region: process.env.WORKER_REGION || 'default',
					nodeType: process.env.NODE_ID ? 'fixed' : 'dynamic'
				}
			);
		}

		// Assign unassigned URLs first
        await assignUnassignedUrls(databases);

		// load balancing
		await performLoadBalancing(databases, nodeId, process.env.NODE_ID ? 'fixed' : 'dynamic');

		// Getting current URL count for load balancing decisions
		const urlCount = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.URLS_COLLECTION_ID,
			[Query.equal('nodeId', nodeId)]
		);

		return res.json({
			success: true,
			nodeId: nodeId,
			nodeType: process.env.NODE_ID ? 'fixed' : 'dynamic',
			urlCount: urlCount.total,
			timestamp: now
		});
	} catch (error) {
		console.error('Node registration error:', error);
		return res.json(
			{
				success: false,
				error: error.message
			},
			500
		);
	}
}

// Function to assign URLs that don't have a nodeId
async function assignUnassignedUrls(databases) {
    try {
        console.log('Checking for unassigned URLs...');
        
        // Get URLs with null nodeId that are enabled
        const unassignedUrls = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.URLS_COLLECTION_ID,
            [
                Query.isNull('nodeId'),
                Query.equal('isEnabled', true)
            ],
            100
        );

        if (unassignedUrls.documents.length === 0) {
            console.log('No unassigned enabled URLs found');
            return;
        }

        console.log(`Found ${unassignedUrls.documents.length} unassigned enabled URLs`);

        // Get active nodes
        const activeNodes = await databases.listDocuments(
            process.env.DATABASE_ID,
            process.env.WORKER_NODES_COLLECTION_ID,
            [Query.equal('status', 'online')],
            100
        );

        if (activeNodes.documents.length === 0) {
            console.log('No active nodes available for assignment');
            return;
        }

        console.log(`Assigning ${unassignedUrls.documents.length} URLs to ${activeNodes.documents.length} nodes`);
        await assignUrlsToNodes(databases, unassignedUrls.documents, activeNodes.documents);

    } catch (error) {
        console.error('Error assigning unassigned URLs:', error);
        // Don't throw - let the main registration continue
    }
}

// function hashString(str) {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = ((hash << 5) - hash) + char;
//     hash = hash & hash; // Convert to 32bit integer
//   }
//   return hash;
// }
