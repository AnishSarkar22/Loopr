<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { account, AppwriteException } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { isAuthenticated, user } from '$lib/stores/auth';

	let currentName = $state('');
	let newName = $state('');
	let successMessage = $state('');
	let errorMessage = $state('');
	let nameLoading = $state(false);
	let passwordLoading = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let loading = $state(true);
	let showToast = $state(false);
	let toastMessage = $state('');
	let isError = $state(false);
	let isNewPasswordValid = $state(true);
	let doPasswordsMatch = $state(true);
	let isCurrentPasswordValid = $state(true);
	let showNewPassword = $state(false);
	let showConfirmNewPassword = $state(false);
	let showCurrentPassword = $state(false);

	let showDeleteConfirm = $state(false);
	let deleteTimeout: number | null = null;
	let deleteLoading = $state(false);

	const DELETE_TIMEOUT = 5000;

	// Change name functions
	onMount(() => {
		if ($user?.name) {
			currentName = $user.name;
			newName = $user.name;
			loading = false;
		} else {
			errorMessage = 'Failed to load profile.';
			loading = false;
		}
	});

	async function handleNameChange(e: Event) {
		e.preventDefault();
		nameLoading = true;
		try {
			await account.updateName(newName);
			currentName = newName;

			showAlert('Name updated successfully!', false);
		} catch (e) {
			showAlert('Failed to update name. Please try again.', true);
		} finally {
			nameLoading = false;
		}
	}

	// Delete account functions
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
			const jwt = await account.createJWT();

			// Call your SvelteKit API endpoint with user ID and JWT
			const response = await fetch('/api/delete-account', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${jwt.jwt}`
				},
				body: JSON.stringify({ userId: user.$id }),
				credentials: 'include'
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

	// password change functions
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
		passwordLoading = true;
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
			passwordLoading = false;
		}
	}
</script>

{#if loading}
	<!-- Skeleton Loader -->
	<div class="container mx-auto mt-20 max-w-3xl px-4">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<div class="flex flex-col gap-6">
					<div class="flex items-center justify-center">
						<div class="skeleton mb-4 h-10 w-40"></div>
					</div>
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<div class="skeleton mb-2 h-6 w-32"></div>
							<div class="skeleton mb-2 h-10 w-full"></div>
							<div class="skeleton mb-2 h-6 w-32"></div>
							<div class="skeleton mb-2 h-10 w-full"></div>
							<div class="skeleton h-10 w-32"></div>
						</div>
					</div>
					<div class="divider mx-auto w-1/2"></div>
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<div class="skeleton mb-2 h-6 w-32"></div>
							<div class="skeleton mb-2 h-10 w-full"></div>
							<div class="skeleton h-10 w-32"></div>
						</div>
					</div>
					<div class="divider mx-auto w-1/2"></div>
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body bg-error/5 rounded-box">
							<div class="skeleton mb-2 h-6 w-32"></div>
							<div class="skeleton h-10 w-full"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
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

					<!-- Change Name Section -->
					<div class="card bg-base-100 border-base-300 border">
						<div class="card-body">
							<h3 class="card-title text-base-content">Change Name</h3>
							<p class="text-base-content/70 mb-4 text-sm">
								Update your display name for your account.
							</p>
							<form class="space-y-4" onsubmit={handleNameChange}>
								<!-- Current Name -->
								<div class="form-control w-full">
									<label class="label" for="current-name">
										<span class="label-text text-base-content mb-1 font-medium">Current Name</span>
									</label>
									<input
										id="current-name"
										type="text"
										class="input input-bordered bg-base-100 text-base-content w-full"
										value={currentName}
										readonly
									/>
								</div>
								<!-- New Name -->
								<div class="form-control w-full">
									<label class="label" for="new-name">
										<span class="label-text text-base-content mb-1 font-medium">New Name</span>
									</label>
									<input
										id="new-name"
										type="text"
										class="input input-bordered bg-base-100 text-base-content w-full"
										bind:value={newName}
										required
										minlength="2"
										placeholder="Enter your new name"
									/>
								</div>
								<!-- Submit Button -->
								<div class="form-control mt-6">
									<button
										type="submit"
										class="btn btn-primary"
										disabled={nameLoading || !newName || newName === currentName}
									>
										{#if loading}
											<span class="loading loading-spinner loading-sm"></span>
											<!-- Updating... -->
										{:else}
											Update Name
										{/if}
									</button>
								</div>
							</form>
						</div>
					</div>

					<div class="divider mx-auto w-1/2"></div>

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
        <span class="label-text text-base-content mb-1 font-medium">Current Password</span>
    </label>
    <label class="input validator flex w-full items-center" class:input-error={!isCurrentPasswordValid && currentPassword}>
        <svg
            class="h-[1em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
        >
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
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Enter your current password"
            class="grow text-sm"
            bind:value={currentPassword}
            required
        />
        <button
            type="button"
            tabindex="-1"
            class="btn btn-ghost btn-xs p-1"
            onclick={() => (showCurrentPassword = !showCurrentPassword)}
            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
        >
            {#if showCurrentPassword}
                <!-- Eye open icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"/>
                        <circle cx="12" cy="12" r="3"/>
                    </g>
                </svg>
            {:else}
                <!-- Eye off icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18l-.722-3.25M2 8a10.645 10.645 0 0 0 20 0m-2 7l-1.726-2.05M4 15l1.726-2.05M9 18l.722-3.25"/>
                </svg>
            {/if}
        </button>
    </label>
    {#if !isCurrentPasswordValid && currentPassword}
        <label class="label" for="current-password">
            <span class="label-text-alt text-error">Please enter your current password</span>
        </label>
    {/if}
</div>

								<!-- New Password -->
								<div class="form-control w-full">
									<label class="label" for="new-password">
										<span class="label-text text-base-content mb-1 font-medium">New Password</span>
									</label>
									<label
										class="input validator flex w-full items-center"
										class:input-error={!isNewPasswordValid && newPassword}
									>
										<svg
											class="h-[1em] opacity-50"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
										>
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
											id="new-password"
											type={showNewPassword ? 'text' : 'password'}
											placeholder="Enter your new password"
											class="grow text-sm"
											bind:value={newPassword}
											oninput={(e) => {
												const target = e.target as HTMLInputElement;
												if (target) validateNewPassword(target.value);
											}}
											required
											aria-describedby="new-password-error"
										/>
										<button
											type="button"
											tabindex="-1"
											class="btn btn-ghost btn-xs p-1"
											onclick={() => (showNewPassword = !showNewPassword)}
											aria-label={showNewPassword ? 'Hide password' : 'Show password'}
										>
											{#if showNewPassword}
												<!-- Eye open icon -->
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<g
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
													>
														<path
															d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"
														/>
														<circle cx="12" cy="12" r="3" />
													</g>
												</svg>
											{:else}
												<!-- Eye off icon -->
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="m15 18l-.722-3.25M2 8a10.645 10.645 0 0 0 20 0m-2 7l-1.726-2.05M4 15l1.726-2.05M9 18l.722-3.25"
													/>
												</svg>
											{/if}
										</button>
									</label>
									{#if !isNewPasswordValid && newPassword}
										<label class="label" for="new-password" id="new-password-error">
											<span class="label-text-alt text-error"
												>Password must be at least 8 characters long</span
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
									<label
										class="input validator flex w-full items-center"
										class:input-error={!doPasswordsMatch && confirmNewPassword}
									>
										<svg
											class="h-[1em] opacity-50"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
										>
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
											id="confirm-password"
											type={showConfirmNewPassword ? 'text' : 'password'}
											placeholder="Confirm your new password"
											class="grow text-sm"
											bind:value={confirmNewPassword}
											oninput={(e) => {
												const target = e.target as HTMLInputElement;
												if (target) validateConfirmPassword(target.value);
											}}
											required
										/>
										<button
											type="button"
											tabindex="-1"
											class="btn btn-ghost btn-xs p-1"
											onclick={() => (showConfirmNewPassword = !showConfirmNewPassword)}
											aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
										>
											{#if showConfirmNewPassword}
												<!-- Eye open icon -->
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<g
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
													>
														<path
															d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"
														/>
														<circle cx="12" cy="12" r="3" />
													</g>
												</svg>
											{:else}
												<!-- Eye off icon -->
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="m15 18l-.722-3.25M2 8a10.645 10.645 0 0 0 20 0m-2 7l-1.726-2.05M4 15l1.726-2.05M9 18l.722-3.25"
													/>
												</svg>
											{/if}
										</button>
									</label>
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
										{#if passwordLoading}
											<span class="loading loading-spinner loading-sm"></span>
											<!-- Changing Password... -->
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
											<!-- Deleting... -->
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
											<div class="mt-4 flex flex-col gap-2 sm:flex-row">
												<button
													class="btn btn-error btn-sm w-full text-xs sm:w-auto"
													onclick={confirmDelete}
													disabled={deleteLoading}
												>
													{#if deleteLoading}
														<span class="loading loading-spinner loading-xs"></span>
														<!-- Deleting... -->
													{:else}
														Yes, Delete My Account
													{/if}
												</button>
												<button
													class="btn btn-ghost btn-sm w-full sm:w-auto"
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
{/if}

<style>
	input:focus {
		outline: none;
		box-shadow: none;
	}
</style>
