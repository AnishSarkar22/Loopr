<script lang="ts">
	import { account, AppwriteException } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { isAuthenticated, user } from '$lib/stores/auth';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let isPasswordValid = $state(true);
	let isEmailValid = $state(true);
	let showToast = $state(false);
	let toastMessage = $state('');
	let isError = $state(false);
	
	// Track if fields have been interacted with
	let emailTouched = $state(false);
	let passwordTouched = $state(false);

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
		isPasswordValid = value === '' || value.length >= 8;
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

	// Computed values for showing validation errors
	const showEmailError = $derived(emailTouched && email !== '' && !isEmailValid);
	const showPasswordError = $derived(passwordTouched && password !== '' && !isPasswordValid);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Mark all fields as touched on submit
		emailTouched = true;
		passwordTouched = true;
		
		// Validate all fields
		validateEmail(email);
		validatePassword(password);

		if (!isEmailValid || !isPasswordValid || !email || !password) {
			return;
		}
		
		loading = true;

		try {
			// Delete any existing sessions first
			try {
				await account.deleteSession('current');
			} catch (e) {
				// Ignore error if no session exists
			}
			// Create new email session with Appwrite
			await account.createEmailPasswordSession(email, password);

			// Get the user to check verification status
			const userData = await account.get();

			// Set the auth store here
			user.set({
				id: userData.$id,
				name: userData.name,
				email: userData.email
			});
			isAuthenticated.set(true);


			if (!userData.emailVerification) {
				// If email is not verified, redirect to verification page
				window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
				return;
			}

			// If email is verified, redirect to dashboard
			window.location.href = '/dashboard';
		} catch (error) {
			console.error('Login failed:', error);

			if (error instanceof AppwriteException) {
				switch (error.type) {
					case 'user_invalid_credentials':
						showAlert('Invalid email or password', true);
						break;
					case 'user_not_found':
						showAlert('No account found with this email', true);
						break;
					default:
						showAlert(`Login failed: ${error.message}`, true);
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
			<h1 class="text-primary text-5xl font-bold">Log In</h1>
			<p class="py-6">Welcome back! Please login to continue.</p>
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
								name="email"
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
								name="password"
								required
								placeholder="Password"
								minlength="8"
								bind:value={password}
								oninput={handlePasswordInput}
							/>
						</label>
						<div class="validator-hint text-error text-sm mt-1" class:hidden={!showPasswordError}>
							Please enter a valid password
						</div>
					</div>
				</div>

				<div class="label mt-2">
					<a href="/forgot-password" class="label-text-alt link link-hover">Forgot password?</a>
				</div>

				<div class="form-control mt-6 w-full">
					<button
						class="btn btn-primary w-full"
						type="submit"
						disabled={loading || !isEmailValid || !isPasswordValid || !email || !password}
					>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{/if}
						{loading ? '' : 'Log In'}
					</button>
				</div>
				<div class="mt-4 text-center">
					<a href="/signup" class="link link-hover text-sm"> Don't have an account? Sign Up </a>
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