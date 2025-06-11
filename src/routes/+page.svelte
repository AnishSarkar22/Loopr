<script lang="ts">
    import Dashboard from '$lib/components/Dashboard.svelte';
</script>

<svelte:head>
    <title>Loopr – Effortless Cron Job Scheduling</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-17">
    <header class="mb-8 text-center">
        <h1 class="text-primary text-3xl font-bold">Loopr</h1>
        <div class="text-base-content/70 mt-2">
            Keep your app alive by pinging it every 10-15 minutes
        </div>
    </header>

    <Dashboard />
</div>
