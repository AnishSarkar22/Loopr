<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import '../app.css';

	let { children } = $props();

	let theme = $state('light');

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
	}
</script>

<div class="app" data-theme={theme}>
	<Header />

	<main>
		{@render children()}
	</main>

	<footer class="footer sm:footer-horizontal footer-center text-base-content p-4">
		<aside>
			<p>
				Created with ❤️ by Anish Sarkar | <a
					href="https://x.com/AnishSarkar22"
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary">Say hi on Twitter!</a
				>
			</p>
		</aside>
	</footer>
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
