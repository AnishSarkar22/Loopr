<script lang="ts">
	import { page } from '$app/stores';
	import { account } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Notifications from '$lib/components/shared/Notifications.svelte';

	let isAuthenticated = $state(false);
	let userName = $state('');
	let userInitials = $state('');
	let showToast = $state(false);
	let toastMessage = $state('');
	let isError = $state(false);
	let loading = $state(true);

	function getInitials(name: string): string {
		if (!name) return '';
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0][0].toUpperCase();
		// Take first letter of first two words only
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}

	onMount(async () => {
		try {
			const user = await account.get();
			userName = user.name ?? '';
			userInitials = getInitials(userName);
			isAuthenticated = true;
		} catch (error) {
			userName = '';
			userInitials = '';
			isAuthenticated = false;
		} finally {
			loading = false;
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
	class="navbar bg-base-100/80 supports-[backdrop-filter]:bg-base-100/20 fixed top-0 z-50 backdrop-blur-md"
>
	<div class="navbar-start">
		<a class="btn btn-ghost p-2" href="/dashboard" aria-label="Loopr Home">
			<img src="/images/loopr.svg" alt="Loopr Logo" class="h-30 w-30" />
		</a>
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>Dashboard</a></li>
			<li>
				<a href="/webhooks" class:active={$page.url.pathname === '/webhooks'}>Webhooks</a>
			</li>
			<li>
				<a href="/statistics" class:active={$page.url.pathname === '/statistics'}>Statistics</a>
			</li>
		</ul>
	</div>

	<div class="navbar-end">
		<!-- <a
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
		</a> -->

		<Notifications />

		{#if loading}
			<div class="skeleton h-10 w-10 rounded-full"></div>
		{:else if isAuthenticated}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
					<div class="avatar avatar-placeholder">
						<div class="bg-accent text-neutral-content w-8 rounded-full">
							<span>{userInitials}</span>
						</div>
					</div>
				</div>

				<ul
					class="menu menu-sm dropdown-content bg-base-100 rounded-box border-base-content/5 z-[1] mt-3 w-52 border p-2 shadow-2xl"
				>
					<li>
						<a href="/dashboard" class="flex items-center gap-2 pl-2 lg:hidden">
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
									d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 14a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM13 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM13 14a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
								/>
							</svg>
							Dashboard
						</a>
					</li>
					<li>
						<a href="/webhooks" class="flex items-center gap-2 pl-2 lg:hidden">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<g
									fill="none"
									stroke="currentColor"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								>
									<path
										d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"
									/>
									<path d="m6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
									<path d="m12 6l3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
								</g>
							</svg>
							Webhooks
						</a>
					</li>
					<li>
						<a href="/statistics" class="flex items-center gap-2 pl-2 lg:hidden">
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
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							Statistics
						</a>
					</li>
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
