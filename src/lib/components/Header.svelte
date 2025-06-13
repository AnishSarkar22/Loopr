<script lang="ts">
    import { page } from '$app/stores';
    import { account } from '../appwrite';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isAuthenticated = $state(false);
    let userInitials = $state('');
    let showToast = $state(false);
    let toastMessage = $state('');
    let isError = $state(false);

    onMount(async () => {
        try {
            const user = await account.get();
            isAuthenticated = true;

            // Get initials from email with null checking
            if (user && user.email) {
                userInitials =
                    user.email
                        .split('@')[0]
                        .match(/(\b\S)?/g)
                        ?.join('') // Optional chaining for match result
                        .toUpperCase() || ''; // Fallback if match returns null
            } else {
                userInitials = 'U'; // Default fallback if no email
            }
        } catch {
            isAuthenticated = false;
            userInitials = '';
        }
    });

    function showAlert(message: string, error = false) {
        toastMessage = message;
        isError = error;
        showToast = true;
        setTimeout(() => {
            showToast = false;
        }, 3000);
    }

    async function handleLogout() {
        try {
            // Delete the current session
            await account.deleteSession('current');
            showAlert('Successfully logged out!');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            showAlert('Failed to logout. Please try again.', true);
        }
    }
</script>

<div
    class="navbar bg-base-100/80 border-base-200/50 supports-[backdrop-filter]:bg-base-100/50 fixed top-0 z-50 backdrop-blur-md"
>
    <div class="navbar-start">
        <a href="/" class="btn btn-ghost text-primary text-xl">Loopr</a>
    </div>

    <div class="navbar-center hidden lg:flex">
        {#if isAuthenticated}
            <ul class="menu menu-horizontal px-1">
                <li><a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a></li>
                <li><a href="/statistics" class:active={$page.url.pathname === '/statistics'}>Statistics</a></li>
            </ul>
        {/if}
    </div>

    <div class="navbar-end">
        <a
            href="https://github.com/AnishSarkar22/Loopr"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost btn-circle"
            aria-label="View project on GitHub"
        >
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                />
            </svg>
        </a>

        {#if isAuthenticated}
            <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
                    <div class="avatar avatar-placeholder">
                        <div class="bg-accent text-neutral-content w-8 rounded-full">
                            <span>{userInitials}</span>
                        </div>
                    </div>
                </div>
                <ul
                    class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                >
                    <li>
                        <a href="/profile" class="flex items-center gap-2 pl-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Profile
                        </a>
                    </li>
                    <li>
                        <button
                            onclick={handleLogout}
                            class="text-error hover:text-error hover:bg-error/20 w-full text-left"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        {:else}
            <a href="/login" class="btn btn-primary mx-2">Log In</a>
        {/if}
    </div>
</div>

{#if showToast}
    <div class="toast toast-top toast-center z-50">
        <div class="alert {isError ? 'alert-error' : 'alert-success'} shadow-lg">
            {#if isError}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            {/if}
            <span>{toastMessage}</span>
        </div>
    </div>
{/if}