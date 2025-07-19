<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { ScheduledWebhook } from '$lib/types';
	import { webhookService } from '$lib/services/webhookService';
	import { user } from '$lib/stores/auth';
	import { formatTimestamp } from '$lib/utils/format';

	let webhooks = $state<ScheduledWebhook[]>([]);
	let loading = $state(true);
	let updating = $state<Record<string, boolean>>({});
	let showDetails = $state<Record<string, boolean>>({});

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = 3;
    let showStatusToast = $state(false);
    let statusToastMessage = $state('');

	function handleNonPendingClick(webhook: ScheduledWebhook) {
		statusToastMessage = `This webhook is ${webhook.status} and cannot be edited. Only pending webhooks can be modified.`;
		showStatusToast = true;
		setTimeout(() => {
			showStatusToast = false;
		}, 3000);
	}

	// Computed values for pagination
	let totalPages = $derived(Math.ceil(webhooks.length / itemsPerPage));
	let paginatedWebhooks = $derived(
		webhooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Reset to first page when webhooks change
	$effect(() => {
		if (webhooks.length > 0 && currentPage > totalPages) {
			currentPage = 1;
		}
	});

	onMount(async () => {
		await loadWebhooks();
	});

	async function loadWebhooks() {
		if (!$user?.id) return;
		try {
			loading = true;
			const result = await webhookService.getWebhooks($user.id);
			webhooks = result.webhooks;
		} catch (error) {
			console.error('Error loading webhooks:', error);
		} finally {
			loading = false;
		}
	}

	function goToPage(page: number) {
		currentPage = page;
	}

	function formatTimestampCard(timestamp: string): string {
		if (!timestamp) return 'Never';

		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'success';
			case 'failed':
				return 'error';
			case 'cancelled':
				return 'warning';
			case 'pending':
				return 'info';
			default:
				return 'base-content/50';
		}
	}

	function getStatusText(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function getPriorityColor(priority: number) {
		if (priority >= 8) return 'error';
		if (priority >= 5) return 'warning';
		return 'info';
	}

	function getPriorityText(priority: number) {
		if (priority >= 8) return 'High';
		if (priority >= 5) return 'Medium';
		return 'Low';
	}

	function getWebhookDomain(fullUrl: string): string {
		try {
			return new URL(fullUrl).hostname;
		} catch {
			return fullUrl;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function toggleDetails(webhookId: string) {
		showDetails = { ...showDetails, [webhookId]: !showDetails[webhookId] };
	}

	async function cancelWebhook(webhook: ScheduledWebhook) {
		if (!webhook.id || webhook.status !== 'pending') return;
		updating = { ...updating, [webhook.id]: true };
		try {
			await webhookService.cancelWebhook(webhook.id);
			await loadWebhooks();
		} catch (error) {
			console.error('Error cancelling webhook:', error);
		} finally {
			updating = { ...updating, [webhook.id]: false };
		}
	}

	async function deleteWebhook(webhook: ScheduledWebhook) {
		if (!webhook.id) return;
		updating = { ...updating, [webhook.id]: true };
		try {
			await webhookService.deleteWebhook(webhook.id);
			await loadWebhooks();
		} catch (error) {
			console.error('Error deleting webhook:', error);
		} finally {
			updating = { ...updating, [webhook.id]: false };
		}
	}
</script>

{#if loading}
	<div class="space-y-4">
		{#each Array(3) as _, i}
			<div class="skeleton h-48 w-full rounded-lg"></div>
		{/each}
	</div>
{:else if webhooks.length === 0}
	<div class="hero bg-base-200 rounded-box min-h-96">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="mb-5">
					<div
						class="bg-primary/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-primary h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
				<h1 class="text-2xl font-bold">No Webhooks Yet</h1>
				<p class="text-base-content/70 py-4">
					Schedule your first webhook to automate your workflows and integrations.
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Cards Grid -->
		<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each paginatedWebhooks as webhook (webhook.id)}
				<!-- Modern Glass Card Design -->
				<div
					class="group from-base-100 to-base-200 border-base-300/100 hover:border-primary/30 relative rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
				>
					<!-- Status Glow Effect -->
					<div
						class="absolute inset-0 rounded-2xl bg-gradient-to-r {webhook.status === 'completed'
							? 'from-success/5 to-success/5 via-transparent'
							: webhook.status === 'failed'
								? 'from-error/5 to-error/5 via-transparent'
								: webhook.status === 'pending'
									? 'from-info/5 to-info/5 via-transparent'
									: 'from-warning/5 to-warning/5 via-transparent'} opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					></div>

					<div class="relative z-10">
						<!-- Top Row: Status & Actions -->
						<div class="mb-4 flex items-start justify-between">
							<!-- Status Indicator -->
							<div class="flex items-center gap-3">
								<div class="mr-1 inline-grid *:[grid-area:1/1]">
									{#if webhook.status === 'completed'}
										<div class="status status-success"></div>
										<div class="status status-success"></div>
									{:else if webhook.status === 'failed'}
										<div class="status status-error"></div>
										<div class="status status-error"></div>
									{:else if webhook.status === 'pending'}
										<div class="status status-info"></div>
										<div class="status status-info"></div>
									{:else if webhook.status === 'cancelled'}
										<div class="status status-warning"></div>
										<div class="status status-warning"></div>
									{:else}
										<div class="status status-neutral opacity-30"></div>
									{/if}
								</div>
								<span class="text-sm font-medium text-{getStatusColor(webhook.status)}">
									{getStatusText(webhook.status)}
								</span>
							</div>

							<!-- Quick Actions -->
							<div
								class="flex items-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
							>
								<button
									class="btn btn-ghost btn-xs btn-circle tooltip tooltip-left"
									data-tip="Copy URL"
									onclick={() => copyToClipboard(webhook.url)}
									aria-label="Copy URL"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										></path>
									</svg>
								</button>
								<button
									class="btn btn-ghost btn-xs btn-circle tooltip tooltip-left"
									data-tip="Details"
									onclick={() => toggleDetails(webhook.id || '')}
									aria-label="Toggle Details"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</button>
							</div>
						</div>

						<!-- Main Content -->
						<div class="space-y-4">
							<!-- Webhook Info -->
							<div>
								<h3
									class="text-base-content group-hover:text-primary mb-1 text-xl font-bold transition-colors"
								>
									{webhook.name || 'Unnamed Webhook'}
								</h3>
								<div class="text-base-content/60 flex items-center gap-2 text-sm">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span class="max-w-64 truncate">{getWebhookDomain(webhook.url)}</span>
									<span class="badge badge-ghost bg-base-300 badge-xs ml-2">{webhook.method}</span>
								</div>
							</div>

							<!-- Description -->
							{#if webhook.description}
								<p
									class="text-base-content/70 bg-base-200/50 border-primary/30 rounded-lg border-l-4 p-3 text-sm"
								>
									{webhook.description}
								</p>
							{/if}

							<!-- Metrics Dashboard -->
							<div class="grid grid-cols-3 gap-1">
								<!-- Priority -->
								<div
									class="bg-{getPriorityColor(webhook.priority ?? 0)}/10 border-{getPriorityColor(
										webhook.priority ?? 0
									)}/20 rounded-xl border p-3 text-center"
								>
									<div class="text-{getPriorityColor(webhook.priority ?? 0)} text-2xl font-bold">
										{getPriorityText(webhook.priority ?? 0)}
									</div>
									<div
										class="text-{getPriorityColor(webhook.priority ?? 0)}/70 text-xs font-medium"
									>
										PRIORITY
									</div>
								</div>

								<!-- Retries -->
								<div class="bg-base-200/50 border-base-300/50 rounded-xl border p-3 text-center">
									<div class="text-2xl font-bold">{webhook.retries}/{webhook.maxRetries}</div>
									<div class="text-base-content/50 text-xs font-medium">RETRIES</div>
								</div>

								<!-- Response Time -->
								<div class="bg-success/10 border-success/20 rounded-xl border p-3 text-center">
									<div class="text-success text-2xl font-bold">
										{webhook.responseTime || '--'}ms
									</div>
									<div class="text-success/70 text-xs font-medium">RESP TIME</div>
								</div>
							</div>

							<!-- Last Activity -->
							<div
								class="bg-base-200/30 border-base-300/30 flex items-center justify-between rounded-xl border p-3"
							>
								<div class="flex items-center gap-2">
									<!-- <div class="h-2 w-2 rounded-full bg-{getStatusColor(webhook.status)}"></div> -->
									<span class="text-sm font-medium">Scheduled</span>
								</div>
								<span class="text-base-content/60 text-sm">
									{formatTimestampCard(webhook.scheduledTime || '')}
								</span>
							</div>

							<!-- Control Panel -->
							<div class="flex items-center justify-between pt-2">
								{#if webhook.status === 'pending'}
									<button
										class="btn btn-warning btn-sm shadow-lg"
										onclick={() => cancelWebhook(webhook)}
										disabled={updating[webhook.id || '']}
									>
										{#if updating[webhook.id || '']}
											<span class="loading loading-spinner loading-sm"></span>
										{:else}
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
												></path>
											</svg>
											Cancel
										{/if}
									</button>
								{:else}
									<button
										class="btn btn-error btn-sm shadow-lg"
										onclick={() => deleteWebhook(webhook)}
										disabled={updating[webhook.id || '']}
									>
										{#if updating[webhook.id || '']}
											<span class="loading loading-spinner loading-sm"></span>
										{:else}
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													fill="none"
													stroke="currentColor"
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
												/>
											</svg>
											Delete
										{/if}
									</button>
								{/if}

								<button
									class="btn btn-ghost btn-sm"
									onclick={() => toggleDetails(webhook.id || '')}
								>
									View Details
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
										<path d="M12 16v-4m0-4h.01" />
									</g>
									</svg>
								</button>
							</div>

							<!-- Expandable Details -->
							{#if showDetails[webhook.id || '']}
								<div class="border-base-300/30 space-y-3 border-t pt-4" transition:fade>
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span class="text-base-content/50">Scheduled:</span>
											<div class="font-medium">
												{formatTimestampCard(webhook.scheduledTime || '')}
											</div>
										</div>
										<div>
											<span class="text-base-content/50">Last Attempt:</span>
											<div class="font-medium">
												{webhook.lastAttempt ? formatTimestampCard(webhook.lastAttempt) : 'Never'}
											</div>
										</div>
									</div>

									{#if webhook.payload}
										<div class="bg-base-200/30 rounded-lg p-3">
											<div class="text-base-content/50 mb-2 text-xs">Payload</div>
											<div
												class="text-primary max-h-24 overflow-y-auto font-mono text-sm break-all"
											>
												{webhook.payload}
											</div>
										</div>
									{/if}

									{#if webhook.headers}
										<div class="bg-base-200/30 rounded-lg p-3">
											<div class="text-base-content/50 mb-2 text-xs">Headers</div>
											<div
												class="text-primary max-h-24 overflow-y-auto font-mono text-sm break-all"
											>
												{webhook.headers}
											</div>
										</div>
									{/if}

									<div class="bg-base-200/30 rounded-lg p-3">
										<div class="text-base-content/50 mb-2 text-xs">Webhook URL</div>
										<div class="text-primary font-mono text-sm break-all">
											<a
												href={webhook.url}
												target="_blank"
												rel="noopener noreferrer"
												class="hover:underline"
											>
												{webhook.url}
											</a>
										</div>
									</div>

									{#if webhook.lastError}
										<div class="bg-error/10 border-error/20 rounded-lg border p-3">
											<div class="text-error mb-2 text-xs font-medium">Last Error</div>
											<div class="text-error text-sm">
												{webhook.lastError}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if webhooks.length > itemsPerPage}
			<div class="flex justify-center pt-4">
				<div class="join">
					<button
						class="join-item btn btn-sm"
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
					>
						«
					</button>

					{#each Array(totalPages).fill(0) as _, i}
						<button
							class="join-item btn btn-sm {currentPage === i + 1 ? 'btn-active' : ''}"
							onclick={() => goToPage(i + 1)}
						>
							{i + 1}
						</button>
					{/each}

					<button
						class="join-item btn btn-sm"
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
					>
						»
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
