<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { Log, PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';
    import { account } from '$lib/appwrite';
    import { onMount } from 'svelte';
    import ActivityLogs from './shared/ActivityLogs.svelte';

    let logs = $state<Log[]>([]);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
    let userId = $state<string | null>(null);
    let lastRefreshTime = $state('');
    let refreshing = $state(false);
    let lastRefreshTimestamp = $state(0);
    let isAuthenticated = $state(false);
    let userUrls = $state<PingURL[]>([]);

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

    // Helper function to get hostname from URL
    function getUrlHostname(urlString: string): string {
        try {
            return new URL(urlString).hostname;
        } catch {
            return urlString;
        }
    }

    onMount(async () => {
        try {
            const session = await account.get();
            userId = session.$id;
            isAuthenticated = true;

            // Load logs from all user URLs
            await loadAllUserLogs();
        } catch (error) {
            console.error('Error loading user data', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addLog('Failed to load user data: ' + errorMessage, 'error');
        }
    });

    function addLog(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const newLog: Log = {
            timestamp: new Date().toISOString(),
            message,
            type
        };
        logs = [newLog, ...logs].slice(0, 100); // Keep only the last 100 logs
    }

    // Load logs from all user URLs
    async function loadAllUserLogs() {
        if (!userId) return;
        
        try {
            console.log('Loading user URLs...');
            const urls = await urlService.getURLs(userId);
            userUrls = urls;
            
            console.log(`Found ${urls.length} URLs for user`);
            
            // More efficient log aggregation with better error handling
            const allLogs = urls
                .filter(url => url.logs)
                .flatMap(url => {
                    try {
                        const logs = Array.isArray(url.logs) 
                            ? url.logs 
                            : JSON.parse(url.logs || '[]');
                        
                        return Array.isArray(logs) 
                            ? logs.map(log => ({
                                ...log,
                                message: `[${getUrlHostname(url.url)}] ${log.message}`
                            }))
                            : [];
                    } catch (error) {
                        console.error(`Failed to parse logs for URL ${url.url}:`, error);
                        return [];
                    }
                })
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 100);
                
            logs = allLogs;
            
            // Add appropriate user feedback
            if (allLogs.length > 0) {
                addLog(`Loaded ${allLogs.length} activity logs from ${urls.length} URLs`, 'success');
            } else {
                addLog(`No activity logs found yet. Enable monitoring on your URLs to see logs.`, 'info');
            }
            
        } catch (error) {
            console.error('Failed to load logs:', error);
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
        <div class="alert alert-{toastType} shadow-lg backdrop-blur-sm">
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

<div class="space-y-6">
    <!-- URL Summary -->
    <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
            <h2 class="card-title">URL Overview</h2>
            <div class="mt-4 flex gap-2 md:gap-4">
                <div class="flex-1 bg-base-200 rounded-lg p-3 text-center">
                    <div class="text-xs text-base-content/70 mb-1">Total URLs</div>
                    <div class="text-xl font-bold text-primary">{userUrls.length}</div>
                </div>
                <div class="flex-1 bg-base-200 rounded-lg p-3 text-center">
                    <div class="text-xs text-base-content/70 mb-1">Active Monitoring</div>
                    <div class="text-xl font-bold text-success">{userUrls.filter((url) => url.isEnabled).length}</div>
                </div>
                <div class="flex-1 bg-base-200 rounded-lg p-3 text-center">
                    <div class="text-xs text-base-content/70 mb-1">Total Logs</div>
                    <div class="text-xl font-bold text-info">{logs.length}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="divider w-1/2 mx-auto"></div>
    
    <!-- Activity Logs -->
    <ActivityLogs 
        {logs}
        title="Activity Logs"
        showRefresh={true}
        {refreshing}
        onRefresh={refreshLogs}
        {lastRefreshTime}
        showHostname={true}
    />
</div>