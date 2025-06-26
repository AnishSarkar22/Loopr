<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PingURL } from '$lib/types';
	import { urlService } from '$lib/services/urlService';
	import URLCard from './URLCard.svelte';

	interface Props {
		urls: PingURL[];
		viewMode: 'cards' | 'table';
		onUpdate: (url: PingURL) => void;
		onDelete: (urlId: string) => void;
	}

	let { urls, viewMode, onUpdate, onDelete }: Props = $props();

	// State for each URL's details visibility and updating status
	let showDetails = $state<Record<string, boolean>>({});
	let updating = $state<Record<string, boolean>>({});

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = 3;

	// Computed values for pagination
	let totalPages = $derived(Math.ceil(urls.length / itemsPerPage));
	let paginatedUrls = $derived(
		viewMode === 'table'
			? urls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
			: urls
	);

	// Reset to first page when URLs change
	$effect(() => {
		if (urls.length > 0 && currentPage > totalPages) {
			currentPage = 1;
		}
	});

	function goToPage(page: number) {
		currentPage = page;
	}

	function formatLastPing(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatNextPing(date: string) {
		return new Date(date).toLocaleString();
	}

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return 'Never';

		const date = new Date(timestamp);
		const today = new Date();

		let datePart = '';
		if (date.toDateString() === today.toDateString()) {
			datePart = 'Today';
		} else {
			datePart = `${date.getMonth() + 1}/${date.getDate()}`;
		}

		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const timePart = `${hours}:${minutes}`;

		return `${datePart} ${timePart}`;
	}

	function formatLogTimestamp(timestamp: string): string {
		if (!timestamp) return '';

		try {
			const date = new Date(timestamp);
			const today = new Date();

			let datePart = '';
			if (date.toDateString() === today.toDateString()) {
				datePart = 'Today';
			} else {
				datePart = `${date.getMonth() + 1}/${date.getDate()}`;
			}

			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			const seconds = date.getSeconds().toString().padStart(2, '0');
			const timePart = `${hours}:${minutes}:${seconds}`;

			return `${datePart} ${timePart}`;
		} catch (error) {
			return timestamp; // fallback to original if parsing fails
		}
	}

	function getStatusBadge(url: PingURL) {
		if (!url.isEnabled) return 'badge-warning';
		if (url.lastPingStatus === 'success') return 'badge-success';
		if (url.lastPingStatus === 'error') return 'badge-error';
		return 'badge-ghost';
	}

	function getStatusText(url: PingURL) {
		if (!url.isEnabled) return 'Disabled';
		if (url.lastPingStatus === 'success') return 'Active';
		if (url.lastPingStatus === 'error') return 'Failed';
		return 'Pending';
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'success':
				return 'text-success';
			case 'error':
				return 'text-error';
			default:
				return 'text-base-content';
		}
	}

	async function toggleStatus(url: PingURL) {
		if (!url.id) return;

		updating[url.id] = true;
		try {
			const updatedUrl = await urlService.updateURL(url.id, {
				isEnabled: !url.isEnabled
			});
			onUpdate(updatedUrl);
		} catch (error) {
			console.error('Error toggling URL status:', error);
		} finally {
			updating[url.id] = false;
		}
	}

	function toggleDetails(urlId: string) {
		showDetails[urlId] = !showDetails[urlId];
	}
</script>

{#if urls.length === 0}
	<div class="hero bg-base-200 rounded-box min-h-96">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="mb-5">
					<div
						class="bg-primary/10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="text-primary h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
					</div>
				</div>
				<h1 class="text-2xl font-bold">No URLs Yet</h1>
				<p class="text-base-content/70 py-4">
					Start monitoring your first URL to keep your applications alive and running smoothly.
				</p>
			</div>
		</div>
	</div>
{:else if viewMode === 'cards'}
	<!-- Cards View -->
	<URLCard {urls} {onUpdate} {onDelete} />
{:else}
	<!-- Table View -->
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body p-0">
			<div class="rounded-box border-base-300/100 bg-base-100 overflow-x-auto border">
				<table class="table-xl table">
					<thead>
						<tr>
							<th>URL</th>
							<th>Status</th>
							<th>Interval</th>
							<th>Last Ping</th>
							<th>Next Ping</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedUrls as url, index (url.id)}
							<tr class="hover:bg-base-300">
								<td>
									<div class="flex items-center gap-3">
										<div class="avatar placeholder">
											<div class="bg-neutral text-neutral-content w-8 rounded-full">
												<span class="text-xs">🔗</span>
											</div>
										</div>
										<div>
											<div class="max-w-xs truncate text-base font-medium" title={url.url}>
												<span> {url.name || 'Unnamed'} </span>
											</div>
											<div class="text-base-content/60 text-xs">
												<a
													href={url.url}
													target="_blank"
													rel="noopener noreferrer"
													class="link link-hover"
												>
													{url.url}
												</a>
											</div>
										</div>
									</div>
								</td>
								<td>
									<div class="badge {getStatusBadge(url)} badge-sm">
										{getStatusText(url)}
									</div>
								</td>
								<td>
									<span class="text-sm">{url.pingInterval || 15} mins</span>
								</td>
								<td>
									<div class="flex flex-col">
										<span class="text-base-content/60 text-xs">
											{url.lastPingTime ? formatLastPing(url.lastPingTime) : 'Never'}
										</span>
										{#if url.lastPingStatusCode}
											<span class="text-xs {getStatusColor(url.lastPingStatus || '')}">
												{url.lastPingStatusCode}
											</span>
										{/if}
									</div>
								</td>
								<td>
									<span class="text-base-content/60 text-xs">
										{url.nextPingTime ? formatNextPing(url.nextPingTime) : 'N/A'}
									</span>
								</td>
								<td class="relative">
									<div class="dropdown dropdown-end">
										<button tabindex="0" class="btn btn-ghost btn-sm" aria-label="URL actions menu">
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
													d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
												/>
											</svg>
										</button>
										<ul
											class="dropdown-content menu bg-base-100 rounded-box border-base-content/5 absolute right-0 z-[9999] w-52 border p-2 shadow-2xl {index ===
											0
												? 'top-full mt-1'
												: index === paginatedUrls.length - 1
													? 'bottom-full mb-1'
													: 'top-0 -translate-y-full transform'}"
										>
											<li>
												<button onclick={() => toggleStatus(url)} disabled={updating[url.id || '']}>
													{#if updating[url.id || '']}
														<span class="loading loading-spinner loading-xs"></span>
													{:else if url.isEnabled}
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
														Disable
													{:else}
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M14.828 14.828a4 4 0 01-5.656 0M9 10v.01M15 10v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
														Enable
													{/if}
												</button>
											</li>
											<li>
												<button onclick={() => url.id && toggleDetails(url.id)}>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
														></path>
													</svg>
													{showDetails[url.id || ''] ? 'Hide Details' : 'Show Details'}
												</button>
											</li>
											<li>
												<a href="/urls/{url.id}/edit">
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														></path>
													</svg>
													Edit URL
												</a>
											</li>
										</ul>
									</div>
								</td>
							</tr>
							<!-- Detailed View Row -->
							{#if showDetails[url.id || '']}
								<tr transition:fade>
									<td colspan="7" class="bg-base-200/50">
										<div class="space-y-3 p-4">
											<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
												<div>
													<div class="text-base-content/70 text-xs font-semibold">
														Success Count
													</div>
													<div class="text-primary text-lg font-bold">{url.successCount || 0}</div>
												</div>
												<div>
													<div class="text-base-content/70 text-xs font-semibold">Created</div>
													<div class="text-sm">{formatTimestamp(url.$createdAt || '')}</div>
												</div>
												<div>
													<div class="text-base-content/70 text-xs font-semibold">Updated</div>
													<div class="text-sm">{formatTimestamp(url.$updatedAt || '')}</div>
												</div>
												<div>
													<div class="text-base-content/70 text-xs font-semibold">Status</div>
													<div
														class="badge {url.isEnabled
															? 'badge-success'
															: 'badge-warning'} badge-sm"
													>
														{url.isEnabled ? 'Active' : 'Inactive'}
													</div>
												</div>
											</div>

											{#if url.description}
												<div>
													<div class="text-base-content/70 mb-1 text-xs font-semibold">
														Description
													</div>
													<div class="text-sm">{url.description}</div>
												</div>
											{/if}

											{#if url.logs && url.logs.length > 0}
												<div>
													<div class="text-base-content/70 mb-2 text-xs font-semibold">
														Recent Activity
													</div>
													<div class="max-h-32 space-y-1 overflow-y-auto">
														{#each url.logs.slice(0, 5) as log}
															<div class="bg-base-100 rounded border p-2 text-xs">
																<span class="text-base-content/60 font-mono"
																	>[{formatLogTimestamp(log.timestamp)}]</span
																>
																<span class="ml-2">{log.message}</span>
															</div>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Pagination -->
		{#if viewMode === 'table' && urls.length > itemsPerPage}
			<div class="card-body pt-5">
				<div class="flex justify-center">
					<div class="join">
						<button
							class="join-item btn btn-sm"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
						>
							«
						</button>

						{#each Array(totalPages).fill(0) as _, i}
							<button
								class="join-item btn btn-sm {currentPage === i + 1 ? 'btn-active' : ''}"
								onclick={() => goToPage(i + 1)}
							>
								{i + 1}
							</button>
						{/each}

						<button
							class="join-item btn btn-sm"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							»
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
