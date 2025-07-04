<!--
Copyright (C) 2025 Anish Sarkar

This file is part of Loopr.

Loopr is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Loopr is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Loopr.  If not, see <https://www.gnu.org/licenses/>.
-->

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import type { PingURL } from '$lib/types';
	import { urlService } from '$lib/services/urlService';
	import { account } from '$lib/appwrite';
	import URLList from './monitoring/views/URLList.svelte';
	import AddURLForm from './monitoring/AddURLForm.svelte';

	let urls = $state<PingURL[]>([]);
	let isAuthenticated = $state(false);
	let userId = $state<string | null>(null);
	let loading = $state(true);
	let showAddForm = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');
	let viewMode = $state<'cards' | 'table'>('table');

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

			// Fix any URLs with missing nextPingTime first
			await urlService.fixMissingNextPingTimes(userId);

			// now load the URLs
			await loadURLs();
		} catch (error) {
			console.error('Error loading user data', error);
			isAuthenticated = false;
		} finally {
			loading = false;
		}
	});

	async function loadURLs() {
		if (!userId) return;

		try {
			const userUrls = await urlService.getURLs(userId);
			urls = userUrls || [];
		} catch (error) {
			console.error('Error loading URLs:', error);
			showToastNotification('Failed to load URLs', 'error');
		}
	}

	async function handleURLAdded(newUrl: PingURL) {
		urls = [...urls, newUrl];
		showAddForm = false;
		showToastNotification(`Successfully added ${newUrl.url}`, 'success');
	}

	async function handleURLUpdated(updatedUrl: PingURL) {
		const index = urls.findIndex((url) => url.id === updatedUrl.id);
		if (index !== -1) {
			urls[index] = updatedUrl;
		}
		showToastNotification('URL updated successfully', 'success');
	}

	async function handleURLDeleted(deletedUrlId: string) {
		urls = urls.filter((url) => url.id !== deletedUrlId);
		showToastNotification('URL deleted successfully', 'success');
	}

	function handleRefreshAll() {
		loadURLs();
		showToastNotification('Refreshing all URLs...', 'info');
	}
</script>

{#if !isAuthenticated}
	<div class="hero bg-base-200 rounded-box min-h-96">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="mb-5">
					<div
						class="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-primary h-10 w-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>
				</div>
				<h1 class="text-3xl font-bold">Authentication Required</h1>
				<p class="text-base-content/70 py-6">
					Please log in to manage your monitored URLs and access your dashboard.
				</p>
				<a href="/login" class="btn btn-primary btn-wide">Sign In</a>
			</div>
		</div>
	</div>
{:else if loading}
	<div class="flex min-h-96 flex-col items-center justify-center">
		<span class="loading loading-spinner loading-lg text-primary"></span>
		<p class="text-base-content/70 mt-4">Loading your URLs...</p>
	</div>
{:else}
	<!-- Header Section -->
	<div class="mb-8">
		<!-- Stats - Collapsible on Mobile -->
		<div class="mb-6">
			<!-- Mobile: Collapsible Stats -->
			<div class="lg:hidden">
				<div
					class="collapse-arrow bg-base-100 border-base-300 collapse rounded-xl border shadow-lg "
				>
					<input type="checkbox" class="peer" />
					<div
						class="collapse-title border-base-content/5 flex items-center justify-between border-b text-sm font-medium"
					>
						<span>Statistics Overview</span>
						<!-- <div class="flex items-center gap-2 text-xs">
							<span class="badge badge-primary badge-sm">{urls.length}</span>
                            <span class="badge badge-success badge-sm">{urls.filter((url) => url.isEnabled).length}</span>
                            <span class="badge badge-error badge-sm">{urls.filter((url) => url.lastPingStatus === 'error').length}</span>
						</div> -->
					</div>
					<div class="collapse-content bg-base-50/50">
						<div class="grid grid-cols-2 gap-3 pt-3 pb-1">
							<div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
								<div class="text-base-content/60 text-xs">Total URLs</div>
								<div class="text-primary text-lg font-bold">{urls.length}</div>
								<div class="text-base-content/50 text-xs">Monitored endpoints</div>
							</div>
							<div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
								<div class="text-base-content/60 text-xs">Active</div>
								<div class="text-success text-lg font-bold">
									{urls.filter((url) => url.isEnabled).length}
								</div>
								<div class="text-base-content/50 text-xs">Currently monitoring</div>
							</div>
							<div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
								<div class="text-base-content/60 text-xs">Inactive</div>
								<div class="text-warning text-lg font-bold">
									{urls.filter((url) => !url.isEnabled).length}
								</div>
								<div class="text-base-content/50 text-xs">Paused monitoring</div>
							</div>
							<div class="bg-base-200/80 border-base-300/30 rounded-lg border p-3 text-center">
								<div class="text-base-content/60 text-xs">Failed</div>
								<div class="text-error text-lg font-bold">
									{urls.filter((url) => url.lastPingStatus === 'error').length}
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
						<div class="stat-title text-sm">Total URLs</div>
						<div class="stat-value text-primary text-3xl">{urls.length}</div>
						<div class="stat-desc text-sm">Monitored endpoints</div>
					</div>
					<div class="stat place-items-center py-4">
						<div class="stat-title text-sm">Active</div>
						<div class="stat-value text-success text-3xl">
							{urls.filter((url) => url.isEnabled).length}
						</div>
						<div class="stat-desc text-sm">Currently monitoring</div>
					</div>
					<div class="stat place-items-center py-4">
						<div class="stat-title text-sm">Inactive</div>
						<div class="stat-value text-warning text-3xl">
							{urls.filter((url) => !url.isEnabled).length}
						</div>
						<div class="stat-desc text-sm">Paused monitoring</div>
					</div>
					<div class="stat place-items-center py-4">
						<div class="stat-title text-sm">Failed</div>
						<div class="stat-value text-error text-3xl">
							{urls.filter((url) => url.lastPingStatus === 'error').length}
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

			<!-- Add New URL Button -->
			<button
				class="btn btn-primary btn-sm w-full gap-2 sm:w-auto"
				onclick={() => (showAddForm = true)}
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
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add New URL
			</button>
		</div>
	</div>

	<!-- Add URL Form Modal -->
	{#if showAddForm}
		<div class="modal modal-open" transition:fade>
			<div class="modal-box max-w-2xl">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="text-xl font-bold">Add New URL</h3>
					<button class="btn btn-sm btn-circle btn-ghost" onclick={() => (showAddForm = false)}
						>✕</button
					>
				</div>
				<AddURLForm {userId} onSuccess={handleURLAdded} onCancel={() => (showAddForm = false)} />
			</div>
			<div
				class="modal-backdrop"
				role="button"
				tabindex="0"
				onclick={() => (showAddForm = false)}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? (showAddForm = false) : null)}
			></div>
		</div>
	{/if}

	<!-- URLs Content -->
	<URLList {urls} {viewMode} onUpdate={handleURLUpdated} onDelete={handleURLDeleted} />

	<!-- Toast Notifications -->
	{#if showToast}
		<div class="toast toast-top toast-center z-50" transition:fade>
			<div class="alert alert-{toastType} shadow-lg">
				<span>{toastMessage}</span>
			</div>
		</div>
	{/if}
{/if}