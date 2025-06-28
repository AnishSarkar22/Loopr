<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();

	let theme = $state('luxury');

	function toggleTheme() {
		theme = theme === 'luxury' ? 'light' : 'luxury';
	}

	// Show footer only on dashboard (home) page
	let showFooter = $derived($page?.url?.pathname === '/');
	let isDashboard = $derived($page?.url?.pathname === '/');

	// Show header on authenticated pages
    let showHeader = $derived(
        $page?.url?.pathname === '/' || 
		$page?.url?.pathname === '/dashboard' ||
        $page?.url?.pathname?.startsWith('/urls/') ||
		$page?.url?.pathname === '/statistics' ||
        $page?.url?.pathname === '/profile'
    );
</script>

<div class="app" data-theme={theme}>
	{#if showHeader}
        <Header />
        <div class="pt-16"> <!-- Add padding for fixed header -->
            <main>
                {@render children()}
            </main>
        </div>
    {:else}
        <main>
            {@render children()}
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
