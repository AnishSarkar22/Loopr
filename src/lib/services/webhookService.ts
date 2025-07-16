import { functions } from '$lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import type { ScheduledWebhook } from '$lib/types';

class WebhookService {
	// private readonly FUNCTION_ID = 'webhookAPI'; // Use the webhookAPI function for CRUD operations
	private readonly FUNCTION_ID = import.meta.env.VITE_APPWRITE_WEBHOOK_FUNCTION_ID;

	async createWebhook(data: {
		userId: string;
		url: string;
		name?: string;
		description?: string;
		method?: string;
		payload?: string;
		headers?: string;
		scheduledTime: string;
		maxRetries?: number;
		priority?: number;
	}): Promise<ScheduledWebhook> {
		try {
			const response = await functions.createExecution(
				this.FUNCTION_ID,
				JSON.stringify(data),
				false,
				'/schedule',
				ExecutionMethod.POST
			);

			const result = JSON.parse(response.responseBody);

			if (!result.success) {
				throw new Error(result.error || 'Failed to create webhook');
			}

			return result.webhook;
		} catch (error) {
			console.error('Error creating webhook:', error);
			throw error;
		}
	}

	async getWebhooks(
		userId: string,
		options?: {
			limit?: number;
			offset?: number;
			status?: string;
		}
	): Promise<{ webhooks: ScheduledWebhook[]; total: number }> {
		try {
			const queryParams = new URLSearchParams();
			if (options?.limit) queryParams.set('limit', options.limit.toString());
			if (options?.offset) queryParams.set('offset', options.offset.toString());
			if (options?.status) queryParams.set('status', options.status);

			const path = `/webhooks/${userId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

			const response = await functions.createExecution(
				this.FUNCTION_ID,
				'',
				false,
				path,
				ExecutionMethod.GET
			);

			const result = JSON.parse(response.responseBody);

			if (!result.success) {
				throw new Error(result.error || 'Failed to fetch webhooks');
			}

			return {
				webhooks: result.webhooks,
				total: result.total
			};
		} catch (error) {
			console.error('Error fetching webhooks:', error);
			throw error;
		}
	}

	async updateWebhook(
		webhookId: string,
		updates: {
			url?: string;
			name?: string;
			description?: string;
			method?: string;
			payload?: string;
			headers?: string;
			scheduledTime?: string;
			maxRetries?: number;
			priority?: number;
		}
	): Promise<ScheduledWebhook> {
		try {
			const response = await functions.createExecution(
				this.FUNCTION_ID,
				JSON.stringify(updates),
				false,
				`/webhook/${webhookId}`,
				ExecutionMethod.PUT
			);

			const result = JSON.parse(response.responseBody);

			if (!result.success) {
				throw new Error(result.error || 'Failed to update webhook');
			}

			return result.webhook;
		} catch (error) {
			console.error('Error updating webhook:', error);
			throw error;
		}
	}

	async cancelWebhook(webhookId: string): Promise<void> {
		try {
			const response = await functions.createExecution(
				this.FUNCTION_ID,
				'',
				false,
				`/webhook/${webhookId}/cancel`,
				ExecutionMethod.POST
			);

			const result = JSON.parse(response.responseBody);

			if (!result.success) {
				throw new Error(result.error || 'Failed to cancel webhook');
			}
		} catch (error) {
			console.error('Error cancelling webhook:', error);
			throw error;
		}
	}

	async deleteWebhook(webhookId: string): Promise<void> {
		try {
			const response = await functions.createExecution(
				this.FUNCTION_ID,
				'',
				false,
				`/webhook/${webhookId}`,
				ExecutionMethod.DELETE
			);

			const result = JSON.parse(response.responseBody);

			if (!result.success) {
				throw new Error(result.error || 'Failed to delete webhook');
			}
		} catch (error) {
			console.error('Error deleting webhook:', error);
			throw error;
		}
	}

	// Helper method to get webhooks by status
	async getPendingWebhooks(userId: string): Promise<ScheduledWebhook[]> {
		const result = await this.getWebhooks(userId, { status: 'pending' });
		return result.webhooks;
	}

	async getCompletedWebhooks(userId: string): Promise<ScheduledWebhook[]> {
		const result = await this.getWebhooks(userId, { status: 'completed' });
		return result.webhooks;
	}

	async getFailedWebhooks(userId: string): Promise<ScheduledWebhook[]> {
		const result = await this.getWebhooks(userId, { status: 'failed' });
		return result.webhooks;
	}

	async getCancelledWebhooks(userId: string): Promise<ScheduledWebhook[]> {
		const result = await this.getWebhooks(userId, { status: 'cancelled' });
		return result.webhooks;
	}

	// Helper method for pagination
	async getWebhooksPaginated(
		userId: string,
		page: number = 1,
		limit: number = 20
	): Promise<{ webhooks: ScheduledWebhook[]; total: number; hasMore: boolean }> {
		const offset = (page - 1) * limit;
		const result = await this.getWebhooks(userId, { limit, offset });

		return {
			webhooks: result.webhooks,
			total: result.total,
			hasMore: result.total > offset + result.webhooks.length
		};
	}
}

export const webhookService = new WebhookService();
