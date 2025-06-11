<script lang="ts">
    import { account, AppwriteException } from '../appwrite';
    import { PUBLIC_APP_URL } from '$env/static/public';

    let email = $state('');
    let loading = $state(false);
    let isEmailValid = $state(true);
    let showToast = $state(false);
    let toastMessage = $state('');
    let isError = $state(false);

    function validateEmail(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isEmailValid = emailRegex.test(value);
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
        if (!isEmailValid) return;

        loading = true;
        try {
            await account.createRecovery(email, `${PUBLIC_APP_URL}/reset-password`);
            showToast = true;
            toastMessage = 'Password reset email sent! Please check your inbox.';
            isError = false;
        } catch (error) {
            if (error instanceof AppwriteException) {
                showToast = true;
                isError = true;
                switch (error.type) {
                    case 'user_not_found':
                        toastMessage = 'No account found with this email.';
                        break;
                    default:
                        toastMessage = 'Failed to send reset email. Please try again.';
                }
            }
        } finally {
            loading = false;
            setTimeout(() => {
                showToast = false;
            }, 3000);
        }
    }
</script>

<div class="hero-content flex-col">
    <div class="text-center -mt-25">
        <h1 class="text-primary text-5xl font-bold">Forgot Password</h1>
        <p class="py-6">Enter your email address to receive a password reset link.</p>
    </div>

    <div class="card bg-base-200 w-full max-w-sm shadow-xl">
        <form class="card-body flex-col items-center space-y-4" onsubmit={handleSubmit}>
            <!-- Email Input -->
            <div class="form-control w-full mt-2">
                <label
                    class="input input-bordered flex items-center gap-2 w-full"
                    class:input-error={!isEmailValid}
                >
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke-width="2.5"
                            fill="none"
                            stroke="currentColor"
                        >
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </g>
                    </svg>
                    <input
                        type="email"
                        placeholder="Email"
                        class="grow"
                        bind:value={email}
                        oninput={(e) => validateEmail(e.currentTarget.value)}
                        required
                        aria-describedby="email-error"
                    />
                </label>
                {#if !isEmailValid}
                    <div class="label justify-center">
                        <span id="email-error" class="label-text-alt text-error"
                            >Please enter a valid email address</span
                        >
                    </div>
                {/if}
            </div>

            <div class="form-control mt-4 w-full">
                <button class="btn btn-outline w-full" type="submit" disabled={loading || !isEmailValid}>
                    {#if loading}
                        <span class="loading loading-spinner"></span>
                    {/if}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </div>

            <div class="text-center">
                <a href="/login" class="link link-hover text-sm">Back to Log In</a>
            </div>
        </form>
    </div>

    {#if showToast}
        <div class="toast toast-top toast-center z-50">
            <div class="alert {isError ? 'alert-error' : 'alert-success'} shadow-lg">
                {#if isError}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                {/if}
                <span>{toastMessage}</span>
            </div>
        </div>
    {/if}
</div>