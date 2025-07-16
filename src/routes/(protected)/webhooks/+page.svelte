<script lang="ts">
    import WebhookList from '$lib/components/webhooks/WebhookList.svelte';
</script>

<svelte:head>
    <title>Webhooks - Loopr</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
    <header class="mb-12 text-center">
        <h1 class="text-3xl font-bold text-primary mb-2 mt-8">Scheduled Webhooks</h1>
        <p class="text-base-content/70">Manage and monitor your scheduled webhook deliveries</p>
    </header>

    <WebhookList />
</div>