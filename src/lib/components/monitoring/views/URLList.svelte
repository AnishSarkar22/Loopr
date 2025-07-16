<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PingURL } from '$lib/types';
	import { urlService } from '$lib/services/urlService';
	import URLCard from './URLCard.svelte';
	import Portal from '$lib/components/monitoring/views/Portal.svelte';

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
	
	//Dropdown state management
    let activeDropdown = $state<string | null>(null);
    let dropdownButtons = $state<Record<string, HTMLElement>>({});
    let dropdownPositions = $state<Record<string, { top: number; left: number }>>({});

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

	// Dropdown functions
    function toggleDropdown(urlId: string, event: MouseEvent) {
    event.stopPropagation(); // Prevent event bubbling
    
    if (activeDropdown === urlId) {
        activeDropdown = null;
        return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    dropdownPositions[urlId] = {
        top: rect.bottom + 4, // Use viewport coordinates, not window.scrollY
        left: rect.right - 208 // 208px is the dropdown width (w-52)
    };
    
    activeDropdown = urlId;
}

    function closeDropdown() {
        activeDropdown = null;
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
    if (activeDropdown) {
        const target = event.target as Element;
        // Check if click is outside both the dropdown and the button
        if (!target.closest('.dropdown-portal') && !target.closest('button[aria-label="URL actions menu"]')) {
            closeDropdown();
        }
    }
}
	// Event listener for clicking outside
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
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
							<th class="text-center">URL</th>
                            <th class="text-center">Status</th>
                            <th class="text-center">Interval</th>
                            <th class="text-center">Last Ping</th>
                            <th class="text-center">Next Ping</th>
                            <th class="text-center"></th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedUrls as url, index (url.id)}
							<tr class="hover:bg-base-200">
								<td>
                                    <div class="flex items-center gap-4">
                                        <div class="w-2 h-8 rounded-full bg-base-300 "></div>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-semibold text-base truncate" title={url.name || url.url}>
                                                {url.name || 'Unnamed URL'}
                                            </div>
                                            <div class="text-sm text-base-content/60 truncate">
                                                <a
                                                    href={url.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="link link-hover"
                                                    title={url.url}
                                                >
                                                    {url.url.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="badge {getStatusBadge(url)} badge-sm">
                                        {getStatusText(url)}
                                    </div>
                                </td>
                                <td class="text-center">
                                    <span class="text-sm">{url.pingInterval || 15} mins</span>
                                </td>
                                <td class="text-center">
                                    <div class="flex flex-col items-center">
                                        <span class="text-base-content/60 text-xs">
                                            {url.lastPingTime ? formatLastPing(url.lastPingTime) : 'Never'}
                                        </span>
                                        <!-- {#if url.lastPingStatusCode}
											<span class="text-xs text-center {getStatusColor(url.lastPingStatus || '')}">
												{url.lastPingStatusCode}
											</span>
										{/if} -->
                                    </div>
                                </td>
                                <td class="text-center">
                                    <span class="text-base-content/60 text-xs">
                                        {url.nextPingTime ? formatNextPing(url.nextPingTime) : 'N/A'}
                                    </span>
                                </td>
								<td class="relative">
									<button 
										class="btn btn-ghost btn-sm" 
										aria-label="URL actions menu"
										onclick={(e) => toggleDropdown(url.id || '', e)}
										bind:this={dropdownButtons[url.id || '']}
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
												d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
											/>
										</svg>
									</button>
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

                                            <div class="mt-4">
                                                <a href="/urls/{url.id}" class="btn btn-primary btn-sm">
                                                    View Full Details & Activity Logs
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            {/if}
						{/each}
					</tbody>
				</table>
				<!-- Portal Dropdown Menu -->
                {#if activeDropdown && dropdownPositions[activeDropdown]}
                    <Portal>
                        {#snippet children()}
                            {@const currentUrl = paginatedUrls.find(u => u.id === activeDropdown)}
                            <div 
                                class="dropdown-portal menu bg-base-100 rounded-box border-base-content/5 w-52 border p-2 shadow-2xl"
								style="position: fixed; top: {dropdownPositions[activeDropdown!].top}px; left: {dropdownPositions[activeDropdown!].left}px; z-index: 9999;"
                            >
                                {#if currentUrl}
                                    <ul>
                                        <li>
                                            <button onclick={() => { toggleStatus(currentUrl); closeDropdown(); }} disabled={updating[currentUrl.id || '']}>
                                                {#if updating[currentUrl.id || '']}
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                {:else if currentUrl.isEnabled}
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
                                            <a href="/urls/{currentUrl.id}" onclick={closeDropdown}>
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
                                                View Details
                                            </a>
                                        </li>
                                        <li>
                                            <a href="/urls/{currentUrl.id}/edit" onclick={closeDropdown}>
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
                                {/if}
                            </div>
                        {/snippet}
                    </Portal>
                {/if}
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
