<script lang="ts">
    import { account, AppwriteException } from '../appwrite';
    import { goto } from '$app/navigation';
    
    let { userId, secret }: { userId: string; secret: string } = $props();
    let password = $state('');
    let confirmPassword = $state('');
    let loading = $state(false);
    let showToast = $state(false);
    let toastMessage = $state('');
    let isError = $state(false);
    let isPasswordValid = $state(true);
    let doPasswordsMatch = $state(true);

    function validatePassword(value: string) {
        const passwordRegex = /^[a-zA-Z0-9]{8,}$/;
        isPasswordValid = passwordRegex.test(value);
        if (confirmPassword) {
            doPasswordsMatch = password === confirmPassword;
        }
    }

    function validateConfirmPassword(value: string) {
        doPasswordsMatch = password === value;
    }

    function showAlert(message: string, error = false) {
        toastMessage = message;
        isError = error;
        showToast = true;
        setTimeout(() => {
            showToast = false;
        }, 3000);
    }

    async function handleSubmit() {
        if (!isPasswordValid || !doPasswordsMatch) return;

        loading = true;
        try {
            await account.updateRecovery(userId, secret, password);
            showAlert('Password reset successful!');
            setTimeout(() => {
                goto('/login');
            }, 2000);
        } catch (error) {
            if (error instanceof AppwriteException) {
                switch (error.type) {
                    case 'invalid_credentials':
                        showAlert('Invalid or expired reset link.', true);
                        break;
                    default:
                        showAlert('Failed to reset password. Please try again.', true);
                }
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="hero-content flex-col">
    <div class="text-center -mt-25">
        <h1 class="text-primary text-5xl font-bold">Reset Password</h1>
        <p class="py-6">Enter your new password below.</p>
    </div>

    <div class="card bg-base-200 w-full max-w-sm shadow-xl">
        <form class="card-body flex-col items-center space-y-4" onsubmit={handleSubmit}>
            <!-- Password Input -->
            <div class="form-control w-full">
                <label class="input input-bordered flex items-center gap-2 w-full" class:input-error={!isPasswordValid}>
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke-width="2.5"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                            ></path>
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input
                        type="password"
                        placeholder="New Password"
                        class="grow"
                        bind:value={password}
                        oninput={(e) => validatePassword(e.currentTarget.value)}
                        required
                        minlength="8"
                    />
                </label>
                {#if !isPasswordValid}
                    <div class="label justify-center">
                        <span class="label-text-alt text-error">
                            Password must be at least 8 characters
                        </span>
                    </div>
                {/if}
            </div>

            <!-- Confirm Password Input -->
            <div class="form-control w-full">
                <label class="input input-bordered flex items-center gap-2 w-full" class:input-error={!doPasswordsMatch}>
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke-width="2.5"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                            ></path>
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        class="grow"
                        bind:value={confirmPassword}
                        oninput={(e) => validateConfirmPassword(e.currentTarget.value)}
                        required
                    />
                </label>
                {#if !doPasswordsMatch}
                    <div class="label justify-center">
                        <span class="label-text-alt text-error">Passwords do not match</span>
                    </div>
                {/if}
            </div>

            <!-- Reset Password button -->
            <div class="form-control w-full">
                <button 
                    class="btn btn-outline w-full" 
                    type="submit"
                    disabled={loading || !isPasswordValid || !doPasswordsMatch}
                >
                    {#if loading}
                        <span class="loading loading-spinner"></span>
                    {/if}
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
        </form>
    </div>

    {#if showToast}
        <div class="toast toast-top toast-center z-50">
            <div class="alert {isError ? 'alert-error' : 'alert-success'} shadow-lg">
                {#if isError}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                {/if}
                <span>{toastMessage}</span>
            </div>
        </div>
    {/if}
</div>