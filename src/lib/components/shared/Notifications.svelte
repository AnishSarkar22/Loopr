<script lang="ts">
    import { onMount } from 'svelte';
    import { databases, ID, AppwriteException } from '$lib/appwrite';
    import { Query } from 'appwrite';
    import { PUBLIC_APP_URL } from '$env/static/public';

    let notifications = $state<any[]>([]);
    let loading = $state(true);
    let error = $state('');
    let unreadCount = $derived(notifications.filter(n => !n.read).length);
    let open = $state(false);

    function handleClickOutside(event: MouseEvent) {
        if (!(event.target as HTMLElement).closest('.dropdown')) {
            open = false;
        }
    }

    onMount(() => {
        window.addEventListener('click', handleClickOutside);
        (async () => {
            loading = true;
            try {
                const response = await databases.listDocuments(
                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                    [Query.orderDesc('timestamp'), Query.limit(50)]
                );
                notifications = response.documents;
            } catch (e) {
                error = e instanceof AppwriteException ? e.message : String(e);
            } finally {
                loading = false;
            }
        })();
        return () => window.removeEventListener('click', handleClickOutside);
    });

    async function markAsRead(notificationId: string) {
        try {
            const res = await fetch(`${PUBLIC_APP_URL}/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (res.ok) {
                notifications = notifications.map(n =>
                    n.$id === notificationId ? { ...n, read: true } : n
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }
</script>

<div class="dropdown dropdown-end" class:dropdown-open={open}>
    <button
        tabindex="0"
        class="btn btn-ghost btn-circle"
        onclick={e => { e.stopPropagation(); open = !open; }}
        aria-label="Open notifications"
    >
        <div class="indicator">
            <!-- bell icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {#if unreadCount > 0}
                <span class="badge badge-xs badge-primary indicator-item">{unreadCount}</span>
            {/if}
        </div>
    </button>
    <div class="dropdown-content z-[1] card card-compact w-80 p-2 shadow bg-base-100">
        <div class="card-body">
            <span class="text-lg font-bold">Notifications</span>
            {#if loading}
                <div class="flex justify-center py-4">
                    <span class="loading loading-spinner loading-sm"></span>
                </div>
            {:else if error}
                <p class="text-error text-sm">{error}</p>
            {:else if notifications.length === 0}
                <p class="text-base-content/70 text-sm">No notifications yet.</p>
            {:else}
                {#if notifications.some(n => !n.read)}
                    <button
                        class="btn btn-xs btn-primary mb-2"
                        onclick={async () => {
                            // Get all unread notification IDs
                            const unread = notifications.filter(n => !n.read);
                            // Update each notification in Appwrite
                            await Promise.all(unread.map(async n => {
                                try {
                                    await databases.updateDocument(
                                        import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                        import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                                        n.$id,
                                        { read: true }
                                    );
                                } catch (e) {
                                    // Optionally handle error for each notification
                                }
                            }));
                            // Update UI state
                            notifications = notifications.map(n => ({ ...n, read: true }));
                        }}
                    >
                        Mark all as read
                    </button>
                {/if}
                <div class="max-h-80 overflow-y-auto space-y-2">
                    {#each notifications as notification}
                        <button
                            type="button"
                            class="alert alert-sm cursor-pointer transition-colors text-left w-full"
                            class:alert-info={!notification.read}
                            class:bg-base-200={notification.read}
                            aria-pressed={notification.read}
                            onclick={() => markAsRead(notification.$id)}
                        >
                            <div class="flex-1">
                                <h4 class="font-semibold text-sm">{notification.type}</h4>
                                <p class="text-xs">{notification.message}</p>
                                <p class="text-xs opacity-60">
                                    {new Date(notification.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>