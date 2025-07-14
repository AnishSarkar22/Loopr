<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { account } from '$lib/appwrite';
	import { urlService, formatPingInterval } from '$lib/services/urlService';
	import type { PingURL } from '$lib/types';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let url = $state<PingURL | null>(null);
	let userId = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let showDeleteModal = $state(false);

	// Form fields
	let urlInput = $state('');
	let name = $state('');
	let description = $state('');
	let pingInterval = $state(15);
	let isEnabled = $state(true);

	// Toast states
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

	// Error states
	let errors = $state<Record<string, string>>({});

	let urlId = $derived($page.params.id);

	onMount(async () => {
		try {
			const session = await account.get();
			userId = session.$id;
			await loadUrl();
		} catch (error) {
			console.error('Authentication error:', error);
			goto('/login');
		} finally {
			loading = false;
		}
	});

	async function loadUrl() {
		if (!urlId) return;

		try {
			url = await urlService.getURL(urlId);
			if (url) {
				// Populate form fields
				urlInput = url.url;
				name = url.name || '';
				description = url.description || '';
				pingInterval = url.pingInterval || 15;
				isEnabled = url.isEnabled;
			}
		} catch (error) {
			console.error('Error loading URL:', error);
			showAlert('Failed to load URL details', 'error');
		}
	}

	function validateForm(): boolean {
		errors = {};

		if (!urlInput.trim()) {
			errors.url = 'URL is required';
		} else {
			const normalizedUrl = normalizeUrl(urlInput.trim());
			if (!isValidUrl(normalizedUrl)) {
				errors.url = 'Please enter a valid URL';
			}
		}

		if (name.trim().length > 50) {
			errors.name = 'Name must be 50 characters or less';
		}

		if (description.trim().length > 200) {
			errors.description = 'Description must be 200 characters or less';
		}

		if (pingInterval < 5 || pingInterval > 1440) {
			errors.pingInterval = 'Ping interval must be between 5 and 1440 minutes';
		}

		return Object.keys(errors).length === 0;
	}

	function normalizeUrl(inputUrl: string): string {
		if (!inputUrl) return '';
		if (!/^https?:\/\//i.test(inputUrl)) {
			return `https://${inputUrl}`;
		}
		return inputUrl;
	}

	function isValidUrl(inputUrl: string): boolean {
		try {
			new URL(inputUrl);
			return true;
		} catch {
			return false;
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!url || !validateForm()) return;

		saving = true;
		try {
			const normalizedUrl = normalizeUrl(urlInput.trim());
			const updatedUrl = await urlService.updateURL(url.id!, {
				url: normalizedUrl,
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				pingInterval,
				isEnabled
			});

			showAlert('URL updated successfully', 'success');

			// Update local state
			url = updatedUrl;

			// Redirect back to details page after a short delay
			setTimeout(() => {
				// goto(`/urls/${url!.id}`);
				goto('/dashboard');
			}, 1500);
		} catch (error) {
			console.error('Error updating URL:', error);
			showAlert(error instanceof Error ? error.message : 'Failed to update URL', 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!url) return;
		try {
			await urlService.deleteURL(url.id!);
			showAlert('URL deleted successfully', 'success');
			setTimeout(() => {
				goto('/dashboard');
			}, 1500);
		} catch (error) {
			showAlert('Failed to delete URL', 'error');
		}
		showDeleteModal = false;
	}

	function showAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		toastMessage = message;
		toastType = type;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
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
	<title>Edit {url?.name || 'URL'} - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Back Navigation -->
	<div class="mb-6">
		<a href="/dashboard" class="btn btn-ghost btn-sm">
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
		 <!-- DaisyUI Skeleton Loader -->
        <div class="card bg-base-100 shadow-lg animate-pulse">
            <div class="card-body">
                <!-- Header Skeleton -->
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <div class="h-7 w-32 bg-base-200 rounded mb-2 skeleton"></div>
                        <div class="h-4 w-40 bg-base-200 rounded skeleton"></div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="h-6 w-16 bg-base-200 rounded-full skeleton"></div>
                        <div class="h-4 w-20 bg-base-200 rounded skeleton"></div>
                    </div>
                </div>
                <!-- Form Skeleton -->
                <div class="space-y-6">
                    <div class="form-control">
                        <div class="h-4 w-24 bg-base-200 rounded mb-2 skeleton"></div>
                        <div class="h-10 w-full bg-base-200 rounded skeleton"></div>
                    </div>
                    <div class="form-control">
                        <div class="h-4 w-32 bg-base-200 rounded mb-2 skeleton"></div>
                        <div class="h-10 w-full bg-base-200 rounded skeleton"></div>
                    </div>
                    <div class="form-control">
                        <div class="h-4 w-40 bg-base-200 rounded mb-2 skeleton"></div>
                        <div class="h-20 w-full bg-base-200 rounded skeleton"></div>
                    </div>
                    <div class="form-control">
                        <div class="h-4 w-28 bg-base-200 rounded mb-2 skeleton"></div>
                        <div class="h-10 w-full bg-base-200 rounded skeleton"></div>
                    </div>
                    <div class="form-control">
                        <div class="flex items-center justify-between">
                            <div class="h-4 w-32 bg-base-200 rounded skeleton"></div>
                            <div class="h-6 w-12 bg-base-200 rounded-full skeleton"></div>
                        </div>
                        <div class="h-3 w-40 bg-base-200 rounded mt-2 skeleton"></div>
                    </div>
                    <div class="card-actions justify-between pt-4">
                        <div class="h-10 w-32 bg-base-200 rounded skeleton"></div>
                        <div class="flex gap-2">
                            <div class="h-10 w-20 bg-base-200 rounded skeleton"></div>
                            <div class="h-10 w-28 bg-base-200 rounded skeleton"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
	{:else if url}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<!-- Header -->
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-bold">Edit URL</h1>
						<p class="text-base-content/70">
							{url.name || getUrlHostname(url.url)}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="badge"
							class:badge-success={url.isEnabled}
							class:badge-ghost={!url.isEnabled}
						>
							{url.isEnabled ? 'Active' : 'Inactive'}
						</div>
						<div class="text-xs opacity-60">
							Every {formatPingInterval(url.pingInterval || 15)}
						</div>
					</div>
				</div>

				<!-- Edit Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- URL Input -->
					<div class="form-control">
						<label class="label" for="url-input">
							<span class="label-text font-medium">URL *</span>
						</label>
						<input
							id="url-input"
							type="url"
							bind:value={urlInput}
							placeholder="https://example.com"
							class="input input-bordered"
							class:input-error={errors.url}
							required
						/>
						{#if errors.url}
							<div class="label">
								<span class="label-text-alt text-error">{errors.url}</span>
							</div>
						{/if}
					</div>

					<!-- Name Input -->
					<div class="form-control">
						<label class="label" for="name-input">
							<span class="label-text font-medium">Name (Optional)</span>
						</label>
						<input
							id="name-input"
							type="text"
							bind:value={name}
							placeholder="My App"
							maxlength="50"
							class="input input-bordered"
							class:input-error={errors.name}
						/>
						{#if errors.name}
							<div class="label">
								<span class="label-text-alt text-error">{errors.name}</span>
							</div>
						{/if}
					</div>

					<!-- Description Input -->
					<div class="form-control">
						<label class="label" for="description-input">
							<span class="label-text font-medium">Description (Optional)</span>
						</label>
						<textarea
							id="description-input"
							bind:value={description}
							placeholder="Brief description of this URL..."
							maxlength="200"
							rows="3"
							class="textarea textarea-bordered"
							class:textarea-error={errors.description}
						></textarea>
						{#if errors.description}
							<div class="label">
								<span class="label-text-alt text-error">{errors.description}</span>
							</div>
						{/if}
					</div>

					<!-- Ping Interval -->
					<div class="form-control">
						<label class="label" for="interval-select">
							<span class="label-text font-medium">Ping Interval</span>
						</label>
						<select
							id="interval-select"
							bind:value={pingInterval}
							class="select select-bordered"
							class:select-error={errors.pingInterval}
						>
							<option value={5}>⚡ Every 5 minutes</option>
							<option value={10}>🔄 Every 10 minutes</option>
							<option value={15}>✨ Every 15 minutes</option>
							<option value={30}>⏰ Every 30 minutes</option>
							<option value={60}>🕐 Every hour</option>
							<option value={180}>🕒 Every 3 hours</option>
							<option value={360}>🕕 Every 6 hours</option>
							<option value={720}>🕘 Every 12 hours</option>
							<option value={1440}>📅 Every 24 hours</option>
						</select>
						{#if errors.pingInterval}
							<div class="label">
								<span class="label-text-alt text-error">{errors.pingInterval}</span>
							</div>
						{/if}
					</div>

					<!-- Enable/Disable Toggle -->
					<div class="form-control">
						<div class="flex items-center justify-between">
							<span class="label-text font-medium">Enable Monitoring</span>
							<input
								type="checkbox"
								class="toggle toggle-primary checked:bg-gray-50 checked:text-black"
								bind:checked={isEnabled}
							/>
						</div>
						<div class="label">
							<span class="label-text-alt">
								{isEnabled ? 'URL monitoring is active' : 'URL monitoring is paused'}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="card-actions justify-between pt-4">
						<button
							type="button"
							class="btn btn-error btn-outline"
							onclick={() => (showDeleteModal = true)}
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Delete URL
						</button>

						<div class="flex gap-2">
							<a href="/dashboard" class="btn btn-ghost"> Cancel </a>
							<button type="submit" class="btn btn-primary" disabled={saving}>
								{#if saving}
									<span class="loading loading-spinner loading-sm"></span>
								{/if}
								Save Changes
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<div class="py-12 text-center">
			<h1 class="mb-4 text-2xl font-bold">URL Not Found</h1>
			<p class="text-base-content/70 mb-6">
				The URL you're looking for doesn't exist or you don't have access to it.
			</p>
			<a href="/Dashboard" class="btn btn-primary">Back to Dashboard</a>
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

{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-error text-lg font-bold">Delete URL</h3>
			<p class="py-4">Are you sure you want to delete this URL? This action cannot be undone.</p>
			<div class="modal-action">
				<button class="btn btn-error" onclick={handleDelete}>Yes, Delete</button>
				<button class="btn" onclick={() => (showDeleteModal = false)}>Cancel</button>
			</div>
		</div>
		<button
			type="button"
			class="modal-backdrop"
			aria-label="Close modal"
			onclick={() => (showDeleteModal = false)}
		></button>
	</div>
{/if}
