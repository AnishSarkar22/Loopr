<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';

    interface Props {
        url: PingURL;
        onUpdate: (url: PingURL) => void;
        onDelete: (urlId: string) => void;
    }

    let { url, onUpdate, onDelete }: Props = $props();

    let showDetails = $state(false);
    let updating = $state(false);

    // Toast states
    // let showToast = $state(false);
    // let toastMessage = $state('');
    // let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

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

    function getStatusColor(status: string) {
        switch (status) {
            case 'success': return 'text-success';
            case 'error': return 'text-error';
            default: return 'text-base-content';
        }
    }

    async function toggleStatus() {
        if (!url.id) return;

        updating = true;
        try {
            const updatedUrl = await urlService.updateURL(url.id, {
                isEnabled: !url.isEnabled
            });
            onUpdate(updatedUrl);
        } catch (error) {
            console.error('Error toggling URL status:', error);
        } finally {
            updating = false;
        }
    }

    // function showAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    //     toastMessage = message;
    //     toastType = type;
    //     showToast = true;
    //     setTimeout(() => {
    //         showToast = false;
    //     }, 3000);
    // }

    // async function handleDelete() {
    //     if (!url.id) return;
        
    //     if (confirm('Are you sure you want to delete this URL? This action cannot be undone.')) {
    //         try {
    //             await urlService.deleteURL(url.id);
    //             onDelete(url.id);
    //         } catch (error) {
    //             showAlert('Failed to delete URL', 'error');
    //         }
    //     }
    // }

    function getUrlDomain(fullUrl: string): string {
        try {
            return new URL(fullUrl).hostname;
        } catch {
            return fullUrl;
        }
    }
</script>

<div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
    <div class="card-body">
        <!-- Header with status indicator -->
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
                <div class="indicator">
                    <span class="indicator-item indicator-start badge badge-xs {url.isEnabled ? 'badge-success' : 'badge-warning'}"></span>
                    <div class="w-3 h-3 rounded-full bg-base-300"></div>
                </div>
                <h3 class="card-title text-lg">
                    {url.name || getUrlDomain(url.url)}
                </h3>
            </div>
            
            <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                </div>
                <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                    <li><a href="/urls/{url.id}/edit">Edit URL</a></li>
                    <li><button onclick={toggleStatus} disabled={updating}>
                        {url.isEnabled ? 'Disable' : 'Enable'}
                    </button></li>
                    <li><button onclick={() => showDetails = !showDetails}>
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button></li>
                    <!-- <li><button onclick={handleDelete} class="text-error">Delete</button></li> -->
                </ul>
            </div>
        </div>

        <!-- URL -->
        <div class="text-sm opacity-70 mb-3">
            <a href={url.url} target="_blank" rel="noopener noreferrer" class="link link-hover">
                {url.url}
            </a>
        </div>

        <!-- Description -->
        {#if url.description}
            <p class="text-sm mb-3">{url.description}</p>
        {/if}

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="stat p-0">
                <div class="stat-title text-xs">Success Count</div>
                <div class="stat-value text-lg text-primary">{url.successCount || 0}</div>
            </div>
            <div class="stat p-0">
                <div class="stat-title text-xs">Last Ping</div>
                <div class="stat-value text-sm {getStatusColor(url.lastPingStatus || '')}">
                    {url.lastPingStatusCode || 'N/A'}
                </div>
                <div class="stat-desc text-xs">{formatTimestamp(url.lastPingTime || '')}</div>
            </div>
        </div>

        <!-- Status -->
        <div class="flex justify-between items-center">
            <div class="badge {url.isEnabled ? 'badge-success' : 'badge-warning'} badge-sm">
                {url.isEnabled ? 'Active' : 'Inactive'}
            </div>
            <div class="text-xs opacity-60">
                Every {url.pingInterval || 15}min
            </div>
        </div>

        <!-- Toggle Button -->
        <div class="card-actions justify-end mt-4">
            <button 
                class="btn btn-sm {url.isEnabled ? 'btn-warning' : 'btn-success'}"
                onclick={toggleStatus}
                disabled={updating}
            >
                {#if updating}
                    <span class="loading loading-spinner loading-xs"></span>
                {/if}
                {url.isEnabled ? 'Stop' : 'Start'}
            </button>
        </div>

        <!-- Detailed View -->
        {#if showDetails}
            <div class="divider my-2"></div>
            <div class="space-y-2" transition:fade>
                <div class="text-xs">
                    <span class="font-semibold">Created:</span> 
                    {formatTimestamp(url.$createdAt || '')}
                </div>
                <div class="text-xs">
                    <span class="font-semibold">Updated:</span> 
                    {formatTimestamp(url.$updatedAt || '')}
                </div>
                {#if url.logs && url.logs.length > 0}
                    <div class="text-xs">
                        <span class="font-semibold">Recent Activity:</span>
                        <div class="max-h-20 overflow-y-auto mt-1 space-y-1">
                            {#each url.logs.slice(0, 3) as log}
                                <div class="text-xs opacity-70">
                                    [{log.timestamp}] {log.message}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>