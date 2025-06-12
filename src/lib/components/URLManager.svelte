<script lang="ts">
    import { fade, slide } from 'svelte/transition';
    import { onMount } from 'svelte';
    import type { PingURL } from '$lib/types';
    import { urlService } from '$lib/services/urlService';
    import { account } from '$lib/appwrite';
    import URLCard from './URLCard.svelte';
    import AddURLForm from './AddURLForm.svelte';

    let urls = $state<PingURL[]>([]);
    let isAuthenticated = $state(false);
    let userId = $state<string | null>(null);
    let loading = $state(true);
    let showAddForm = $state(false);
    let showToast = $state(false);
    let toastMessage = $state('');
    let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

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
        const index = urls.findIndex(url => url.id === updatedUrl.id);
        if (index !== -1) {
            urls[index] = updatedUrl;
        }
        showToastNotification('URL updated successfully', 'success');
    }

    async function handleURLDeleted(deletedUrlId: string) {
        urls = urls.filter(url => url.id !== deletedUrlId);
        showToastNotification('URL deleted successfully', 'success');
    }

    function handleRefreshAll() {
        loadURLs();
        showToastNotification('Refreshing all URLs...', 'info');
    }
</script>

{#if !isAuthenticated}
    <div class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="text-center">
            <h2 class="text-2xl font-bold mb-4">Authentication Required</h2>
            <p class="text-base-content/70 mb-6">Please log in to manage your URLs</p>
            <a href="/login" class="btn btn-primary">Login</a>
        </div>
    </div>
{:else if loading}
    <div class="flex justify-center items-center min-h-[400px]">
        <span class="loading loading-spinner loading-lg"></span>
    </div>
{:else}
    <!-- Header Actions -->
    <div class="flex justify-between items-center mb-6">
        <div class="stats stats-horizontal shadow">
            <div class="stat">
                <div class="stat-title">Total URLs</div>
                <div class="stat-value text-primary">{urls.length}</div>
            </div>
            <div class="stat">
                <div class="stat-title">Active</div>
                <div class="stat-value text-success">{urls.filter(url => url.isEnabled).length}</div>
            </div>
            <div class="stat">
                <div class="stat-title">Inactive</div>
                <div class="stat-value text-warning">{urls.filter(url => !url.isEnabled).length}</div>
            </div>
        </div>

        <div class="flex gap-2">
            <button class="btn btn-outline" onclick={handleRefreshAll}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh All
            </button>
            <button class="btn btn-primary" onclick={() => showAddForm = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add URL
            </button>
        </div>
    </div>

    <!-- Add URL Form Modal -->
    {#if showAddForm}
        <div class="modal modal-open" transition:fade>
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">Add New URL</h3>
                <AddURLForm 
                    {userId}
                    onSuccess={handleURLAdded}
                    onCancel={() => showAddForm = false}
                />
            </div>
            <div class="modal-backdrop" role="button" tabindex="0" onclick={() => showAddForm = false} onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? showAddForm = false : null}></div>
        </div>
    {/if}

    <!-- URLs Grid -->
    {#if urls.length === 0}
        <div class="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-base-300 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 class="text-xl font-semibold mb-2">No URLs yet</h3>
            <p class="text-base-content/60 mb-4">Add your first URL to start monitoring</p>
            <button class="btn btn-primary" onclick={() => showAddForm = true}>
                Add Your First URL
            </button>
        </div>
    {:else}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each urls as url (url.id)}
                <URLCard 
                    {url}
                    onUpdate={handleURLUpdated}
                    onDelete={handleURLDeleted}
                />
            {/each}
        </div>
    {/if}

    <!-- Toast Notifications -->
    {#if showToast}
        <div class="toast toast-top toast-center z-50" transition:fade>
            <div class="alert alert-{toastType} shadow-lg">
                <span>{toastMessage}</span>
            </div>
        </div>
    {/if}
{/if}