<script lang="ts">
	import { fade } from 'svelte/transition';
    import type { Log, PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';
    import { account } from '$lib/appwrite';
    import { onMount, onDestroy } from 'svelte';

	let appName: string = '';
    let endpoint: string = '';
    let isEnabled: boolean = false;
    let successCount: number = 0;
    let lastPingTime: string | null = null;
    let lastPingStatus: 'success' | 'error' | '' = '';
    let lastPingStatusCode: number | null = null;
    let logs: Log[] = [];
    let showToast = false;
    let currentURL: PingURL | null = null;
	let userId: string | null = null;
	let lastRefreshTime: string = '';
	let refreshing = false;
    let lastRefreshTimestamp = 0;

	onMount(async () => {
        try {
            const session = await account.get();
            userId = session.$id;
            
            // Load existing URL if any
            const urls = await urlService.getURLs(userId);
            if (urls && urls.length > 0) {
                currentURL = urls[0]; // Assuming one URL per user for simplicity
                const urlParts = parseUrl(currentURL.url);
                
                appName = urlParts.appName;
                endpoint = urlParts.endpoint;
                isEnabled = currentURL.isEnabled;
                successCount = currentURL.successCount;
                lastPingTime = formatTimestamp(currentURL.lastPingTime);
                lastPingStatus = currentURL.lastPingStatus;
                lastPingStatusCode = currentURL.lastPingStatusCode;
                logs = currentURL.logs || [];
            }
            
            // Show initial toast
            showToast = true;
            setTimeout(() => { showToast = false; }, 3000);
		} catch (error) {
			console.error('Error loading user data', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			addLog('Failed to load user data: ' + errorMessage, 'error');
		}
    });

	function parseUrl(url: string) {
        try {
            // Extract appName and endpoint from URL like https://app-name.onrender.com/endpoint
            const regex = /https:\/\/([^.]+)\.onrender\.com\/(.*)/;
            const match = url.match(regex);
            
            if (match) {
                return {
                    appName: match[1],
                    endpoint: match[2]
                };
            }
            return { appName: '', endpoint: '' };
        } catch (e) {
            return { appName: '', endpoint: '' };
        }
    }

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

	async function togglePinging() {
        try {
            // Basic validation
            if (!appName && isEnabled) {
                addLog('Please enter an app name', 'warning');
                return;
            }
            
            const newStatus = !isEnabled;
            
            // Update UI immediately for better user experience
            isEnabled = newStatus;
            showToast = true;
            setTimeout(() => { showToast = false; }, 3000);
            
			// Call service to toggle the ping status
			if (!userId) {
				throw new Error('User ID is required');
			}
			currentURL = await urlService.togglePing(
				currentURL?.id || '',
				appName,
				endpoint,
				newStatus,
				userId
			);
            
            if (newStatus) {
                addLog(`Started monitoring ${appName}.onrender.com/${endpoint}`, 'info');
                
                // Store this log message in the database
                if (currentURL) {
                    try {
                        await urlService.addLog(
                            currentURL.id, 
                            `URL monitoring activated by user`, 
                            'info'
                        );
                        // No need to call executePingFunction, it's removed in the batch approach
                    } catch (error) {
                        console.error('Error adding log', error);
                    }
                }
                
                addLog('Your URL will be pinged in the next batch run (within 15 minutes)', 'info');
            } else {
                 addLog('Monitoring stopped', 'warning');
                
                // Store this log in the database if URL exists
                if (currentURL?.id) {
                    try {
                        await urlService.addLog(
                            currentURL.id, 
                            'URL monitoring deactivated by user', 
                            'warning'
                        );
                    } catch (error) {
                        console.error('Error adding log', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling ping status', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			addLog('Error: ' + errorMessage, 'error');
            isEnabled = !isEnabled; // Revert UI state on error
        }
    }

	// function to allow manual refresh of URL status
	async function refreshStatus() {
        if (!currentURL?.id || !userId) return;
        
        // Debounce: prevent rapid successive refreshes
        const now = Date.now();
        if (refreshing || (now - lastRefreshTimestamp < 5000)) {
            addLog('Please wait before refreshing again', 'warning');
            return;
        }
        
        refreshing = true;
        lastRefreshTimestamp = now;
        
        try {
            // Get only the current user's URLs, limit to 1 result
			const updatedURL = await urlService.getURLs(userId);
            if (updatedURL && updatedURL.length > 0) {
                // Update UI with latest data
                successCount = updatedURL[0].successCount;
                lastPingTime = formatTimestamp(updatedURL[0].lastPingTime);
                lastPingStatus = updatedURL[0].lastPingStatus;
                lastPingStatusCode = updatedURL[0].lastPingStatusCode;
                lastRefreshTime = new Date().toLocaleTimeString();
                logs = updatedURL[0].logs || [];
                
                addLog('Status refreshed', 'info');
            }
        } catch (error) {
            console.error('Error refreshing status', error);
            addLog('Failed to refresh status', 'error');
        } finally {
            refreshing = false;
        }
    }

</script>

<div class="card mb-8 shadow-lg">
	<div class="card-body">
		<div class="form-control mb-4 w-full">
			<label for="app-url" class="card-title mb-4">
				<span>App URL</span>
			</label>
			<div>
				<label class="input w-full">
					<span class="label">https://</span>
					<input
						type="text"
						bind:value={appName}
						placeholder="my-app"
						class="placeholder:text-base-content/30"
						style="text-align: right;"
						disabled={isEnabled}
					/>
					<span class="label">.onrender.com/</span>
					<input
						type="text"
						bind:value={endpoint}
						placeholder="api/healthcheck (optional)"
						class="placeholder:text-base-content/30"
						style="text-align: left;"
						disabled={isEnabled}
					/>
				</label>
			</div>
		</div>

		<!-- <div class="tooltip">
				<div class="tooltip-content border-orange-950">
					<div class="animate-bounce text-xs font-black text-orange-500">
						Fighting the sleepy Render servers, one ping at a time!
					</div>
				</div>
				<button
					class={`btn btn-soft ${isEnabled ? 'btn-error' : 'btn-primary'} sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg mt-2 w-full`}
					on:click={togglePinging}
				>
					{isEnabled ? 'Stop Pinging' : 'Keep this URL alive!'}
				</button>
			</div> -->
		<button
			class={`btn btn-soft ${isEnabled ? 'btn-error' : 'btn-primary'} sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg mt-2 w-full`}
			on:click={togglePinging}
		>
			{isEnabled ? 'Stop Pinging' : 'Keep this URL alive!'}
		</button>

		<div class="mt-4 flex flex-col gap-2">
			<div
				class="alert alert-success min-h-8 py-2"
				class:alert-success={isEnabled}
				class:alert-ghost={!isEnabled}
			>
				<div class="flex items-center gap-2">
					<span class="loading loading-ring loading-xs" class:hidden={!isEnabled}></span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						class:hidden={isEnabled}
					>
						<circle cx="12" cy="12" r="10" class="stroke-current opacity-30" stroke-width="4"
						></circle>
					</svg>
					<span>{isEnabled ? 'Service Active' : 'Service Inactive'}</span>
				</div>
			</div>

			<div class="text-sm">
				{#if showToast}
					<div class="toast toast-end z-50" transition:fade={{ duration: 200 }}>
						<div
							class="alert {isEnabled
								? 'alert-info bg-info/90'
								: 'alert-warning bg-warning/90'} shadow-lg backdrop-blur-sm"
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
										d={isEnabled
											? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
											: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'}
									>
									</path>
								</svg>
								{isEnabled ? 'Pinging your URL every 10-15 minutes' : 'Enter your URL'}
							</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if isEnabled}
		<div class="stats mb-5 w-full backdrop-blur-sm">
			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Success Count</div>
				<div class="stat-value text-primary text-4xl">{successCount}</div>
			</div>

			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Last Ping</div>
				<div class="stat-value text-secondary text-4xl">
					{lastPingTime ? lastPingTime.split(' ')[0] : 'N/A'}
				</div>
				<div class="stat-desc text-base opacity-70">
					{lastPingTime ? lastPingTime.split(' ')[1] : ''}
				</div>
			</div>

			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Last Status</div>
				<div
					class="stat-value text-4xl"
					class:text-success={lastPingStatus === 'success'}
					class:text-error={lastPingStatus === 'error'}
				>
					{lastPingStatusCode || 'N/A'}
				</div>
				<div class="stat-desc text-base opacity-70">
					{lastPingStatus === 'success' ? 'OK' : lastPingStatus === 'error' ? 'Error' : ''}
				</div>
			</div>
		</div>

		<div class="flex justify-center mb-4">
            <button 
                class="btn btn-sm btn-outline"
                on:click={refreshStatus}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
            </button>
			<div class="text-xs opacity-60">
        Last updated: {lastRefreshTime || 'Never'}
    </div>
        </div>
	{/if}

	<div class="divider mx-auto my-0 w-2/3"></div>

	<div class="card-body">
		<h2 class="card-title mb-4">Activity Log</h2>
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
