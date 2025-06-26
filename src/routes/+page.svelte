<script lang="ts">
    import URLManager from '$lib/components/url/URLManager.svelte';
</script>

<svelte:head>
    <title>Loopr – Effortless Cron Job Scheduling</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
    <header class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-primary mb-2">Welcome to Loopr</h1>
        <p class="text-base-content/70">Keep your apps alive with automated pinging</p>
    </header>

    <URLManager />
</div>