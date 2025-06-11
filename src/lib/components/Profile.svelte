<script lang="ts">
    import { fade } from 'svelte/transition';
    
    let showDeleteConfirm = $state(false);
    let deleteTimeout: number | null = null;
    const DELETE_TIMEOUT = 5000;
    
    function handleDelete() {
        showDeleteConfirm = true;
        if (deleteTimeout) clearTimeout(deleteTimeout);
        
        deleteTimeout = window.setTimeout(() => {
            showDeleteConfirm = false;
        }, DELETE_TIMEOUT);
    }
    
    function confirmDelete() {
        // TODO: Add actual delete logic here
        console.log('Account deleted');
        window.location.href = '/';
    }
    
    function cancelDelete() {
        showDeleteConfirm = false;
        if (deleteTimeout) clearTimeout(deleteTimeout);
    }
</script>

<div class="container mx-auto max-w-3xl px-4 mt-20">
    <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
            <div class="flex flex-col gap-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold">Profile Settings</h2>
                </div>

                <div class="divider my-0"></div>

                <div class="card bg-base-100">
                    <div class="card-body bg-error/5 rounded-box">
                        <h3 class="card-title text-error">Danger Zone</h3>
                        
                        {#if !showDeleteConfirm}
                            <p class="text-sm opacity-70">Once you delete your account, there is no going back. Please be certain.</p>
                            <div class="card-actions justify-end mt-4">
                                <button 
                                    class="btn btn-error btn-outline" 
                                    onclick={handleDelete}
                                >
                                    Delete Account
                                </button>
                            </div>
                        {:else}
                            <div class="alert alert-warning shadow-lg" transition:fade>
                                <div class="flex items-start gap-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    <div class="flex-1">
                                        <h3 class="font-bold">Are you absolutely sure?</h3>
                                        <p class="text-sm">
                                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                        </p>
                                        <div class="mt-4 flex gap-2">
                                            <button 
                                                class="btn btn-error btn-sm" 
                                                onclick={confirmDelete}
                                            >
                                                Yes, Delete My Account
                                            </button>
                                            <button 
                                                class="btn btn-ghost btn-sm" 
                                                onclick={cancelDelete}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>