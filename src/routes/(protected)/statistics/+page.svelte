<script lang="ts">
    import Statistics from '$lib/components/Statistics.svelte';
</script>

<svelte:head>
    <title>Statistics - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
    <header class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-primary mb-2 mt-8">Statistics</h1>
        <p class="text-base-content/70">Monitor and analyze your URL performance and activity logs</p>
    </header>

    <Statistics />
</div>