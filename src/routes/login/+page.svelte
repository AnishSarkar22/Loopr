<script lang="ts">
    import Login from '$lib/components/Login.svelte';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let showVerificationAlert = false;
    let verificationSuccess = false;

    onMount(() => {
        const verified = $page.url.searchParams.get('verified');
        if (verified) {
            showVerificationAlert = true;
            verificationSuccess = verified === 'true';

            setTimeout(() => {
                showVerificationAlert = false;
            }, 5000);
        }
    });
</script>

<svelte:head>
    <title>Login - Loopr</title>
</svelte:head>

{#if showVerificationAlert}
    <div class="toast toast-top toast-center z-50">
        <div class="alert {verificationSuccess ? 'alert-success' : 'alert-error'} shadow-lg">
            {#if verificationSuccess}
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Email verified successfully! Please login.</span>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Email verification failed. Please try again.</span>
            {/if}
        </div>
    </div>
{/if}

<Login />