<script lang="ts">
    import { account, ID, AppwriteException } from '../../appwrite';
    import { PUBLIC_APP_URL } from '$env/static/public';

    let email = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let loading = $state(false);
    let isPasswordValid = $state(true);
    let isEmailValid = $state(true);
    let doPasswordsMatch = $state(true);
    let showToast = $state(false);
    let toastMessage = $state('');
    let isError = $state(false);
    
    // Track if fields have been interacted with
    let emailTouched = $state(false);
    let passwordTouched = $state(false);
    let confirmPasswordTouched = $state(false);

    function showAlert(message: string, error = false) {
        toastMessage = message;
        isError = error;
        showToast = true;
        setTimeout(() => {
            showToast = false;
        }, 3000);
    }

    function validateEmail(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isEmailValid = value === '' || emailRegex.test(value);
    }

    function validatePassword(value: string) {
        const passwordRegex = /^[a-zA-Z0-9]{8,}$/;
        isPasswordValid = value === '' || passwordRegex.test(value);
        // Also revalidate confirm password when password changes
        if (confirmPassword && confirmPasswordTouched) {
            doPasswordsMatch = password === confirmPassword;
        }
    }

    function validateConfirmPassword(value: string) {
        doPasswordsMatch = value === '' || password === value;
    }

    // Handle input events with real-time validation
    function handleEmailInput(e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        email = target.value;
        emailTouched = true;
        validateEmail(email);
    }

    function handlePasswordInput(e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        password = target.value;
        passwordTouched = true;
        validatePassword(password);
    }

    function handleConfirmPasswordInput(e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        confirmPassword = target.value;
        confirmPasswordTouched = true;
        validateConfirmPassword(confirmPassword);
    }

    // Computed values for showing validation errors
    const showEmailError = $derived(emailTouched && email !== '' && !isEmailValid);
    const showPasswordError = $derived(passwordTouched && password !== '' && !isPasswordValid);
    const showConfirmPasswordError = $derived(confirmPasswordTouched && confirmPassword !== '' && !doPasswordsMatch);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        
        // Mark all fields as touched on submit
        emailTouched = true;
        passwordTouched = true;
        confirmPasswordTouched = true;
        
        // Validate all fields
        validateEmail(email);
        validatePassword(password);
        validateConfirmPassword(confirmPassword);

        if (!isEmailValid || !isPasswordValid || !doPasswordsMatch || !email || !password || !confirmPassword) {
            return;
        }
        
        loading = true;
        try {
            // Create user account using Appwrite
            await account.create(ID.unique(), email, password);

            try {
                // Create email session
                await account.createEmailPasswordSession(email, password);
                // Create email verification
                const verificationUrl = `${PUBLIC_APP_URL}/verify`;
                await account.createVerification(verificationUrl);

                // Redirect to email verification page with email in query params
                window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
            } catch (sessionError) {
                console.error('Session creation failed:', sessionError);
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Signup failed:', error);

            if (error instanceof AppwriteException) {
                switch (error.type) {
                    case 'user_already_exists':
                        showAlert('Email already exists', true);
                        break;
                    case 'general_argument_invalid':
                        showAlert('Please check your email and password', true);
                        break;
                    default:
                        showAlert(`Failed to create account: ${error.message}`, true);
                }
            } else {
                showAlert('An unexpected error occurred', true);
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="hero w-full py-35">
    <div class="hero-content flex-col">
        <div class="text-center">
            <h1 class="text-primary text-5xl font-bold">Sign Up</h1>
            <p class="py-6">Create an account to get started!</p>
        </div>
        <div class="card bg-base-200 w-full shadow-lg md:w-[400px]">
            <form class="card-body mt-6 px-10 py-6" onsubmit={handleSubmit}>
                <div class="space-y-4">
                    <div>
                        <label class="input validator w-full" class:input-error={showEmailError}>
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
                                placeholder="john@example.com"
                                required
                                bind:value={email}
                                oninput={handleEmailInput}
                            />
                        </label>
                        <div class="validator-hint text-error text-sm mt-1" class:hidden={!showEmailError}>
                            Enter valid email address
                        </div>
                    </div>

                    <div>
                        <label class="input validator" class:input-error={showPasswordError}>
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
                                required
                                placeholder="Password"
                                minlength="8"
                                bind:value={password}
                                oninput={handlePasswordInput}
                            />
                        </label>
                        <div class="validator-hint text-error text-sm mt-1" class:hidden={!showPasswordError}>
                            Password must:<br />- Be at least 8 characters long<br />- Contain only letters and numbers
                        </div>
                    </div>

                    <div>
                        <label class="input validator" class:input-error={showConfirmPasswordError}>
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
                                required
                                placeholder="Confirm Password"
                                minlength="8"
                                bind:value={confirmPassword}
                                oninput={handleConfirmPasswordInput}
                            />
                        </label>
                        <div class="validator-hint text-error text-sm mt-1" class:hidden={!showConfirmPasswordError}>
                            Passwords do not match
                        </div>
                    </div>
                </div>

                <div class="form-control mt-6">
                    <button
                        class="btn btn-primary w-full"
                        type="submit"
                        disabled={loading || !isEmailValid || !isPasswordValid || !doPasswordsMatch || !email || !password || !confirmPassword}
                    >
                        {#if loading}
                            <span class="loading loading-spinner"></span>
                        {/if}
                        {loading ? '' : 'Sign Up'}
                    </button>
                </div>
                <div class="mt-4 text-center">
                    <a href="/login" class="link link-hover text-sm">Already have an account? Log In</a>
                </div>
            </form>
        </div>
    </div>
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