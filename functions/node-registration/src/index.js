// for node Registration

import { Client, Databases, Query } from 'node-appwrite';

const REDISTRIBUTION_BATCH_SIZE = parseInt(process.env.REDISTRIBUTION_BATCH_SIZE) || 10;
const MAX_REDISTRIBUTION_ATTEMPTS = parseInt(process.env.MAX_REDISTRIBUTION_ATTEMPTS) || 3;
const LOAD_BALANCE_BATCH_SIZE = parseInt(process.env.LOAD_BALANCE_BATCH_SIZE) || 10;

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
		await balanceNodeLoad(databases, nodeId, !!process.env.NODE_ID);

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

        console.log(`Found ${activeNodes.documents.length} active nodes for assignment`);

        // Assign URLs to nodes in round-robin fashion
        const assignments = unassignedUrls.documents.map((url, index) => {
            const nodeIndex = index % activeNodes.documents.length;
            const assignedNode = activeNodes.documents[nodeIndex];
            
            console.log(`Assigning URL ${url.$id} to node ${assignedNode.$id}`);
            
            return databases.updateDocument(
                process.env.DATABASE_ID,
                process.env.URLS_COLLECTION_ID,
                url.$id,
                { nodeId: assignedNode.$id }
            );
        });

        await Promise.all(assignments);
        console.log(`Successfully assigned ${assignments.length} URLs to nodes`);

    } catch (error) {
        console.error('Error assigning unassigned URLs:', error);
        // Don't throw - let the main registration continue
    }
}

// Enhanced helper function with different strategies for fixed vs dynamic nodes
async function balanceNodeLoad(databases, currentNodeId, isFixedNode = false) {
	try {
		// Get all active nodes with error handling
		const activeNodes = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.WORKER_NODES_COLLECTION_ID,
			[Query.equal('status', 'online')],
			100
		);

		if (activeNodes.total <= 1) {
			console.log('Skipping load balancing: only one active node');
			return;
		}

		// Calculate URL count for each node with individual error handling
		const nodeCounts = [];
		for (const node of activeNodes.documents) {
			try {
				const urls = await databases.listDocuments(
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
				// Add node with count 0 to avoid excluding it from balancing
				nodeCounts.push({
					nodeId: node.$id,
					count: 0,
					nodeType: node.nodeType || 'dynamic'
				});
			}
		}

		const currentNode = nodeCounts.find((node) => node.nodeId === currentNodeId);
		if (!currentNode) {
			console.warn(`Current node ${currentNodeId} not found in active nodes`);
			return;
		}

		// Different balancing strategies with improved error handling
		if (isFixedNode) {
			const avgLoad = nodeCounts.reduce((sum, node) => sum + node.count, 0) / nodeCounts.length;

			if (currentNode.count < avgLoad * 0.5) {
				console.log(`Fixed node ${currentNodeId} is underloaded, attempting redistribution`);
				await redistributeToUnderloadedNode(databases, nodeCounts, currentNodeId);
			}
		} else {
			const maxNode = nodeCounts.reduce((max, node) => (node.count > max.count ? node : max), {
				count: -1
			});

			if (maxNode.count > currentNode.count + 10) {
				console.log(`Dynamic balancing: moving URLs from ${maxNode.nodeId} to ${currentNodeId}`);

				const diff = Math.floor((maxNode.count - currentNode.count) / 2);
				const toReassign = Math.min(diff, 50);

				try {
					const urlsToReassign = await databases.listDocuments(
						process.env.DATABASE_ID,
						process.env.URLS_COLLECTION_ID,
						[Query.equal('nodeId', maxNode.nodeId)],
						toReassign
					);

					// Process in smaller batches for better reliability
					const batchSize = LOAD_BALANCE_BATCH_SIZE;
					for (let i = 0; i < urlsToReassign.documents.length; i += batchSize) {
						const batch = urlsToReassign.documents.slice(i, i + batchSize);

						try {
							// Retry logic for critical operations
							await retryOperation(async () => {
								await Promise.all(
									batch.map((url) =>
										databases.updateDocument(
											process.env.DATABASE_ID,
											process.env.URLS_COLLECTION_ID,
											url.$id,
											{ nodeId: currentNodeId }
										)
									)
								);
							}, MAX_REDISTRIBUTION_ATTEMPTS);
						} catch (batchError) {
							console.error(`Failed to process batch starting at index ${i}:`, batchError.message);
						}
					}
				} catch (error) {
					console.error('Dynamic balancing error:', error.message);
				}
			}
		}
	} catch (error) {
		console.error('Load balancing error:', error.message);
		// Don't throw - let the main registration continue
	}
}

// Helper for fixed node redistribution
async function redistributeToUnderloadedNode(databases, nodeCounts, targetNodeId) {
	try {
		// Input validation
		if (!nodeCounts || nodeCounts.length === 0) {
			console.warn('No node counts provided for redistribution');
			return;
		}

		const maxNode = nodeCounts.reduce((max, node) => (node.count > max.count ? node : max));
		const currentNode = nodeCounts.find((node) => node.nodeId === targetNodeId);

		// Additional validation
		if (!currentNode) {
			console.warn(`Target node ${targetNodeId} not found in node counts`);
			return;
		}

		if (!maxNode || maxNode.nodeId === targetNodeId) {
			// No redistribution needed if current node is the max or only node
			return;
		}

		if (maxNode.count > currentNode.count + 20) {
			const toReassign = Math.min(25, Math.floor((maxNode.count - currentNode.count) / 3));

			if (toReassign <= 0) {
				return; // Nothing to reassign
			}

			const urlsToReassign = await databases.listDocuments(
				process.env.DATABASE_ID,
				process.env.URLS_COLLECTION_ID,
				[Query.equal('nodeId', maxNode.nodeId)],
				toReassign
			);

			if (urlsToReassign.documents.length === 0) {
				console.warn(`No URLs found to redistribute from node ${maxNode.nodeId}`);
				return;
			}

			// Process in batches to avoid overwhelming the database
			const batchSize = REDISTRIBUTION_BATCH_SIZE;
			const batches = [];
			for (let i = 0; i < urlsToReassign.documents.length; i += batchSize) {
				batches.push(urlsToReassign.documents.slice(i, i + batchSize));
			}

			let successCount = 0;
			let errorCount = 0;

			for (const batch of batches) {
				try {
					// Retry logic for redistribution
					await retryOperation(async () => {
						await Promise.all(
							batch.map(async (url) => {
								try {
									await databases.updateDocument(
										process.env.DATABASE_ID,
										process.env.URLS_COLLECTION_ID,
										url.$id,
										{ nodeId: targetNodeId }
									);
									successCount++;
								} catch (updateError) {
									console.error(`Failed to update URL ${url.$id}:`, updateError.message);
									errorCount++;
								}
							})
						);
					}, MAX_REDISTRIBUTION_ATTEMPTS);
				} catch (batchError) {
					console.error('Batch redistribution error:', batchError.message);
					errorCount += batch.length;
				}
			}

			console.log(`Redistribution completed: ${successCount} successful, ${errorCount} failed`);
		}
	} catch (error) {
		console.error('Redistribution error:', error.message);
		// Don't throw - let the main function continue
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
