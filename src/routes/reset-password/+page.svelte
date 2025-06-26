<script lang="ts">
    import { page } from '$app/stores';
    import ResetPassword from '$lib/components/auth/ResetPassword.svelte';
    
    const userId = $page.url.searchParams.get('userId') || '';
    const secret = $page.url.searchParams.get('secret') || '';
</script>

<svelte:head>
    <title>Reset Password - Loopr</title>
</svelte:head>

<div class="hero min-h-screen bg-base-100">
    <ResetPassword {userId} {secret} />
</div>