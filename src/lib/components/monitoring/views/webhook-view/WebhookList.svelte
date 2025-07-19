<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import type { ScheduledWebhook } from '$lib/types';
    import { webhookService } from '$lib/services/webhookService';
    import { user } from '$lib/stores/auth';
    import { formatTimestamp } from '$lib/utils/format';
    import Portal from '$lib/components/monitoring/views/Portal.svelte';

    let webhooks = $state<ScheduledWebhook[]>([]);
    let loading = $state(true);
    let updating = $state<Record<string, boolean>>({});
    let showDetails = $state<Record<string, boolean>>({});

    // Pagination state
    let currentPage = $state(1);
    let itemsPerPage = 4;

    //Dropdown state management
    let activeDropdown = $state<string | null>(null);
    let dropdownButtons = $state<Record<string, HTMLElement>>({});
    let dropdownPositions = $state<Record<string, { top: number; left: number }>>({});

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

    function getStatusBadge(webhook: ScheduledWebhook) {
        switch (webhook.status) {
            case 'completed':
                return 'badge-success';
            case 'failed':
                return 'badge-error';
            case 'cancelled':
                return 'badge-warning';
            case 'pending':
                return 'badge-info';
            default:
                return 'badge-ghost';
        }
    }

    function getStatusText(webhook: ScheduledWebhook) {
        return webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1);
    }

    function getPriorityBadge(priority: number) {
        if (priority >= 8) return 'badge-error';
        if (priority >= 5) return 'badge-warning';
        return 'badge-info';
    }

    function getPriorityText(priority: number) {
        if (priority >= 8) return 'High';
        if (priority >= 5) return 'Medium';
        return 'Low';
    }

    async function cancelWebhook(webhook: ScheduledWebhook) {
        if (!webhook.id || webhook.status !== 'pending') return;

        updating[webhook.id] = true;
        try {
            await webhookService.cancelWebhook(webhook.id);
            await loadWebhooks(); // Refresh list
        } catch (error) {
            console.error('Error cancelling webhook:', error);
        } finally {
            updating[webhook.id] = false;
        }
    }

    async function deleteWebhook(webhook: ScheduledWebhook) {
        if (!webhook.id) return;
        updating[webhook.id] = true;
        try {
            await webhookService.deleteWebhook(webhook.id);
            await loadWebhooks(); // Refresh list after deletion
        } catch (error) {
            console.error('Error deleting webhook:', error);
        } finally {
            updating[webhook.id] = false;
        }
    }

    function toggleDetails(webhookId: string) {
        showDetails[webhookId] = !showDetails[webhookId];
    }

    // Dropdown functions
    function toggleDropdown(webhookId: string, event: MouseEvent) {
        event.stopPropagation(); // Prevent event bubbling
        
        if (activeDropdown === webhookId) {
            activeDropdown = null;
            return;
        }

        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        
        dropdownPositions[webhookId] = {
            top: rect.bottom + 4, // Use viewport coordinates, not window.scrollY
            left: rect.right - 208 // 208px is the dropdown width (w-52)
        };
        
        activeDropdown = webhookId;
    }

    function closeDropdown() {
        activeDropdown = null;
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
        if (activeDropdown) {
            const target = event.target as Element;
            // Check if click is outside both the dropdown and the button
            if (!target.closest('.dropdown-portal') && !target.closest('button[aria-label="Webhook actions menu"]')) {
                closeDropdown();
            }
        }
    }

    // Event listener for clicking outside
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    });
</script>

{#if loading}
    <!-- Skeleton for Webhook List -->
    <div class="space-y-4">
        {#each Array(3) as _, i}
            <div class="skeleton h-24 w-full rounded-lg"></div>
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
                <a href="/dashboard" class="btn btn-primary"> Go to Dashboard </a>
            </div>
        </div>
    </div>
{:else}
    <!-- Webhooks Table -->
    <div class="card bg-base-100 shadow-lg">
        <div class="card-body p-0">
            <div class="rounded-box border-base-300/100 bg-base-100 overflow-x-auto border">
                <table class="table-xl table">
                    <thead>
                        <tr>
                            <th class="text-center">Webhook</th>
                            <th class="text-center">Status</th>
                            <th class="text-center">Priority</th>
                            <th class="text-center">Scheduled Time</th>
                            <th class="text-center">Last Attempt</th>
                            <th class="text-center">Retries</th>
                            <th class="text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each paginatedWebhooks as webhook, index (webhook.id)}
                            <tr class="hover:bg-base-200">
                                <td>
                                    <div class="flex items-center gap-4">
                                        <div class="bg-base-300 h-8 w-2 rounded-full"></div>
                                        <div class="min-w-0 flex-1">
                                            <div
                                                class="flex items-center gap-2 truncate text-base font-semibold"
                                                title={webhook.name || webhook.url}
                                            >
                                                {webhook.name || 'Unnamed Webhook'}
                                                <span class="badge badge-ghost bg-base-300 badge-xs ml-2"
                                                    >{webhook.method}</span
                                                >
                                            </div>
                                            <div class="text-base-content/60 truncate text-sm">
                                                <span title={webhook.url}>
                                                    {webhook.url.replace(/^https?:\/\//, '')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="badge {getStatusBadge(webhook)} badge-sm">
                                        {getStatusText(webhook)}
                                    </div>
                                    <!-- {#if webhook.responseStatus}
                                        <div class="text-base-content/60 mt-1 text-xs">
                                            {webhook.responseStatus}
                                        </div>
                                    {/if} -->
                                </td>
                                <td class="text-center">
                                    <div class="badge {getPriorityBadge(webhook.priority ?? 0)} badge-sm">
                                        {getPriorityText(webhook.priority ?? 0)}
                                    </div>
                                </td>
                                <td class="text-center">
                                    <span class="text-base-content/60 text-xs">
                                        {formatTimestamp(webhook.scheduledTime)}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="text-base-content/60 text-xs">
                                        {webhook.lastAttempt ? formatTimestamp(webhook.lastAttempt) : 'Never'}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="text-sm">
                                        {webhook.retries}/{webhook.maxRetries}
                                    </span>
                                </td>
                                <td class="relative">
                                    <button 
                                        class="btn btn-ghost btn-sm" 
                                        aria-label="Webhook actions menu"
                                        onclick={(e) => toggleDropdown(webhook.id || '', e)}
                                        bind:this={dropdownButtons[webhook.id || '']}
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
                                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                            />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            <!-- Detailed View Row -->
                            {#if showDetails[webhook.id || '']}
                                <tr transition:fade>
                                    <td colspan="7" class="bg-base-200/50">
                                        <div class="space-y-3 p-4">
                                            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {#if webhook.description}
                                                    <div>
                                                        <div class="text-base-content/70 mb-1 text-xs font-semibold">
                                                            Description
                                                        </div>
                                                        <div class="text-sm">{webhook.description}</div>
                                                    </div>
                                                {/if}

                                                {#if webhook.payload}
                                                    <div>
                                                        <div class="text-base-content/70 mb-1 text-xs font-semibold">
                                                            Payload
                                                        </div>
                                                        <div
                                                            class=" bg-base-300 max-h-32 overflow-y-auto rounded p-2 font-mono text-xs"
                                                        >
                                                            {webhook.payload}
                                                        </div>
                                                    </div>
                                                {/if}

                                                {#if webhook.headers}
                                                    <div>
                                                        <div class="text-base-content/70 mb-1 text-xs font-semibold">
                                                            Headers
                                                        </div>
                                                        <div
                                                            class="bg-base-300 max-h-32 overflow-y-auto rounded p-2 font-mono text-xs"
                                                        >
                                                            {webhook.headers}
                                                        </div>
                                                    </div>
                                                {/if}

                                                {#if webhook.lastError}
                                                    <div>
                                                        <div class="text-base-content/70 mb-1 text-xs font-semibold">
                                                            Last Error
                                                        </div>
                                                        <div class="text-error text-sm">{webhook.lastError}</div>
                                                    </div>
                                                {/if}

                                                {#if webhook.responseTime}
                                                    <div>
                                                        <div class="text-base-content/70 mb-1 text-xs font-semibold">
                                                            Response Time
                                                        </div>
                                                        <div class="text-sm">{webhook.responseTime}ms</div>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
                <!-- Portal Dropdown Menu -->
                {#if activeDropdown && dropdownPositions[activeDropdown]}
                    <Portal>
                        {#snippet children()}
                            {@const currentWebhook = paginatedWebhooks.find(w => w.id === activeDropdown)}
                            <div 
                                class="dropdown-portal menu bg-base-100 rounded-box border-base-content/5 w-52 border p-2 shadow-2xl"
                                style="position: fixed; top: {dropdownPositions[activeDropdown!].top}px; left: {dropdownPositions[activeDropdown!].left}px; z-index: 9999;"
                            >
                                {#if currentWebhook}
                                    <ul>
                                        <!-- <li>
                                            <button
                                                onclick={() => { toggleDetails(currentWebhook.id || ''); closeDropdown(); }}
                                                class="flex items-center gap-2"
                                            >
                                                <svg
                                                    class="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                {showDetails[currentWebhook.id || ''] ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </li> -->
                                        {#if currentWebhook.status === 'pending'}
                                            <li>
                                                <button
                                                    onclick={() => { cancelWebhook(currentWebhook); closeDropdown(); }}
                                                    disabled={updating[currentWebhook.id || '']}
                                                    class="text-error"
                                                >
                                                    {#if updating[currentWebhook.id || '']}
                                                        <span class="loading loading-spinner loading-xs"></span>
                                                    {:else}
                                                        <svg
                                                            class="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    {/if}
                                                    Cancel
                                                </button>
                                            </li>
                                        {/if}
                                        <li>
                                            <button
                                                onclick={() => { deleteWebhook(currentWebhook); closeDropdown(); }}
                                                disabled={updating[currentWebhook.id || '']}
                                                class="text-error"
                                            >
                                                {#if updating[currentWebhook.id || '']}
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                {:else}
                                                    <svg
                                                        class="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                {/if}
                                                Delete
                                            </button>
                                        </li>
                                    </ul>
                                {/if}
                            </div>
                        {/snippet}
                    </Portal>
                {/if}
            </div>
        </div>

        <!-- Pagination -->
        {#if webhooks.length > itemsPerPage}
            <div class="card-body pt-5">
                <div class="flex justify-center">
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
            </div>
        {/if}
    </div>
{/if}