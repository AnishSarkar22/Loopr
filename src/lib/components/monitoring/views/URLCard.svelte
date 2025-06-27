<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';

    interface Props {
        urls: PingURL[];
        onUpdate: (url: PingURL) => void;
        onDelete: (urlId: string) => void;
    }

    let { urls, onUpdate, onDelete }: Props = $props();

    // State for each URL's details visibility and updating status
    let showDetails = $state<Record<string, boolean>>({});
    let updating = $state<Record<string, boolean>>({});

    // Pagination state
    let currentPage = $state(1);
    let itemsPerPage = 3;

    // Computed values for pagination
    let totalPages = $derived(Math.ceil(urls.length / itemsPerPage));
    let paginatedUrls = $derived(urls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));

    // Reset to first page when URLs change
    $effect(() => {
        if (urls.length > 0 && currentPage > totalPages) {
            currentPage = 1;
        }
    });

    function goToPage(page: number) {
        currentPage = page;
    }

    function formatTimestamp(timestamp: string): string {
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

    async function toggleStatus(url: PingURL) {
        if (!url.id) return;

        updating[url.id] = true;
        try {
            const updatedUrl = await urlService.updateURL(url.id, {
                isEnabled: !url.isEnabled
            });
            onUpdate(updatedUrl);
        } catch (error) {
            console.error('Error toggling URL status:', error);
        } finally {
            updating[url.id] = false;
        }
    }

    function getUrlDomain(fullUrl: string): string {
        try {
            return new URL(fullUrl).hostname;
        } catch {
            return fullUrl;
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    function toggleDetails(urlId: string) {
        showDetails[urlId] = !showDetails[urlId];
    }
</script>

<div class="space-y-6">
    <!-- Cards Grid -->
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {#each paginatedUrls as url (url.id)}
            <!-- Modern Glass Card Design -->
            <div
                class="group from-base-100 to-base-200 border-base-300/100 hover:border-primary/30 relative rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
                <!-- Status Glow Effect -->
                <div
                    class="absolute inset-0 rounded-2xl bg-gradient-to-r {url.isEnabled
                        ? 'from-success/5 to-success/5 via-transparent'
                        : 'from-warning/5 to-warning/5 via-transparent'} opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                ></div>

                <div class="relative z-10">
                    <!-- Top Row: Status & Actions -->
                    <div class="mb-4 flex items-start justify-between">
                        <!-- Status Indicator -->
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <div
                                    class="h-4 w-4 rounded-full {url.isEnabled ? 'bg-success' : 'bg-warning'} shadow-lg"
                                ></div>
                                {#if url.isEnabled}
                                    <div
                                        class="bg-success absolute inset-0 h-4 w-4 animate-ping rounded-full opacity-20"
                                    ></div>
                                {/if}
                            </div>
                            <span class="text-sm font-medium {url.isEnabled ? 'text-success' : 'text-warning'}">
                                {url.isEnabled ? 'Monitoring' : 'Paused'}
                            </span>
                        </div>

                        <!-- Quick Actions -->
                        <div
                            class="flex items-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
                        >
                            <button
                                class="btn btn-ghost btn-xs btn-circle tooltip tooltip-left"
                                data-tip="Copy URL"
                                onclick={() => copyToClipboard(url.url)}
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
                            <a
                                href="/urls/{url.id}/edit"
                                class="btn btn-ghost btn-xs btn-circle tooltip tooltip-left"
                                data-tip="Edit"
                                aria-label="Edit URL"
                            >
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    ></path>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="space-y-4">
                        <!-- URL Info -->
                        <div>
                            <h3
                                class="text-base-content group-hover:text-primary mb-1 text-xl font-bold transition-colors"
                            >
                                {url.name || getUrlDomain(url.url)}
                            </h3>
                            <div class="text-base-content/60 flex items-center gap-2 text-sm">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m1.414-1.414l4-4a2 2 0 012.828 0 1 1 0 001.414-1.414z"
                                    ></path>
                                </svg>
                                <span class="max-w-64 truncate">{getUrlDomain(url.url)}</span>
                            </div>
                        </div>

                        <!-- Description -->
                        {#if url.description}
                            <p
                                class="text-base-content/70 bg-base-200/50 border-primary/30 rounded-lg border-l-4 p-3 text-sm"
                            >
                                {url.description}
                            </p>
                        {/if}

                        <!-- Metrics Dashboard -->
                        <div class="grid grid-cols-3 gap-3">
                            <!-- Success Rate -->
                            <div class="bg-success/10 border-success/20 rounded-xl border p-3 text-center">
                                <div class="text-success text-2xl font-bold">{url.successCount || 0}</div>
                                <div class="text-success/70 text-xs font-medium">SUCCESS</div>
                            </div>

                            <!-- Response Code -->
                            <div class="bg-base-200/50 border-base-300/50 rounded-xl border p-3 text-center">
                                <div
                                    class="text-2xl font-bold {url.lastPingStatusCode
                                        ? url.lastPingStatusCode < 400
                                            ? 'text-success'
                                            : 'text-error'
                                        : 'text-base-content/50'}"
                                >
                                    {url.lastPingStatusCode || '---'}
                                </div>
                                <div class="text-base-content/50 text-xs font-medium">STATUS</div>
                            </div>

                            <!-- Interval -->
                            <div class="bg-info/10 border-info/20 rounded-xl border p-3 text-center">
                                <div class="text-info text-2xl font-bold">{url.pingInterval || 15}</div>
                                <div class="text-info/70 text-xs font-medium">MIN</div>
                            </div>
                        </div>

                        <!-- Last Activity -->
                        <div
                            class="bg-base-200/30 border-base-300/30 flex items-center justify-between rounded-xl border p-3"
                        >
                            <div class="flex items-center gap-2">
                                <div
                                    class="h-2 w-2 rounded-full {url.lastPingStatus === 'success'
                                        ? 'bg-success'
                                        : url.lastPingStatus === 'error'
                                            ? 'bg-error'
                                            : 'bg-gray-400'}"
                                ></div>
                                <span class="text-sm font-medium">Last ping</span>
                            </div>
                            <span class="text-base-content/60 text-sm">
                                {formatTimestamp(url.lastPingTime || '')}
                            </span>
                        </div>

                        <!-- Control Panel -->
                        <div class="flex items-center justify-between pt-2">
                            <button
                                class="btn btn-sm {url.isEnabled ? 'btn-warning' : 'btn-success'} shadow-lg"
                                onclick={() => toggleStatus(url)}
                                disabled={updating[url.id || '']}
                            >
                                {#if updating[url.id || '']}
                                    <span class="loading loading-spinner loading-sm"></span>
                                {:else if url.isEnabled}
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                    Pause
                                {:else}
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10v.01M15 10v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                    Start
                                {/if}
                            </button>

                            <a href="/urls/{url.id}" class="btn btn-ghost btn-sm">
                                View Details
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </a>
                        </div>

                        <!-- Expandable Details -->
                        {#if showDetails[url.id || '']}
                            <div class="border-base-300/30 space-y-3 border-t pt-4" transition:fade>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-base-content/50">Created:</span>
                                        <div class="font-medium">{formatTimestamp(url.$createdAt || '')}</div>
                                    </div>
                                    <div>
                                        <span class="text-base-content/50">Updated:</span>
                                        <div class="font-medium">{formatTimestamp(url.$updatedAt || '')}</div>
                                    </div>
                                </div>

                                <div class="bg-base-200/30 rounded-lg p-3">
                                    <div class="text-base-content/50 mb-2 text-xs">Full URL</div>
                                    <div class="text-primary font-mono text-sm break-all">
                                        <a href={url.url} target="_blank" rel="noopener noreferrer" class="hover:underline">
                                            {url.url}
                                        </a>
                                    </div>
                                </div>

                                <div class="mt-4">
                                    <a href="/urls/{url.id}" class="btn btn-primary btn-sm w-full">
                                        View Full Details & Activity Logs
                                    </a>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Pagination -->
    {#if urls.length > itemsPerPage}
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