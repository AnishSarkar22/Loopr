<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { onMount } from 'svelte';
	import { account } from '$lib/appwrite';

	let firstName: string = '';

	onMount(async () => {
		try {
			const user = await account.get();
			// Split the name by space and take the first part
			firstName = user.name?.split(' ')[0] ?? '';
		} catch (error) {
			// Handle error (e.g., user not logged in)
			firstName = '';
		}
	});
</script>

<svelte:head>
	<title>Loopr – Effortless Cron Job Scheduling</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<header class="mb-12 text-center">
		<h1 class="text-primary py-8 text-3xl font-bold">
			{#if firstName}
				Welcome back, {firstName} 👋
			{:else}
				Welcome back 👋
			{/if}
		</h1>
		<!-- <p class="text-base-content/70">All your services at a glance</p> -->
	</header>

	<Dashboard />
</div>
