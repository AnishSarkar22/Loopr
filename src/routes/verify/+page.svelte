<script lang="ts">
    import { account } from '$lib/appwrite';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let verificationStatus = 'Verifying your email...';
    let isError = false;

    onMount(async () => {
        const userId = $page.url.searchParams.get('userId');
        const secret = $page.url.searchParams.get('secret');

        if (!userId || !secret) {
            verificationStatus = 'Invalid verification link';
            isError = true;
            setTimeout(() => goto('/login'), 3000);
            return;
        }

        try {
            await account.updateVerification(userId, secret);
            verificationStatus = 'Email verified successfully!';
            setTimeout(() => goto('/login?verified=true'), 3000);
        } catch (error) {
            console.error('Verification failed:', error);
            verificationStatus = 'Email verification failed. Please try again.';
            isError = true;
            setTimeout(() => goto('/login?verified=false'), 3000);
        }
    });
</script>

<div class="min-h-screen flex items-center justify-center bg-base-100">
    <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body text-center">
            <h2 class="card-title justify-center mb-4">{verificationStatus}</h2>
            
            {#if !isError}
                <span class="loading loading-spinner loading-lg mx-auto"></span>
            {:else}
                <div class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{verificationStatus}</span>
                </div>
            {/if}
        </div>
    </div>
</div>