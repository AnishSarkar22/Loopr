<script lang="ts">
    import { onMount } from 'svelte';
    import { databases, ID, AppwriteException } from '$lib/appwrite';
    import { Query } from 'appwrite';
    import { PUBLIC_APP_URL } from '$env/static/public';
    import { user, isAuthenticated } from '$lib/stores/auth'; // <-- import your stores

    let notifications = $state<any[]>([]);
    let loading = $state(true);
    let error = $state('');
    let unreadCount = $derived(notifications.filter(n => !n.read).length);
    let open = $state(false);

    // Access store values using $state and subscribe to changes
    let currentUser = $state<any>(null);
    let loggedIn = $state(false);

    function handleClickOutside(event: MouseEvent) {
        if (!(event.target as HTMLElement).closest('.dropdown')) {
            open = false;
        }
    }

    // Load notifications when authentication state changes
    $effect(() => {
        async function loadNotifications() {
            if (loggedIn && currentUser?.id) {
                loading = true;
                try {
                    const response = await databases.listDocuments(
                        import.meta.env.VITE_APPWRITE_DATABASE_ID,
                        import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                        [
                            Query.equal('userId', currentUser.id),
                            Query.orderDesc('timestamp'), 
                            Query.limit(50)
                        ]
                    );
                    notifications = response.documents;
                } catch (e) {
                    error = e instanceof AppwriteException ? e.message : String(e);
                } finally {
                    loading = false;
                }
            } else {
                loading = false;
                notifications = [];
                error = '';
            }
        }
        loadNotifications();
    });

    onMount(() => {
        // Subscribe to store changes
        const unsubscribeUser = user.subscribe(value => {
            currentUser = value;
        });

        const unsubscribeAuth = isAuthenticated.subscribe(value => {
            loggedIn = value;
        });

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
            unsubscribeUser();
            unsubscribeAuth();
        };
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
    {#if loggedIn}
    <div class="dropdown-content z-[1] card card-compact w-80 p-0 shadow-lg bg-base-100 border border-base-200">
        <div class="card-body p-0">
            <div class="px-4 pt-4 pb-2 flex items-center justify-between">
                <span class="text-lg font-bold text-base-content">Notifications</span>
                {#if notifications.some(n => !n.read) && !loading && !error && notifications.length > 0}
                    <button
                        class="btn btn-xs btn-primary"
                        onclick={async () => {
                            const unread = notifications.filter(n => !n.read);
                            await Promise.all(unread.map(async n => {
                                try {
                                    await databases.updateDocument(
                                        import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                        import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                                        n.$id,
                                        { read: true }
                                    );
                                } catch (e) {}
                            }));
                            notifications = notifications.map(n => ({ ...n, read: true }));
                        }}
                    >
                        Mark all as read
                    </button>
                {/if}
            </div>
            <div class="divider my-0"></div>
            {#if loading}
                <div class="flex justify-center py-8">
                    <span class="loading loading-spinner loading-sm"></span>
                </div>
            {:else if error}
                <p class="text-error text-sm px-4 py-6">{error}</p>
            {:else if notifications.length === 0}
                <p class="text-base-content/70 text-sm px-4 py-6">No notifications yet.</p>
            {:else}
                <div class="max-h-80 overflow-y-auto space-y-2 px-2 py-2">
                    {#each notifications as notification}
                        <button
                            type="button"
                            class="alert alert-sm w-full text-left flex items-start gap-2 transition-colors cursor-pointer
                                {notification.read ? 'bg-base-200/70' : 'alert-info border-l-4 border-primary/80'}"
                            aria-pressed={notification.read}
                            onclick={() => markAsRead(notification.$id)}
                        >
                            <div class="flex-1">
                                <h4 class="font-semibold text-sm text-base-content">{notification.type}</h4>
                                <p class="text-xs text-base-content/70">{notification.message}</p>
                                <p class="text-xs opacity-60 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                </p>
                            </div>
                            {#if !notification.read}
                                <span class="badge badge-xs badge-primary mt-1">New</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    {:else}
        <div class="dropdown-content z-[1] card card-compact w-80 p-0 shadow-lg bg-base-100 border border-base-200">
            <div class="card-body p-0 flex items-center justify-center min-h-[100px]">
                <span class="text-base-content/70 text-sm">Please log in to see notifications.</span>
            </div>
        </div>
    {/if}
</div>