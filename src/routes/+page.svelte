<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	

	let appName = '';
	let endpoint = '';

	let showToast = false;
	let toastTimeout: number | null = null;
	const TOAST_DURATION = 2000; // 2 seconds

	interface Log {
		message: string;
		timestamp: string;
		type: 'info' | 'success' | 'error' | 'warning';
	}

	let appUrl = '';
	let isEnabled = false;
	let pingInterval: number | null = null;
	let successCount = 0;
	let lastPingTime: string | null = null;
	let lastPingStatus: 'success' | 'error' | '' = '';
	let lastPingStatusCode: number | null = null;
	let consecutiveFailures = 0;
	const maxConsecutiveFailures = 15;
	let logs: Log[] = [];

	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	function addLog(message: string, type: Log['type'] = 'info') {
		const timestamp = new Date().toLocaleTimeString();
		logs = [{ message, timestamp, type }, ...logs].slice(0, 100);
	}

	async function pingServer() {
		if (!appUrl || !isEnabled) return;

		try {
			lastPingTime = new Date().toLocaleTimeString();
			addLog(`Pinging ${appUrl}...`);

			const response = await fetch(appUrl, {
				method: 'GET',
				mode: 'cors',
				cache: 'no-cache',
				headers: {
					'X-Ping': 'keepalive'
				}
			});

			lastPingStatusCode = response.status;

			if (response.status >= 200 && response.status < 400) {
				lastPingStatus = 'success';
				successCount++;
				consecutiveFailures = 0;
				addLog(`Ping successful (${response.status})`, 'success');
			} else {
				lastPingStatus = 'error';
				consecutiveFailures++;
				// More descriptive error message based on status code
				const errorMessage =
					response.status === 404
						? 'URL not found'
						: response.status === 403
							? 'Access forbidden'
							: response.status === 500
								? 'Server error'
								: response.status === 502
									? 'Bad gateway'
									: response.status === 503
										? 'Service unavailable'
										: `HTTP error ${response.status}`;
				addLog(`Ping failed: ${errorMessage}`, 'error');
			}
		} catch (error) {
			lastPingStatus = 'error';
			lastPingStatusCode = null;
			consecutiveFailures++;

			// More specific error messages for common network issues
			let errorMessage = 'Unknown error';
			if (error instanceof Error) {
				if (error.message.includes('Failed to fetch')) {
					errorMessage = 'Network connection failed or server is unreachable';
				} else if (error.message.includes('NetworkError')) {
					errorMessage = 'Network error - Check if CORS is enabled on the server';
				} else if (error.message.includes('TypeError')) {
					errorMessage = 'Invalid URL format or protocol not supported';
				} else {
					errorMessage = error.message;
				}
			}
			addLog(`Ping failed: ${errorMessage}`, 'error');
		}

		if (consecutiveFailures >= maxConsecutiveFailures) {
			stopPinging();
			addLog(`Stopped pinging after ${maxConsecutiveFailures} consecutive failures`, 'warning');
		}
	}

	function startPinging() {
		if (!appUrl) {
			addLog('Please enter a URL first', 'warning');
			return;
		}

		if (!isValidUrl(appUrl)) {
			addLog('Please enter a valid URL', 'error');
			return;
		}

		isEnabled = true;
		addLog(`Started KeepRenderAlive service for ${appUrl}`, 'success');
		pingServer();

		const randomInterval = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;

		// Clear any existing interval
		if (pingInterval) clearInterval(pingInterval);

		pingInterval = window.setInterval(() => {
			pingServer();
		}, randomInterval());
	}

	function stopPinging() {
		isEnabled = false;
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}
		addLog('Keepalive service stopped', 'warning');
	}

	function togglePinging() {
		if (isEnabled) {
			stopPinging();
		} else {
			startPinging();
		}

		// Clear any existing timeout
		if (toastTimeout) {
			clearTimeout(toastTimeout);
		}

		// Show the toast
		showToast = true;

		// Hide after duration
		toastTimeout = window.setTimeout(() => {
			showToast = false;
		}, TOAST_DURATION);
	}

	onMount(() => {
		if (browser) {
			try {
				const savedUrl = localStorage.getItem('keepaliveUrl');
				if (savedUrl && !appName) {
					// Extract app name and endpoint from saved URL
					const match = savedUrl.match(/https:\/\/(.*?)\.onrender\.com\/?(.*)/);
					if (match) {
						appName = match[1];
						endpoint = match[2] || '';
					}
				}
			} catch (error) {
				console.error('Failed to read from localStorage:', error);
			}
		}
	});

	onDestroy(() => {
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}
		if (toastTimeout) {
			clearTimeout(toastTimeout);
		}
	});

	$: {
		if (browser && appName) {
			const fullUrl = `https://${appName}.onrender.com${endpoint ? '/' + endpoint : ''}`;
			appUrl = fullUrl;
			try {
				localStorage.setItem('keepaliveUrl', fullUrl);
			} catch (error) {
				console.error('Failed to write to localStorage:', error);
			}
		}
	}
</script>

<svelte:head>
	<title>KeepRenderAlive Service</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-17">
	<header class="mb-8 text-center">
		<h1 class="text-primary text-3xl font-bold">KeepRenderAlive</h1>
		<div class="text-base-content/70 mt-2">
			Keep your free tier app awake by pinging it every 10-15 minutes
		</div>
	</header>

	<div class="card mb-8 shadow-lg">
		<div class="card-body">
			<div class="form-control mb-4 w-full">
				<label for="app-url" class="label mb-4">
					<span class="label-text">App URL</span>
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

			<div class="tooltip">
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
			</div>

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
			<div class="stats w-full backdrop-blur-sm">
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
		{/if}

		<!-- divider with not text -->
		<div class="divider"></div>

		<div class="card-body">
			<h2 class="card-title mb-4">Activity Log</h2>
			<div
				class="bg-base-100 border-base-300 h-64 overflow-y-auto rounded-lg border-2 border-dashed"
			>
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
					<div class="text-base-content/70 py-4 text-center">No activity yet</div>
				{/if}
			</div>
		</div>
	</div>
</div>
