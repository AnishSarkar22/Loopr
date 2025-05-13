<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Dashboard from '$lib/components/Dashboard.svelte';

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

	function handleTogglePing() {
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

	<Dashboard
        {appName}
        {endpoint}
        {isEnabled}
        {successCount}
        {lastPingTime}
        {lastPingStatus}
        {lastPingStatusCode}
        {logs}
        {showToast}
        onTogglePing={handleTogglePing}
    />
</div>
