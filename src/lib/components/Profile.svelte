<script lang="ts">
	import { fade } from 'svelte/transition';
	import { account, AppwriteException } from '../appwrite';
	import { goto } from '$app/navigation';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let loading = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let isError = $state(false);
	let isNewPasswordValid = $state(true);
	let doPasswordsMatch = $state(true);
	let isCurrentPasswordValid = $state(true);

	let showDeleteConfirm = $state(false);
	let deleteTimeout: number | null = null;
	let deleteLoading = $state(false);
	const DELETE_TIMEOUT = 5000;

	function handleDelete() {
		showDeleteConfirm = true;
		if (deleteTimeout) clearTimeout(deleteTimeout);

		deleteTimeout = window.setTimeout(() => {
			showDeleteConfirm = false;
		}, DELETE_TIMEOUT);
	}

	async function confirmDelete() {
		deleteLoading = true;
		try {
			// Get current user info and JWT token
			const user = await account.get();

			// Get JWT token for authentication
			const jwt = await account.createJWT();

			// Call your SvelteKit API endpoint with user ID and JWT
			const response = await fetch('/api/delete-account', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt.jwt}` // Add JWT token
				},
				body: JSON.stringify({ userId: user.$id }),
				credentials: 'include' // Include cookies
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to delete account');
			}

			// Show success message briefly
			showAlert('Account deleted successfully. Redirecting...');

			// Redirect to home page after a short delay
			setTimeout(() => {
				goto('/');
			}, 1500);
		} catch (error) {
			console.error('Delete account error:', error);

			if (error instanceof AppwriteException) {
				showAlert(`Failed to delete account: ${error.message}`, true);
			} else {
				showAlert('Failed to delete account. Please try again.', true);
			}

			// Reset the confirmation state on error
			showDeleteConfirm = false;
			if (deleteTimeout) clearTimeout(deleteTimeout);
		} finally {
			deleteLoading = false;
		}
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		if (deleteTimeout) clearTimeout(deleteTimeout);
	}

	function validateNewPassword(value: string) {
		const passwordRegex = /^[a-zA-Z0-9]{8,}$/;
		isNewPasswordValid = passwordRegex.test(value);
		if (confirmNewPassword) {
			doPasswordsMatch = value === confirmNewPassword;
		}
	}

	function validateConfirmPassword(value: string) {
		doPasswordsMatch = newPassword === value;
	}

	function showAlert(message: string, error = false) {
		toastMessage = message;
		isError = error;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	async function handleChangePassword(e: Event) {
		e.preventDefault();
		if (!isNewPasswordValid || !doPasswordsMatch) return;
		loading = true;
		try {
			await account.updatePassword(newPassword, currentPassword);
			showAlert('Password changed successfully!');
			currentPassword = '';
			newPassword = '';
			confirmNewPassword = '';
		} catch (error) {
			if (error instanceof AppwriteException) {
				showAlert(error.message, true);
			} else {
				showAlert('Failed to change password', true);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto mt-20 max-w-3xl px-4">
	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast toast-top toast-center z-50" transition:fade>
			<div class="alert {isError ? 'alert-error' : 'alert-success'}">
				<span>{toastMessage}</span>
			</div>
		</div>
	{/if}

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body">
			<div class="flex flex-col gap-6">
				<div class="flex items-center justify-center">
					<h1 class="text-primary -mt-18 py-8 text-3xl font-bold">Your Profile</h1>
				</div>

				<!-- Password Change Section -->
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body">
						<h3 class="card-title text-base-content">Change Password</h3>
						<p class="text-base-content/70 mb-4 text-sm">
							Update your password to keep your account secure.
						</p>

						<form class="space-y-4" onsubmit={handleChangePassword}>
							<!-- Current Password -->
							<div class="form-control w-full">
								<label class="label" for="current-password">
									<span class="label-text text-base-content mb-1 font-medium">Current Password</span
									>
								</label>
								<input
									id="current-password"
									type="password"
									placeholder="Enter your current password"
									class="input input-bordered bg-base-100 text-base-content placeholder:text-base-content/50 w-full {!isCurrentPasswordValid
										? 'input-error'
										: 'focus:border-primary'}"
									bind:value={currentPassword}
									required
								/>
							</div>

							<!-- New Password -->
							<div class="form-control w-full">
								<label class="label" for="new-password">
									<span class="label-text text-base-content mb-1 font-medium">New Password</span>
								</label>
								<input
									id="new-password"
									type="password"
									placeholder="Enter your new password"
									class="input input-bordered bg-base-100 text-base-content placeholder:text-base-content/50 w-full {!isNewPasswordValid
										? 'input-error'
										: 'focus:border-primary'}"
									bind:value={newPassword}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										if (target) validateNewPassword(target.value);
									}}
									required
									aria-describedby="new-password-error"
								/>
								{#if !isNewPasswordValid && newPassword}
									<label class="label" for="new-password" id="new-password-error">
										<span class="label-text-alt text-error"
											>Password must be at least 8 characters long and contain only letters and
											numbers</span
										>
									</label>
								{/if}
							</div>

							<!-- Confirm New Password -->
							<div class="form-control w-full">
								<label class="label" for="confirm-password">
									<span class="label-text text-base-content mb-1 font-medium"
										>Confirm New Password</span
									>
								</label>
								<input
									id="confirm-password"
									type="password"
									placeholder="Confirm your new password"
									class="input input-bordered bg-base-100 text-base-content placeholder:text-base-content/50 w-full {!doPasswordsMatch
										? 'input-error'
										: 'focus:border-primary'}"
									bind:value={confirmNewPassword}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										if (target) validateConfirmPassword(target.value);
									}}
									required
								/>
								{#if !doPasswordsMatch && confirmNewPassword}
									<label class="label" for="confirm-password">
										<span class="label-text-alt text-error">Passwords do not match</span>
									</label>
								{/if}
							</div>

							<!-- Submit Button -->
							<div class="form-control mt-6">
								<button
									type="submit"
									class="btn btn-primary"
									disabled={loading ||
										!isNewPasswordValid ||
										!doPasswordsMatch ||
										!currentPassword ||
										!newPassword ||
										!confirmNewPassword}
								>
									{#if loading}
										<span class="loading loading-spinner loading-sm"></span>
										Changing Password...
									{:else}
										Change Password
									{/if}
								</button>
							</div>
						</form>
					</div>
				</div>

				<div class="divider mx-auto w-1/2"></div>

				<!-- Danger Zone -->
				<div class="card bg-base-100 border-base-300 border">
					<div class="card-body bg-error/5 rounded-box">
						<h3 class="card-title text-error">Danger Zone</h3>

						{#if !showDeleteConfirm}
							<p class="text-base-content/70 text-sm">
								Once you delete your account, there is no going back. Please be certain.
							</p>
							<div class="card-actions mt-4 justify-end">
								<button
									class="btn btn-error btn-outline"
									onclick={handleDelete}
									disabled={deleteLoading}
								>
									{#if deleteLoading}
										<span class="loading loading-spinner loading-sm"></span>
										Deleting...
									{:else}
										Delete Account
									{/if}
								</button>
							</div>
						{:else}
							<div class="alert alert-warning shadow-lg" transition:fade>
								<div class="flex items-start gap-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<div class="flex-1">
										<h3 class="font-bold">Are you absolutely sure?</h3>
										<p class="text-sm">
											This action cannot be undone. This will permanently delete your account and
											remove your data from our servers.
										</p>
										<div class="mt-4 flex gap-2">
											<button
												class="btn btn-error btn-sm"
												onclick={confirmDelete}
												disabled={deleteLoading}
											>
												{#if deleteLoading}
													<span class="loading loading-spinner loading-xs"></span>
													Deleting...
												{:else}
													Yes, Delete My Account
												{/if}
											</button>
											<button
												class="btn btn-ghost btn-sm"
												onclick={cancelDelete}
												disabled={deleteLoading}
											>
												Cancel
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
