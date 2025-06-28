// for database cleanup

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

export default async function ({ res }) {
	const client = new Client()
		.setEndpoint('https://cloud.appwrite.io/v1')
		.setProject(process.env.APPWRITE_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY);

	const databases = new Databases(client);

	try {
		const MAX_RETENTION_DAYS = parseInt(process.env.MAX_RETENTION_DAYS) || 15;
		const DELETION_BATCH_SIZE = parseInt(process.env.DELETION_BATCH_SIZE) || 25;

		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
		const cutoffString = cutoffDate.toISOString();

		// Clean up old ping results
		const oldResultShards = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.RESULTS_COLLECTION_ID,
			[Query.lessThan('date', cutoffString.split('T')[0])],
			parseInt(process.env.QUERY_LIMIT) || 500
		);

		// Delete old results in parallel
		if (oldResultShards.documents.length > 0) {
			for (let i = 0; i < oldResultShards.documents.length; i += DELETION_BATCH_SIZE) {
				const batch = oldResultShards.documents.slice(i, i + DELETION_BATCH_SIZE);
				try {
					await Promise.all(
						batch.map((doc) =>
							databases.deleteDocument(
								process.env.DATABASE_ID,
								process.env.RESULTS_COLLECTION_ID,
								doc.$id
							)
						)
					);
					console.log(`Deleted batch of ${batch.length} old result documents`);
				} catch (error) {
					console.error(`Error deleting batch starting at ${i}:`, error);
					// Continue with next batch instead of failing
				}
			}
		}

		// Clean up inactive worker nodes (last heartbeat > 1 day ago)
		const dayAgo = new Date();
		dayAgo.setDate(dayAgo.getDate() - 1);

		const staleNodes = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.WORKER_NODES_COLLECTION_ID,
			[Query.lessThan('lastHeartbeat', dayAgo.toISOString())],
			parseInt(process.env.QUERY_LIMIT) || 500
		);

		if (staleNodes.documents.length > 0) {
			// Reassign URLs BEFORE marking nodes offline (more efficient)
    		await reassignUrls(databases, staleNodes.documents);
			
			// Now mark nodes offline in a single batch
			await Promise.all(
				staleNodes.documents.map((node) =>
					databases.updateDocument(
						process.env.DATABASE_ID,
						process.env.WORKER_NODES_COLLECTION_ID,
						node.$id,
						{ status: 'offline' }
					)
				)
			);
		}

		return res.json({
			success: true,
			deletedResults: oldResultShards.documents.length,
			offlineNodes: staleNodes.documents.length
		});
	} catch (error) {
		console.error('Cleanup error:', error);
		return res.json(
			{
				success: false,
				error: error.message
			},
			500
		);
	}
}

// Helper function to reassign URLs from offline nodes to active ones
async function reassignUrls(databases, offlineNodes) {
	if (offlineNodes.length === 0) return;

	// Get active nodes
	const activeNodes = await databases.listDocuments(
		process.env.DATABASE_ID,
		process.env.WORKER_NODES_COLLECTION_ID,
		[Query.equal('status', 'online')],
		parseInt(process.env.QUERY_LIMIT) || 500
	);

	if (activeNodes.documents.length === 0) return; // No active nodes to reassign to

	const REASSIGNMENT_BATCH_SIZE = parseInt(process.env.REASSIGNMENT_BATCH_SIZE) || 25;

	// For each offline node, reassign its URLs in batches
	for (const offlineNode of offlineNodes) {
		const orphanedUrls = await databases.listDocuments(
			process.env.DATABASE_ID,
			process.env.URLS_COLLECTION_ID,
			[Query.equal('nodeId', offlineNode.$id)],
			parseInt(process.env.ORPHANED_URL_QUERY_LIMIT) || 1000
		);

		if (orphanedUrls.documents.length === 0) continue;

		// Process URL reassignments in batches
		for (let i = 0; i < orphanedUrls.documents.length; i += REASSIGNMENT_BATCH_SIZE) {
			const batch = orphanedUrls.documents.slice(i, i + REASSIGNMENT_BATCH_SIZE);

			const updates = batch.map((url, index) => {
				// Round-robin assignment
				const targetNodeIndex = (i + index) % activeNodes.documents.length;
				const targetNode = activeNodes.documents[targetNodeIndex];

				return databases.updateDocument(
					process.env.DATABASE_ID,
					process.env.URLS_COLLECTION_ID,
					url.$id,
					{ nodeId: targetNode.$id }
				);
			});

			try {
				await Promise.all(updates);
				console.log(`Reassigned batch of ${batch.length} URLs from offline node`);
			} catch (error) {
				console.error(`Error reassigning batch:`, error);
				// Continue with next batch
			}
		}
	}
}
