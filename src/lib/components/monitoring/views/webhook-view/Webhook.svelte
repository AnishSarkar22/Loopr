<script lang="ts">
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import type { ScheduledWebhook } from '$lib/types';
    import { webhookService } from '$lib/services/webhookService';
    import WebhookList from '../webhook-view/WebhookList.svelte';
    import WebhookCard from '../webhook-view/WebhookCard.svelte';
    import { isAuthenticated, user } from '$lib/stores/auth';
    import AddWebhookForm from '$lib/components/monitoring/webhooks/AddWebhookForm.svelte';

    let showAddWebhook = $state(false);
    let webhooks = $state<ScheduledWebhook[]>([]);
    let loading = $state(true);
    let showAddForm = $state(false);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
    let viewMode = $state<'cards' | 'table'>('table');

    onMount(() => {
        if (window.innerWidth < 768) {
            viewMode = 'cards';
        }
    });

    function showToastNotification(
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        duration: number = 3000
    ) {
        toastMessage = message;
        toastType = type;
        showToast = true;

        setTimeout(() => {
            showToast = false;
        }, duration);
    }

    $effect(() => {
        if ($isAuthenticated && $user?.id && loading) {
            (async () => {
                try {
                    await loadWebhooks();
                } finally {
                    loading = false;
                }
            })();
        }
    });

    async function loadWebhooks() {
        if (!$user?.id) return;
        try {
            const result = await webhookService.getWebhooks($user.id);
            webhooks = result.webhooks || [];
        } catch (error) {
            console.error('Error loading webhooks:', error);
            showToastNotification('Failed to load webhooks', 'error');
        }
    }

    async function handleWebhookAdded(newWebhook: ScheduledWebhook) {
        webhooks = [...webhooks, newWebhook];
        showAddForm = false;
        showToastNotification(`Successfully scheduled ${newWebhook.name || 'webhook'}`, 'success');
    }

    function handleWebhookUpdated(updatedWebhook: ScheduledWebhook) {
        const index = webhooks.findIndex((webhook) => webhook.id === updatedWebhook.id);
        if (index !== -1) {
            webhooks[index] = updatedWebhook;
        }
        showToastNotification('Webhook updated successfully', 'success');
    }

    async function handleWebhookDeleted(deletedWebhookId: string) {
        webhooks = webhooks.filter((webhook) => webhook.id !== deletedWebhookId);
        showToastNotification('Webhook deleted successfully', 'success');
    }

    function handleRefreshAll() {
        loadWebhooks();
        showToastNotification('Refreshing all webhooks...', 'info');
    }
</script>

{#if loading}
    <!-- Skeleton for Webhook Dashboard Layout -->
    <div class="mx-auto w-full max-w-5xl space-y-8">
        <!-- Stats Bar Skeleton -->
        <div class="hidden lg:block">
            <div class="stats stats-horizontal bg-base-100 w-full shadow-lg">
                {#each Array(4) as _, i}
                    <div class="stat place-items-center py-4">
                        <div class="stat-title text-sm">
                            <div class="skeleton mb-2 h-4 w-20"></div>
                        </div>
                        <div class="stat-value">
                            <div class="skeleton h-8 w-16"></div>
                        </div>
                        <div class="stat-desc text-sm">
                            <div class="skeleton mt-2 h-3 w-24"></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        <!-- Controls Skeleton -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                <div class="skeleton h-10 w-32"></div>
                <div class="skeleton h-10 w-32"></div>
            </div>
            <div class="skeleton h-10 w-40"></div>
        </div>
        <!-- Webhook List Skeleton -->
        <div class="mx-auto w-full max-w-2xl space-y-4">
            {#each Array(3) as _, i}
                <div class="skeleton h-24 w-full rounded-lg"></div>
            {/each}
        </div>
    </div>
{:else}
    <!-- Header Section -->
    <div class="mb-8">
        <!-- Stats - Collapsible on Mobile -->
        <div class="mb-6">
            <!-- Mobile: Collapsible Stats -->
            <div class="lg:hidden">
                <div
                    class="collapse-arrow bg-base-100 border-base-300 collapse rounded-xl border shadow-lg"
                >
                    <input type="checkbox" class="peer" />
                    <div
                        class="collapse-title border-base-content/5 flex items-center justify-between border-b text-sm font-medium"
                    >
                        <span>Webhook Statistics</span>
                    </div>
                    <div class="collapse-content bg-base-50/50">
                        <div class="grid grid-cols-2 gap-3 pt-3 pb-1">
                            <div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
                                <div class="text-base-content/60 text-xs">Total Webhooks</div>
                                <div class="text-primary text-lg font-bold">{webhooks.length}</div>
                                <div class="text-base-content/50 text-xs">Scheduled webhooks</div>
                            </div>
                            <div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
                                <div class="text-base-content/60 text-xs">Pending</div>
                                <div class="text-info text-lg font-bold">
                                    {webhooks.filter((webhook) => webhook.status === 'pending').length}
                                </div>
                                <div class="text-base-content/50 text-xs">Awaiting execution</div>
                            </div>
                            <div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
                                <div class="text-base-content/60 text-xs">Completed</div>
                                <div class="text-success text-lg font-bold">
                                    {webhooks.filter((webhook) => webhook.status === 'completed').length}
                                </div>
                                <div class="text-base-content/50 text-xs">Successfully executed</div>
                            </div>
                            <div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
                                <div class="text-base-content/60 text-xs">Failed</div>
                                <div class="text-error text-lg font-bold">
                                    {webhooks.filter((webhook) => webhook.status === 'failed').length}
                                </div>
                                <div class="text-base-content/50 text-xs">Needs attention</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Desktop: Full Stats Bar -->
            <div class="hidden lg:block">
                <div class="stats stats-horizontal bg-base-100 w-full shadow-lg">
                    <div class="stat place-items-center py-4">
                        <div class="stat-title text-sm">Total Webhooks</div>
                        <div class="stat-value text-primary text-3xl">{webhooks.length}</div>
                        <div class="stat-desc text-sm">Scheduled webhooks</div>
                    </div>
                    <div class="stat place-items-center py-4">
                        <div class="stat-title text-sm">Pending</div>
                        <div class="stat-value text-info text-3xl">
                            {webhooks.filter((webhook) => webhook.status === 'pending').length}
                        </div>
                        <div class="stat-desc text-sm">Awaiting execution</div>
                    </div>
                    <div class="stat place-items-center py-4">
                        <div class="stat-title text-sm">Completed</div>
                        <div class="stat-value text-success text-3xl">
                            {webhooks.filter((webhook) => webhook.status === 'completed').length}
                        </div>
                        <div class="stat-desc text-sm">Successfully executed</div>
                    </div>
                    <div class="stat place-items-center py-4">
                        <div class="stat-title text-sm">Failed</div>
                        <div class="stat-value text-error text-3xl">
                            {webhooks.filter((webhook) => webhook.status === 'failed').length}
                        </div>
                        <div class="stat-desc text-sm">Needs attention</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <!-- Mobile: Stack all controls vertically, Desktop: Group left and right -->
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                <button class="btn btn-outline btn-sm w-full gap-2 sm:w-auto" onclick={handleRefreshAll}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh All
                </button>

                <!-- View Mode Toggle -->
                <div class="join w-full sm:w-auto">
                    <div class="tooltip flex-1 sm:flex-none" data-tip="Table View">
                        <button
                            class="btn join-item btn-sm border-base-content/5 w-full border sm:w-auto {viewMode ===
                            'table'
                                ? 'btn-active'
                                : 'btn-ghost'}"
                            onclick={() => (viewMode = 'table')}
                            aria-label="Table View"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                />
                            </svg>
                            <span class="sm:hidden">Table</span>
                        </button>
                    </div>
                    <div class="tooltip flex-1 sm:flex-none" data-tip="Cards View">
                        <button
                            class="btn join-item btn-sm border-base-content/5 w-full border sm:w-auto {viewMode ===
                            'cards'
                                ? 'btn-active'
                                : 'btn-ghost'}"
                            onclick={() => (viewMode = 'cards')}
                            aria-label="Cards View"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                            <span class="sm:hidden">Cards</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons Group -->
            <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <!-- Schedule New Webhook Button -->
                <button
					class="btn btn-accent btn-sm w-full gap-2 sm:w-auto"
					onclick={() => (showAddWebhook = true)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
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
					Schedule Webhook
				</button>
            </div>
        </div>
    </div>

    <!-- Add Webhook Form Modal -->
    {#if showAddWebhook && $user}
		<div class="modal modal-open" transition:fade>
			<div class="modal-box max-w-2xl">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="text-xl font-bold">Schedule Webhook</h3>
					<button class="btn btn-sm btn-circle btn-ghost" onclick={() => (showAddWebhook = false)}
						>✕</button
					>
				</div>
				<AddWebhookForm
					userId={$user.id}
					onSuccess={() => (showAddWebhook = false)}
					onCancel={() => (showAddWebhook = false)}
				/>
			</div>
			<div
				class="modal-backdrop"
				role="button"
				tabindex="0"
				onclick={() => (showAddWebhook = false)}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? (showAddWebhook = false) : null)}
			></div>
		</div>
	{/if}

    <!-- Webhooks Content -->
    {#if viewMode === 'table'}
        <WebhookList />
    {:else}
        <WebhookCard />
    {/if}

    <!-- Toast Notifications -->
    {#if showToast}
        <div class="toast toast-top toast-center z-50" transition:fade>
            <div class="alert alert-{toastType} shadow-lg">
                <span>{toastMessage}</span>
            </div>
        </div>
    {/if}
{/if}