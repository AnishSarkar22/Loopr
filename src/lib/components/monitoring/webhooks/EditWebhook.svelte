<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { account } from '$lib/appwrite';
	import { webhookService } from '$lib/services/webhookService';
	import type { ScheduledWebhook } from '$lib/types';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let webhook = $state<ScheduledWebhook | null>(null);
	let userId = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let showDeleteModal = $state(false);

	// Form fields
	let urlInput = $state('');
	let name = $state('');
	let description = $state('');
	let method = $state('POST');
	let payload = $state('');
	let headers = $state('');
	let scheduledTime = $state('');
	let maxRetries = $state(3);
	let priority = $state(1);

	// Toast states
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

	// Error states
	let errors = $state<Record<string, string>>({});

	let webhookId = $derived($page.params.id);

	onMount(async () => {
		try {
			const session = await account.get();
			userId = session.$id;
			await loadWebhook();
		} catch (error) {
			console.error('Authentication error:', error);
			goto('/login');
		} finally {
			loading = false;
		}
	});

	async function loadWebhook() {
		if (!webhookId || !userId) return;

		try {
			const result = await webhookService.getWebhooks(userId);
			webhook = result.webhooks.find((w: ScheduledWebhook) => w.id === webhookId) || null;

			if (webhook) {
				// Populate form fields
				urlInput = webhook.url;
				name = webhook.name || '';
				description = webhook.description || '';
				method = webhook.method || 'POST';
				payload = webhook.payload || '';
				headers = webhook.headers || '';
				scheduledTime = webhook.scheduledTime
					? new Date(webhook.scheduledTime).toISOString().slice(0, 16)
					: '';
				maxRetries = webhook.maxRetries || 3;
				priority = webhook.priority || 1;
			}
		} catch (error) {
			console.error('Error loading webhook:', error);
			showAlert('Failed to load webhook details', 'error');
		}
	}

	function validateForm(): boolean {
		errors = {};

		if (!urlInput.trim()) {
			errors.url = 'URL is required';
		} else {
			if (!isValidUrl(urlInput.trim())) {
				errors.url = 'Please enter a valid URL';
			}
		}

		if (name.trim().length > 50) {
			errors.name = 'Name must be 50 characters or less';
		}

		if (description.trim().length > 200) {
			errors.description = 'Description must be 200 characters or less';
		}

		if (!scheduledTime) {
			errors.scheduledTime = 'Scheduled time is required';
		} else {
			const scheduleDate = new Date(scheduledTime);
			if (scheduleDate <= new Date()) {
				errors.scheduledTime = 'Scheduled time must be in the future';
			}
		}

		if (maxRetries < 0 || maxRetries > 10) {
			errors.maxRetries = 'Max retries must be between 0 and 10';
		}

		if (priority < 1 || priority > 10) {
			errors.priority = 'Priority must be between 1 and 10';
		}

		if (payload && !isValidJSON(payload)) {
			errors.payload = 'Payload must be valid JSON';
		}

		if (headers && !isValidJSON(headers)) {
			errors.headers = 'Headers must be valid JSON';
		}

		return Object.keys(errors).length === 0;
	}

	function isValidUrl(inputUrl: string): boolean {
		try {
			new URL(inputUrl);
			return true;
		} catch {
			return false;
		}
	}

	function isValidJSON(jsonString: string): boolean {
		try {
			JSON.parse(jsonString);
			return true;
		} catch {
			return false;
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!validateForm() || !webhook || loading || webhook.status !== 'pending') return;

		saving = true;
		try {
			const updateData = {
				url: urlInput.trim(),
				name: name.trim() || undefined,
				description: description.trim() || undefined,
				method: method,
				scheduledTime: new Date(scheduledTime).toISOString(),
				maxRetries,
				priority,
				...(payload && { payload: payload.trim() }),
				...(headers && { headers: headers.trim() })
			};

			await webhookService.updateWebhook(webhook.id!, updateData);
			showAlert('Webhook updated successfully', 'success');

			// Redirect back to webhook view after a short delay
			setTimeout(() => {
				goto('/webhooks');
			}, 1500);
		} catch (error) {
			console.error('Error updating webhook:', error);
			showAlert(error instanceof Error ? error.message : 'Failed to update webhook', 'error');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!webhook) return;
		try {
			await webhookService.deleteWebhook(webhook.id!);
			showAlert('Webhook deleted successfully', 'success');
			setTimeout(() => {
				goto('/webhooks');
			}, 1500);
		} catch (error) {
			showAlert('Failed to delete webhook', 'error');
		}
		showDeleteModal = false;
	}

	async function handleCancel() {
		if (!webhook || webhook.status !== 'pending') return;
		try {
			await webhookService.cancelWebhook(webhook.id!);
			showAlert('Webhook cancelled successfully', 'success');
			await loadWebhook(); // Refresh data
		} catch (error) {
			showAlert('Failed to cancel webhook', 'error');
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'failed':
				return 'badge-error';
			case 'cancelled':
				return 'badge-warning';
			case 'pending':
				return 'badge-info';
			default:
				return 'badge-ghost';
		}
	}

	function getPriorityText(priority: number) {
		if (priority >= 8) return 'High';
		if (priority >= 5) return 'Medium';
		return 'Low';
	}

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<svelte:head>
	<title>Edit {webhook?.name || 'Webhook'} - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<!-- Back Navigation -->
	<div class="mb-4 flex items-center gap-2">
		<a href="/webhooks" class="btn btn-ghost btn-sm flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			<span class="hidden sm:inline">Back to Webhooks Dashboard</span>
			<span class="sm:hidden">Back</span>
		</a>
	</div>

	<!-- Read-only info for non-pending webhooks -->
	{#if webhook && webhook.status !== 'pending'}
		<div class="alert alert-info mb-4 flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0"
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
			<span>
				This webhook is <b>{webhook.status}</b> and cannot be edited. Only pending webhooks can be modified.
			</span>
		</div>
	{/if}

	{#if loading}
		<!-- DaisyUI Skeleton Loader -->
		<div class="card bg-base-100 animate-pulse shadow-lg">
			<div class="card-body">
				<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div class="bg-base-200 skeleton mb-2 h-7 w-32 rounded"></div>
						<div class="bg-base-200 skeleton h-4 w-40 rounded"></div>
					</div>
					<div class="flex items-center gap-2">
						<div class="bg-base-200 skeleton h-6 w-16 rounded-full"></div>
						<div class="bg-base-200 skeleton h-4 w-20 rounded"></div>
					</div>
				</div>
				<div class="space-y-4">
					{#each Array(8) as _}
						<div class="form-control">
							<div class="bg-base-200 skeleton mb-2 h-4 w-24 rounded"></div>
							<div class="bg-base-200 skeleton h-10 w-full rounded"></div>
						</div>
					{/each}
					<div class="card-actions flex flex-col justify-between gap-2 pt-4 sm:flex-row">
						<div class="bg-base-200 skeleton h-10 w-32 rounded"></div>
						<div class="flex gap-2">
							<div class="bg-base-200 skeleton h-10 w-20 rounded"></div>
							<div class="bg-base-200 skeleton h-10 w-28 rounded"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else if webhook}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<!-- Header -->
				<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-2xl font-bold">Edit Webhook</h1>
						<p class="text-base-content/60 text-sm">
							Created {formatDateTime(webhook.$createdAt || '')}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="badge {getStatusColor(webhook.status)}">
							{webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}
						</div>
						<div class="badge badge-outline">
							{getPriorityText(webhook.priority || 1)} Priority
						</div>
					</div>
				</div>

				<!-- Edit Form -->
				<form onsubmit={handleSubmit} class="grid grid-cols-1 gap-6">
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- URL Input -->
						<div class="form-control col-span-1">
							<label class="label" for="url-input">
								<span class="label-text font-medium">Webhook URL *</span>
							</label>
							<input
								id="url-input"
								type="url"
								bind:value={urlInput}
								placeholder="https://api.example.com/webhook"
								class="input input-bordered"
								class:input-error={errors.url}
								disabled={webhook.status !== 'pending'}
								required
							/>
							{#if errors.url}
								<div class="label">
									<span class="label-text-alt text-error">{errors.url}</span>
								</div>
							{/if}
						</div>

						<!-- Name Input -->
						<div class="form-control col-span-1">
							<label class="label" for="name-input">
								<span class="label-text font-medium">Name (Optional)</span>
							</label>
							<input
								id="name-input"
								type="text"
								bind:value={name}
								placeholder="My Webhook"
								maxlength="50"
								class="input input-bordered"
								class:input-error={errors.name}
								disabled={webhook.status !== 'pending'}
							/>
							{#if errors.name}
								<div class="label">
									<span class="label-text-alt text-error">{errors.name}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Description Input -->
					<div class="form-control">
						<label class="label" for="description-input">
							<span class="label-text font-medium">Description (Optional)</span>
						</label>
						<textarea
							id="description-input"
							bind:value={description}
							placeholder="Brief description of this webhook..."
							maxlength="200"
							rows="2"
							class="textarea textarea-bordered"
							class:textarea-error={errors.description}
							disabled={webhook.status !== 'pending'}
						></textarea>
						{#if errors.description}
							<div class="label">
								<span class="label-text-alt text-error">{errors.description}</span>
							</div>
						{/if}
					</div>

					<!-- Method & Scheduled Time -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="form-control">
							<label class="label" for="method-select">
								<span class="label-text font-medium">HTTP Method</span>
							</label>
							<select
								id="method-select"
								bind:value={method}
								class="select select-bordered"
								disabled={webhook.status !== 'pending'}
							>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
								<option value="PUT">PUT</option>
								<option value="PATCH">PATCH</option>
								<option value="DELETE">DELETE</option>
							</select>
						</div>
						<div class="form-control">
							<label class="label" for="scheduled-time-input">
								<span class="label-text font-medium">Scheduled Time *</span>
							</label>
							<input
								id="scheduled-time-input"
								type="datetime-local"
								bind:value={scheduledTime}
								class="input input-bordered"
								class:input-error={errors.scheduledTime}
								disabled={webhook.status !== 'pending'}
								required
							/>
							{#if errors.scheduledTime}
								<div class="label">
									<span class="label-text-alt text-error">{errors.scheduledTime}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Priority & Max Retries -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="form-control">
							<label class="label" for="priority-input">
								<span class="label-text font-medium">Priority (1-4)</span>
							</label>
							<input
								id="priority-input"
								type="number"
								bind:value={priority}
								min="1"
								max="10"
								class="input input-bordered"
								class:input-error={errors.priority}
								disabled={webhook.status !== 'pending'}
							/>
							<div class="label">
								<span class="label-text-alt">Higher numbers = higher priority</span>
							</div>
							{#if errors.priority}
								<div class="label">
									<span class="label-text-alt text-error">{errors.priority}</span>
								</div>
							{/if}
						</div>
						<div class="form-control">
							<label class="label" for="retries-input">
								<span class="label-text font-medium">Max Retries</span>
							</label>
							<input
								id="retries-input"
								type="number"
								bind:value={maxRetries}
								min="0"
								max="10"
								class="input input-bordered"
								class:input-error={errors.maxRetries}
								disabled={webhook.status !== 'pending'}
							/>
							{#if errors.maxRetries}
								<div class="label">
									<span class="label-text-alt text-error">{errors.maxRetries}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Payload & Headers -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						{#if method !== 'GET'}
							<div class="form-control">
								<label class="label" for="payload-input">
									<span class="label-text font-medium">Payload (JSON)</span>
								</label>
								<textarea
									id="payload-input"
									bind:value={payload}
									placeholder="Payload (JSON)"
									rows="3"
									class="textarea textarea-bordered font-mono text-sm"
									class:textarea-error={errors.payload}
									disabled={webhook.status !== 'pending'}
								></textarea>
								{#if errors.payload}
									<div class="label">
										<span class="label-text-alt text-error">{errors.payload}</span>
									</div>
								{/if}
							</div>
						{/if}
						<div class="form-control">
							<label class="label" for="headers-input">
								<span class="label-text font-medium">Headers (JSON)</span>
							</label>
							<textarea
								id="headers-input"
								bind:value={headers}
								placeholder="Headers (JSON)"
								rows="3"
								class="textarea textarea-bordered font-mono text-sm"
								class:textarea-error={errors.headers}
								disabled={webhook.status !== 'pending'}
							></textarea>
							{#if errors.headers}
								<div class="label">
									<span class="label-text-alt text-error">{errors.headers}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="card-actions flex flex-col justify-between gap-2 pt-4 sm:flex-row">
						<div class="flex gap-2">
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
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									/>
								</svg>
								Delete
							</button>
							{#if webhook.status === 'pending'}
								<button type="button" class="btn btn-warning btn-outline" onclick={handleCancel}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											fill="none"
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.5"
											d="m15.75 15l-6-6m0 6l6-6m7 3c0-5.523-4.477-10-10-10s-10 4.477-10 10s4.477 10 10 10s10-4.477 10-10"
										/>
									</svg>
									Cancel
								</button>
							{/if}
						</div>
						<div class="flex gap-2">
							<a href="/webhooks" class="btn btn-ghost">Back</a>
							{#if webhook.status === 'pending'}
								<button type="submit" class="btn btn-primary" disabled={saving}>
									{#if saving}
										<span class="loading loading-spinner loading-sm"></span>
									{/if}
									Save Changes
								</button>
							{/if}
						</div>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<div class="py-12 text-center">
			<h1 class="mb-4 text-2xl font-bold">Webhook Not Found</h1>
			<p class="text-base-content/70 mb-6">
				The webhook you're looking for doesn't exist or you don't have access to it.
			</p>
			<a href="/webhooks" class="btn btn-primary">Back to Webhooks Dashboard</a>
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

<!-- Delete Modal -->
{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-error text-lg font-bold">Delete Webhook</h3>
			<p class="py-4">
				Are you sure you want to delete this webhook? This action cannot be undone.
			</p>
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

<style>
	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		box-shadow: none;
	}
</style>
