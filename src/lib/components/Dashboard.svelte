<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Log } from '$lib/types/index';

	export let appName: string;
	export let endpoint: string;
	export let isEnabled: boolean;
	export let successCount: number;
	export let lastPingTime: string | null;
	export let lastPingStatus: 'success' | 'error' | '';
	export let lastPingStatusCode: number | null;
	export let logs: Log[];
	export let showToast: boolean;

	export let onTogglePing: () => void;
</script>

<div class="card mb-8 shadow-sm">
	<div class="card-body">
		<div class="form-control mb-4 w-full">
			<label for="app-url" class="label mb-4">
				<span class="label-text">App URL</span>
			</label>
			<div>
				<label class="input w-full">
					<span class="label">https://</span>
					<input
						type="text"
						bind:value={appName}
						placeholder="my-app"
						class="placeholder:text-base-content/30"
						style="text-align: right;"
						disabled={isEnabled}
					/>
					<span class="label">.onrender.com/</span>
					<input
						type="text"
						bind:value={endpoint}
						placeholder="api/healthcheck (optional)"
						class="placeholder:text-base-content/30"
						style="text-align: left;"
						disabled={isEnabled}
					/>
				</label>
			</div>
		</div>

		<!-- <div class="tooltip">
				<div class="tooltip-content border-orange-950">
					<div class="animate-bounce text-xs font-black text-orange-500">
						Fighting the sleepy Render servers, one ping at a time!
					</div>
				</div>
				<button
					class={`btn btn-soft ${isEnabled ? 'btn-error' : 'btn-primary'} sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg mt-2 w-full`}
					on:click={togglePinging}
				>
					{isEnabled ? 'Stop Pinging' : 'Keep this URL alive!'}
				</button>
			</div> -->
		<button
			class={`btn btn-soft ${isEnabled ? 'btn-error' : 'btn-primary'} sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg mt-2 w-full`}
			on:click={onTogglePing}
		>
			{isEnabled ? 'Stop Pinging' : 'Keep this URL alive!'}
		</button>

		<div class="mt-4 flex flex-col gap-2">
			<div
				class="alert alert-success min-h-8 py-2"
				class:alert-success={isEnabled}
				class:alert-ghost={!isEnabled}
			>
				<div class="flex items-center gap-2">
					<span class="loading loading-ring loading-xs" class:hidden={!isEnabled}></span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						class:hidden={isEnabled}
					>
						<circle cx="12" cy="12" r="10" class="stroke-current opacity-30" stroke-width="4"
						></circle>
					</svg>
					<span>{isEnabled ? 'Service Active' : 'Service Inactive'}</span>
				</div>
			</div>

			<div class="text-sm">
				{#if showToast}
					<div class="toast toast-end z-50" transition:fade={{ duration: 200 }}>
						<div
							class="alert {isEnabled
								? 'alert-info bg-info/90'
								: 'alert-warning bg-warning/90'} shadow-lg backdrop-blur-sm"
						>
							<span class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="h-4 w-4 stroke-current"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={isEnabled
											? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
											: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'}
									>
									</path>
								</svg>
								{isEnabled ? 'Pinging your URL every 10-15 minutes' : 'Enter your URL'}
							</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if isEnabled}
		<div class="stats mb-5 w-full backdrop-blur-sm">
			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Success Count</div>
				<div class="stat-value text-primary text-4xl">{successCount}</div>
			</div>

			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Last Ping</div>
				<div class="stat-value text-secondary text-4xl">
					{lastPingTime ? lastPingTime.split(' ')[0] : 'N/A'}
				</div>
				<div class="stat-desc text-base opacity-70">
					{lastPingTime ? lastPingTime.split(' ')[1] : ''}
				</div>
			</div>

			<div class="stat place-items-center">
				<div class="stat-title font-medium opacity-80">Last Status</div>
				<div
					class="stat-value text-4xl"
					class:text-success={lastPingStatus === 'success'}
					class:text-error={lastPingStatus === 'error'}
				>
					{lastPingStatusCode || 'N/A'}
				</div>
				<div class="stat-desc text-base opacity-70">
					{lastPingStatus === 'success' ? 'OK' : lastPingStatus === 'error' ? 'Error' : ''}
				</div>
			</div>
		</div>
	{/if}

	<div class="divider mx-auto my-0 w-2/3"></div>

	<div class="card-body">
		<h2 class="card-title mb-4">Activity Log</h2>
		<div class="bg-base-100 border-base-300 h-64 overflow-y-auto rounded-lg border-2 border-dashed">
			{#each logs as log}
				<div class="border-base-300 border-b px-4 py-2 last:border-0">
					<span class="text-sm opacity-70">[{log.timestamp}]</span>
					<span
						class={`ml-2 ${
							log.type === 'success'
								? 'text-success'
								: log.type === 'error'
									? 'text-error'
									: log.type === 'warning'
										? 'text-warning'
										: 'text-base-content'
						}`}>{log.message}</span
					>
				</div>
			{/each}
			{#if logs.length === 0}
				<div class="text-base-content/70 py-4 text-center">No activity yet</div>
			{/if}
		</div>
	</div>
</div>
