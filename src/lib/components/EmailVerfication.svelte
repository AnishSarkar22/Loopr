<script lang="ts">
	import { account } from '../appwrite';
	import { goto } from '$app/navigation';
	import { PUBLIC_APP_URL } from '$env/static/public';

	export let userEmail: string = ''; // Email used during signup
	let isResending = false;

	let showToast = false;
	let toastMessage = '';
	let isError = false;

	function showAlert(message: string, error = false) {
		toastMessage = message;
		isError = error;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	async function handleResendVerification() {
		isResending = true;
		try {
			await account.createVerification(`${PUBLIC_APP_URL}/verify`);
			showAlert('Verification email has been resent. Please check your inbox.');
		} catch (error) {
			showAlert('Failed to resend verification email. Please try again.');
		} finally {
			isResending = false;
		}
	}
</script>

<div class="bg-base-100 -mt-20 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-96 shadow-xl">
		<div class="card-body text-center">
			<h2 class="card-title mb-6 justify-center text-3xl">Verify Your Email</h2>

			<div class="alert bg-base-200">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Email Verification Required</h3>
					<p>
						We've sent a verification link to:<br />
						<span class="font-semibold">{userEmail}</span>
					</p>
				</div>
			</div>

			<div class="mt-4 space-y-4">
				<p class="text-base-content/70 text-sm">
					Please check your inbox and click the verification link to activate your account. If you
					don't see the email, please check your spam folder.
				</p>

				<button
					class="btn btn-outline w-full"
					on:click={handleResendVerification}
					disabled={isResending}
				>
					{#if isResending}
						<span class="loading loading-spinner"></span>
					{/if}
					Resend Verification Email
				</button>

				<div class="text-center">
					<a href="/login" class="link link-hover text-sm"> Back to Login </a>
				</div>
			</div>
		</div>
	</div>
</div>

{#if showToast}
	<div class="toast toast-bottom toast-end z-50">
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
