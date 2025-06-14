// for node Registration

import { Client, Databases, Query } from 'appwrite';

export default async function ({ res }) {
	const client = new Client()
		.setEndpoint('https://cloud.appwrite.io/v1')
		.setProject(process.env.APPWRITE_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_ENDPOINT);

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
					id: nodeId,
					name: `Worker ${nodeId}`,
					status: 'online',
					lastHeartbeat: now,
					urlCount: 0,
					region: process.env.WORKER_REGION || 'default',
					nodeType: process.env.NODE_ID ? 'fixed' : 'dynamic'
				}
			);
		}

		// Always do load balancing, but with different strategies
		await balanceNodeLoad(databases, nodeId, !!process.env.NODE_ID);

		// Get current URL count for load balancing decisions
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

// Enhanced helper function with different strategies for fixed vs dynamic nodes
async function balanceNodeLoad(databases, currentNodeId, isFixedNode = false) {
	// Get all active nodes
	const activeNodes = await databases.listDocuments(
		process.env.DATABASE_ID,
		process.env.WORKER_NODES_COLLECTION_ID,
		[Query.equal('status', 'online')],
		100
	);

	if (activeNodes.total <= 1) return; // No need to balance with only one node

	// Calculate URL count for each node
	const nodeCounts = await Promise.all(
		activeNodes.documents.map(async (node) => {
			const urls = await databases.listDocuments(
				process.env.DATABASE_ID,
				process.env.URLS_COLLECTION_ID,
				[Query.equal('nodeId', node.$id)]
			);

			return {
				nodeId: node.$id,
				count: urls.total,
				nodeType: node.nodeType || 'dynamic'
			};
		})
	);

	const currentNode = nodeCounts.find((node) => node.nodeId === currentNodeId);
	if (!currentNode) return;

	// Different balancing strategies
	if (isFixedNode) {
		// Fixed nodes: Only accept URLs if significantly underloaded
		const avgLoad = nodeCounts.reduce((sum, node) => sum + node.count, 0) / nodeCounts.length;

		if (currentNode.count < avgLoad * 0.5) {
			// Only if less than 50% of average
			await redistributeToUnderloadedNode(databases, nodeCounts, currentNodeId);
		}
	} else {
		// Dynamic nodes: More aggressive balancing
		const maxNode = nodeCounts.reduce((max, node) => (node.count > max.count ? node : max), {
			count: -1
		});

		if (maxNode.count > currentNode.count + 10) {
			const diff = Math.floor((maxNode.count - currentNode.count) / 2);
			const toReassign = Math.min(diff, 50); // Don't move too many at once

			// Get URLs to reassign
			const urlsToReassign = await databases.listDocuments(
				process.env.DATABASE_ID,
				process.env.URLS_COLLECTION_ID,
				[Query.equal('nodeId', maxNode.nodeId)],
				toReassign
			);

			// Reassign them
			await Promise.all(
				urlsToReassign.documents.map((url) =>
					databases.updateDocument(
						process.env.DATABASE_ID,
						process.env.URLS_COLLECTION_ID,
						url.$id,
						{
							nodeId: currentNodeId
						}
					)
				)
			);
		}
	}
}

// Helper for fixed node redistribution
async function redistributeToUnderloadedNode(databases, nodeCounts, targetNodeId) {
	// Find the most overloaded node
	const maxNode = nodeCounts.reduce((max, node) => (node.count > max.count ? node : max));
	const currentNode = nodeCounts.find((node) => node.nodeId === targetNodeId);

	if (maxNode.count > currentNode.count + 20) {
		// Higher threshold for fixed nodes
		const toReassign = Math.min(25, Math.floor((maxNode.count - currentNode.count) / 3));

		const urlsToReassign = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.URLS_COLLECTION_ID,
			[Query.equal('nodeId', maxNode.nodeId)],
			toReassign
		);

		await Promise.all(
			urlsToReassign.documents.map((url) =>
				databases.updateDocument(process.env.DATABASE_ID, process.env.URLS_COLLECTION_ID, url.$id, {
					nodeId: targetNodeId
				})
			)
		);
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
