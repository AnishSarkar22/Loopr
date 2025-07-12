<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { onMount } from 'svelte';
    import { account } from '$lib/appwrite';
	import HomepageLayout from '$lib/components/layout/HomepageLayout.svelte';
	import '../app.css';
	import { page } from '$app/stores';
	import { user, isAuthenticated } from '$lib/stores/auth';

	onMount(async () => {
        try {
            const session = await account.get();
            user.set({
                id: session.$id,
                name: session.name,
                email: session.email
            });
            isAuthenticated.set(true);
        } catch {
            user.set(null);
            isAuthenticated.set(false);
        }
    });

	let { children } = $props();

	let theme = $state('luxury');

	function toggleTheme() {
		theme = theme === 'luxury' ? 'light' : 'luxury';
	}

	// Check if we're on the homepage
	let isHomepage = $derived($page?.url?.pathname === '/');

	// Show footer for authenticated pages
	let showFooter = $derived(
		$page?.url?.pathname === '/dashboard' ||
		$page?.url?.pathname === '/statistics' ||
		$page?.url?.pathname === '/profile' ||
		$page?.url?.pathname?.startsWith('/urls/')
	);

	// Show header for authenticated pages
    let showHeader = $derived(
		$page?.url?.pathname === '/dashboard' ||
        $page?.url?.pathname?.startsWith('/urls/') ||
		$page?.url?.pathname === '/statistics' ||
        $page?.url?.pathname === '/profile'
    );
</script>

<div class="app" data-theme={theme}>
	{#if isHomepage}
		<HomepageLayout>
			{@render children?.()}
		</HomepageLayout>
	{:else if showHeader}
        <Header />
        <div class="pt-16">
            <main>
                {@render children?.()}
            </main>
        </div>
    {:else}
        <main>
            {@render children?.()}
        </main>
    {/if}

    {#if showFooter}
        <Footer />
    {/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
