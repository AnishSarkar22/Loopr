<script lang="ts">
    import NotFound from '$lib/components/layout/NotFound.svelte';
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>{$page.status} - Loopr</title>
</svelte:head>

<NotFound />