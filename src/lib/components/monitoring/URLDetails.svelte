<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { account } from '$lib/appwrite';
	import { urlService } from '$lib/services/urlService';
	import type { PingURL, Log } from '$lib/types';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import ActivityLogs from '../shared/ActivityLogs.svelte';

	let url = $state<PingURL | null>(null);
	let userId = $state<string | null>(null);
	let loading = $state(true);
	let refreshing = $state(false);
	let autoRefresh = $state(true);
	let refreshInterval: number | null = null;

	// Toast states
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

	let urlId = $derived($page.params.id);

	// Parse logs from URL object
	let urlLogs = $derived(() => {
		if (!url?.logs) return [];

		try {
			const logs = Array.isArray(url.logs) ? url.logs : JSON.parse(url.logs || '[]');

			return Array.isArray(logs) ? logs : [];
		} catch (error) {
			console.error('Failed to parse logs:', error);
			return [];
		}
	});

	onMount(async () => {
		try {
			const session = await account.get();
			userId = session.$id;
			await loadUrl();

			if (autoRefresh) {
				startAutoRefresh();
			}
		} catch (error) {
			console.error('Authentication error:', error);
			goto('/login');
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadUrl() {
		if (!urlId) return;

		try {
			url = await urlService.getURL(urlId);
		} catch (error) {
			console.error('Error loading URL:', error);
			showAlert('Failed to load URL details', 'error');
		}
	}

	function startAutoRefresh() {
		refreshInterval = window.setInterval(async () => {
			if (document.visibilityState === 'visible') {
				await loadUrl();
			}
		}, 30000); // Refresh every 30 seconds
	}

	function toggleAutoRefresh() {
		if (autoRefresh) {
			startAutoRefresh();
		} else if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	async function refreshStatus() {
		refreshing = true;
		try {
			await loadUrl();
			showAlert('Status refreshed', 'success');
		} catch (error) {
			showAlert('Failed to refresh status', 'error');
		} finally {
			refreshing = false;
		}
	}

	async function toggleUrl() {
		if (!url) return;

		try {
			url = await urlService.toggleURL(url.id!, !url.isEnabled);
			showAlert(
				`${url.isEnabled ? 'Started' : 'Stopped'} monitoring`,
				url.isEnabled ? 'success' : 'warning'
			);
		} catch (error) {
			console.error('Error toggling URL:', error);
			showAlert('Failed to update URL status', 'error');
		}
	}

	function showAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		toastMessage = message;
		toastType = type;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return 'Never';

		const date = new Date(timestamp);
		const now = new Date();

		if (date.toDateString() === now.toDateString()) {
			return 'Today ' + date.toLocaleTimeString();
		} else {
			return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
		}
	}

	function getUrlHostname(urlString: string): string {
		try {
			return new URL(urlString).hostname;
		} catch {
			return urlString;
		}
	}
</script>

<svelte:head>
	<title>{url?.name || 'URL Details'} - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Back Navigation -->
	<div class="mb-6">
		<a href="/" class="btn btn-ghost btn-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if url}
		<!-- URL Header -->
		<div class="card bg-base-100 mb-6 shadow-lg">
			<div class="card-body">
				<div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
					<div>
						<div class="mb-2 flex items-center gap-3">
							<div
								class="h-4 w-4 rounded-full"
								class:bg-success={url.isEnabled && url.lastPingStatus === 'success'}
								class:bg-error={url.isEnabled && url.lastPingStatus === 'error'}
								class:bg-base-content={!url.isEnabled}
								class:opacity-30={!url.isEnabled}
							></div>
							<h1 class="text-2xl font-bold">
								{url.name || getUrlHostname(url.url)}
							</h1>
							<div
								class="badge"
								class:badge-success={url.isEnabled}
								class:badge-ghost={!url.isEnabled}
							>
								{url.isEnabled ? 'Active' : 'Inactive'}
							</div>
						</div>
						<p class="text-base-content/70 mb-2">{url.url}</p>
						{#if url.description}
							<p class="text-base-content/60 text-sm">{url.description}</p>
						{/if}
					</div>

					<div class="flex gap-2">
						<button class="btn btn-sm btn-outline" onclick={refreshStatus} disabled={refreshing}>
							{#if refreshing}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
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
							{/if}
							Refresh
						</button>

						<button
							class="btn btn-sm"
							class:btn-error={url.isEnabled}
							class:btn-success={!url.isEnabled}
							onclick={toggleUrl}
						>
							{url.isEnabled ? 'Stop Monitoring' : 'Start Monitoring'}
						</button>

						<a href="/urls/{url.id}/edit" class="btn btn-sm btn-outline">
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
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Edit
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="stat bg-base-100 rounded-lg shadow-lg">
				<div class="stat-title">Success Count</div>
				<div class="stat-value text-success">{url.successCount}</div>
			</div>

			<div class="stat bg-base-100 rounded-lg shadow-lg">
				<div class="stat-title">Last Ping</div>
				<div class="stat-value text-sm">
					{formatTimestamp(url.lastPingTime || '').split(' ')[0]}
				</div>
				<div class="stat-desc">
					{formatTimestamp(url.lastPingTime || '').split(' ')[1] || ''}
				</div>
			</div>

			<div class="stat bg-base-100 rounded-lg shadow-lg">
				<div class="stat-title">Last Status</div>
				<div
					class="stat-value"
					class:text-success={url.lastPingStatus === 'success'}
					class:text-error={url.lastPingStatus === 'error'}
				>
					{url.lastPingStatusCode || 'N/A'}
				</div>
				<div class="stat-desc">
					{url.lastPingStatus === 'success' ? 'OK' : url.lastPingStatus === 'error' ? 'Error' : ''}
				</div>
			</div>

			<div class="stat bg-base-100 rounded-lg shadow-lg">
				<div class="stat-title">Ping Interval</div>
				<div class="stat-value text-primary">{url.pingInterval || 15}</div>
				<div class="stat-desc">minutes</div>
			</div>
		</div>

		<!-- Auto Refresh Toggle -->
		<div class="card bg-base-100 mb-6 shadow-lg">
			<div class="card-body py-4">
				<div class="flex items-center justify-between">
					<span class="text-sm">Auto-refresh every 30 seconds</span>
					<input
						type="checkbox"
						class="toggle toggle-primary checked:bg-gray-50 checked:text-black"
						bind:checked={autoRefresh}
						onchange={toggleAutoRefresh}
					/>
				</div>
			</div>
		</div>

		<!-- Activity Logs for this specific URL -->
		<ActivityLogs
			logs={urlLogs()}
			title="Activity Logs for {url.name || getUrlHostname(url.url)}"
			showRefresh={true}
			{refreshing}
			onRefresh={refreshStatus}
			showHostname={false}
		/>
	{:else}
		<div class="py-12 text-center">
			<h1 class="mb-4 text-2xl font-bold">URL Not Found</h1>
			<p class="text-base-content/70 mb-6">
				The URL you're looking for doesn't exist or you don't have access to it.
			</p>
			<a href="/" class="btn btn-primary">Back to Dashboard</a>
		</div>
	{/if}
</div>

<!-- Toast Notification -->
{#if showToast}
	<div class="toast toast-top toast-center z-50" transition:fade>
		<div
			class="alert"
			class:alert-success={toastType === 'success'}
			class:alert-error={toastType === 'error'}
			class:alert-warning={toastType === 'warning'}
			class:alert-info={toastType === 'info'}
		>
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}
