<script lang="ts">
    import URLManager from '$lib/components/URLManager.svelte';
</script>

<svelte:head>
    <title>Manage URLs - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
    <header class="mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">Manage URLs</h1>
        <p class="text-base-content/70">Add, monitor, and manage all your cron job URLs in one place</p>
    </header>

    <URLManager />
</div>