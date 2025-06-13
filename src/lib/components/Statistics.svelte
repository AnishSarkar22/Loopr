<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { Log, PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';
    import { account } from '$lib/appwrite';
    import { onMount } from 'svelte';

    let logs = $state<Log[]>([]);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
    let userId = $state<string | null>(null);
    let lastRefreshTime = $state('');
    let refreshing = $state(false);
    let lastRefreshTimestamp = $state(0);
    let isAuthenticated = $state(false);

    // Helper function to show toast notifications
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

    onMount(async () => {
        try {
            const session = await account.get();
            userId = session.$id;
            isAuthenticated = true;

            // Load logs from all user URLs
            await loadAllUserLogs();

            // Show welcome toast for authenticated users
            showToastNotification('Welcome back! Your activity logs are ready.', 'success');
        } catch (error) {
            console.error('Error loading user data', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addLog('Failed to load user data: ' + errorMessage, 'error');
        }
    });

    function formatTimestamp(timestamp: string): string {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const today = new Date();

        // Format date part
        let datePart = '';
        if (date.toDateString() === today.toDateString()) {
            datePart = 'Today';
        } else {
            datePart = `${date.getMonth() + 1}/${date.getDate()}`;
        }

        // Format time part
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timePart = `${hours}:${minutes}`;

        return `${datePart} ${timePart}`;
    }

    function addLog(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const newLog: Log = {
            timestamp: formatTimestamp(new Date().toISOString()),
            message,
            type
        };
        logs = [newLog, ...logs].slice(0, 100); // Keep only the last 100 logs
    }

    // Load logs from all user URLs
    async function loadAllUserLogs() {
        if (!userId) return;

        try {
            const urls = await urlService.getURLs(userId);
            if (urls && urls.length > 0) {
                // Collect all logs from all URLs
                const allLogs: Log[] = [];
                
                urls.forEach(url => {
                    if (url.logs && url.logs.length > 0) {
                        // Add URL info to each log message for context
                        const urlLogs = url.logs.map(log => ({
                            ...log,
                            message: `[${new URL(url.url).hostname}] ${log.message}`
                        }));
                        allLogs.push(...urlLogs);
                    }
                });

                // Sort logs by timestamp (newest first)
                allLogs.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeB - timeA;
                });

                logs = allLogs.slice(0, 100); // Keep only the last 100 logs
            }
        } catch (error) {
            console.error('Error loading user logs', error);
            addLog('Failed to load activity logs', 'error');
        }
    }

    // Function to refresh logs from all URLs
    async function refreshLogs() {
        if (!userId) return;

        // Debounce: prevent rapid successive refreshes
        const now = Date.now();
        if (refreshing || now - lastRefreshTimestamp < 5000) {
            addLog('Please wait before refreshing again', 'warning');
            return;
        }

        refreshing = true;
        lastRefreshTimestamp = now;

        try {
            await loadAllUserLogs();
            lastRefreshTime = new Date().toLocaleTimeString();
            addLog('Activity logs refreshed', 'info');
        } catch (error) {
            console.error('Error refreshing logs', error);
            addLog('Failed to refresh activity logs', 'error');
            showToastNotification('Failed to refresh logs', 'error');
        } finally {
            refreshing = false;
        }
    }
</script>

<!-- Toast Notification -->
{#if showToast}
    <div class="toast toast-top toast-center z-50" transition:fade={{ duration: 200 }}>
        <div
            class="alert alert-{toastType} shadow-lg backdrop-blur-sm"
        >
            <span class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="h-4 w-4 stroke-current"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                {toastMessage}
            </span>
        </div>
    </div>
{/if}

<div class="card mb-8 shadow-lg">
    <div class="card-body">
        <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Activity Log</h2>
            <button 
                class="btn btn-sm btn-outline" 
                onclick={refreshLogs}
                disabled={refreshing}
            >
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
                {refreshing ? 'Refreshing...' : 'Refresh Logs'}
            </button>
        </div>
        
        {#if lastRefreshTime}
            <div class="mb-4 text-xs opacity-60">
                Last updated: {lastRefreshTime}
            </div>
        {/if}

        <div class="bg-base-100 border-accent h-64 overflow-y-auto rounded-lg border-2 border-dashed">
            {#each logs as log}
                <div class="border-base-300 border-b px-4 py-2 last:border-0">
                    <span class="text-sm opacity-70">[{log.timestamp}]</span>
                    <span
                        class={`ml-2 ${
                            log.type === 'success'
                                ? 'text-success'
                                : log.type === 'error'
                                    ? 'text-error'
                                    : log.type === 'warning'
                                        ? 'text-warning'
                                        : 'text-base-content'
                        }`}>{log.message}</span
                    >
                </div>
            {/each}
            {#if logs.length === 0}
                <div class="flex flex-col items-center justify-center py-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="text-base-content/50 mb-2 h-8 w-8"
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
                    <div class="text-base-content/70 text-center">No activity yet</div>
                </div>
            {/if}
        </div>
    </div>
</div>