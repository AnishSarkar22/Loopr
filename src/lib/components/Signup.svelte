<script lang="ts">
    let email = '';
    let password = '';
    let confirmPassword = '';
    let loading = false;
    let isPasswordValid = true;
    let isEmailValid = true;
    let doPasswordsMatch = true;

    function validateEmail(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isEmailValid = emailRegex.test(value);
    }

    function validatePassword(value: string) {
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        isPasswordValid = passwordRegex.test(value);
        if (confirmPassword) {
            doPasswordsMatch = password === confirmPassword;
        }
    }

    function validateConfirmPassword(value: string) {
        doPasswordsMatch = password === value;
    }

    async function handleSubmit() {
        if (!isEmailValid || !isPasswordValid || !doPasswordsMatch) {
            return;
        }
        loading = true;
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Redirect to home page after successful signup
            window.location.href = '/';
        } catch (error) {
            console.error('Signup failed:', error);
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
            <form class="card-body mt-6 space-y-4 px-10 py-6" on:submit|preventDefault={handleSubmit}>
                <label class="input validator w-full" class:input-error={!isEmailValid}>
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </g>
                    </svg>
                    <input
                        type="email"
                        placeholder="john@example.com"
                        required
                        bind:value={email}
                        on:input={(e) => validateEmail(e.currentTarget.value)}
                    />
                </label>
                <div class="validator-hint text-error text-sm" class:hidden={isEmailValid}>
                    Enter valid email address
                </div>

                <label class="input validator" class:input-error={!isPasswordValid}>
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input
                        type="password"
                        required
                        placeholder="Password"
                        minlength="8"
                        bind:value={password}
                        on:input={(e) => validatePassword(e.currentTarget.value)}
                    />
                </label>
                <div class="validator-hint text-error text-sm" class:hidden={isPasswordValid}>
                    Password must contain at least:
                    <br />- 8 characters
                    <br />- One number
                    <br />- One lowercase letter
                    <br />- One uppercase letter
                </div>

                <label class="input validator" class:input-error={!doPasswordsMatch}>
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input
                        type="password"
                        required
                        placeholder="Confirm Password"
                        minlength="8"
                        bind:value={confirmPassword}
                        on:input={(e) => validateConfirmPassword(e.currentTarget.value)}
                    />
                </label>
                <div class="validator-hint text-error text-sm" class:hidden={doPasswordsMatch}>
                    Passwords do not match
                </div>

                <div class="form-control mt-6 w-full">
                    <button class="btn btn-primary w-full" class:loading type="submit">
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </div>
                <div class="mt-4 text-center">
                    <a href="/login" class="link link-hover text-sm">Already have an account? Login</a>
                </div>
            </form>
        </div>
    </div>
</div>