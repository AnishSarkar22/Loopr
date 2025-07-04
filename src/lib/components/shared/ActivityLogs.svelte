<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { Log } from '$lib/types';
    import { formatTimestamp } from '$lib/utils/format';


    interface Props {
        logs: Log[];
        title?: string;
        showRefresh?: boolean;
        refreshing?: boolean;
        onRefresh?: () => void;
        lastRefreshTime?: string;
        height?: string;
        showHostname?: boolean;
    }

    let { 
        logs, 
        title = "Activity Logs",
        showRefresh = false,
        refreshing = false,
        onRefresh,
        lastRefreshTime = '',
        height = 'h-96',
        showHostname = true
    }: Props = $props();

    // Simplified refresh handler
    function refreshLogs() {
        if (onRefresh) {
            onRefresh();
        }
    }
    // Helper function to get formatted timestamp
    function getFormattedTimestamp(log: any): string {
        // Use pre-formatted timestamp if available, otherwise format the original
        return log.formattedTimestamp || formatTimestamp(log.timestamp);
    }
</script>

<div class="card bg-base-100 shadow-lg">
    <div class="card-body">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="card-title">Activity Logs</h2>
            <button class="btn btn-sm btn-outline" onclick={refreshLogs} disabled={refreshing}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="mr-1 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    class:animate-spin={refreshing}
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                {refreshing ? '' : 'Refresh Logs'}
            </button>
        </div>

        {#if lastRefreshTime}
            <div class="mb-4 text-xs opacity-60">
                Last updated: {lastRefreshTime}
            </div>
        {/if}

        <div class="bg-base-100 border-base-300 h-96 overflow-y-auto rounded-lg border-2 border-dashed">
            {#if logs.length > 0}
                {#each logs as log}
                    <div class="border-base-300 border-b px-4 py-2 last:border-0">
                        <span class="text-sm opacity-70">[{getFormattedTimestamp(log)}]</span>
                        <span
                            class={`ml-2 ${
                                log.type === 'success'
                                    ? 'text-success'
                                    : log.type === 'error'
                                    ? 'text-error'
                                    : log.type === 'warning'
                                    ? 'text-warning'
                                    : 'text-info'
                            }`}
                        >
                            {log.message}
                        </span>
                    </div>
                {/each}
            {:else}
                <div class="flex flex-col items-center justify-center py-8">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="text-base-content/30 mb-4 h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div class="text-base-content/70 text-center">
                        <p class="mb-2 font-semibold">No activity logs yet</p>
                        <p class="text-sm">Enable monitoring on your URLs to see ping results here</p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>