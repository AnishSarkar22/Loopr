<script lang="ts">
    import { urlService } from '$lib/services/urlService';
    import type { PingURL } from '$lib/types';

    interface Props {
        userId: string | null;
        onSuccess: (url: PingURL) => void;
        onCancel: () => void;
    }

    let { userId, onSuccess, onCancel }: Props = $props();

    let url = $state('');
    let name = $state('');
    let description = $state('');
    let pingInterval = $state(15);
    let loading = $state(false);
    let errors = $state<Record<string, string>>({});

    function validateForm(): boolean {
        errors = {};

        if (!url.trim()) {
            errors.url = 'URL is required';
        } else {
            const normalizedUrl = normalizeUrl(url.trim());
            if (!isValidUrl(normalizedUrl)) {
                errors.url = 'Please enter a valid URL';
            }
        }

        if (name.trim().length > 50) {
            errors.name = 'Name must be 50 characters or less';
        }

        if (description.trim().length > 200) {
            errors.description = 'Description must be 200 characters or less';
        }

        if (pingInterval < 5 || pingInterval > 1440) {
            errors.pingInterval = 'Ping interval must be between 5 and 1440 minutes';
        }

        return Object.keys(errors).length === 0;
    }

    function normalizeUrl(inputUrl: string): string {
        if (!inputUrl) return '';
        if (!/^https?:\/\//i.test(inputUrl)) {
            return `https://${inputUrl}`;
        }
        return inputUrl;
    }

    function isValidUrl(inputUrl: string): boolean {
        try {
            new URL(inputUrl);
            return true;
        } catch {
            return false;
        }
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (!userId || !validateForm()) return;

        loading = true;
        try {
            const normalizedUrl = normalizeUrl(url.trim());
            const newUrl = await urlService.createURL(
                normalizedUrl,
                userId,
                name.trim() || undefined,
                pingInterval,
                description.trim() || undefined
            );

            onSuccess(newUrl);
            
            // Reset form
            url = '';
            name = '';
            description = '';
            pingInterval = 15;
        } catch (error) {
            console.error('Error creating URL:', error);
            errors.submit = error instanceof Error ? error.message : 'Failed to create URL';
        } finally {
            loading = false;
        }
    }

    function handleCancel() {
        // Reset form
        url = '';
        name = '';
        description = '';
        pingInterval = 15;
        errors = {};
        onCancel();
    }
</script>

<div class="p-6 max-w-md mx-auto">
    <!-- Header -->
    <div class="mb-6">
        <h3 class="text-lg font-bold text-base-content mb-2">Add New URL</h3>
        <p class="text-sm text-base-content/70">Monitor a new website or API endpoint</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
        <!-- URL Input -->
        <div class="form-control w-full">
            <label class="label" for="url-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL
                </span>
                <span class="label-text-alt badge badge-error badge-xs">Required</span>
            </label>
            <input
                id="url-input"
                type="url"
                bind:value={url}
                placeholder="https://example.com or example.com"
                class="input input-bordered w-full focus:input-primary"
                class:input-error={errors.url}
                required
            />
            {#if errors.url}
                <div class="label">
                    <span class="label-text-alt text-error flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.url}
                    </span>
                </div>
            {/if}
        </div>

        <!-- Name Input -->
        <div class="form-control w-full">
            <label class="label" for="name-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Name
                </span>
                <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
            </label>
            <input
                id="name-input"
                type="text"
                bind:value={name}
                placeholder="My App or Service Name"
                maxlength="50"
                class="input input-bordered w-full focus:input-primary"
                class:input-error={errors.name}
            />
            <div class="label">
                <span class="label-text-alt text-base-content/60">{name.length}/50 characters</span>
                {#if errors.name}
                    <span class="label-text-alt text-error">{errors.name}</span>
                {/if}
            </div>
        </div>

        <!-- Description Input -->
        <div class="form-control w-full">
            <label class="label" for="description-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description
                </span>
                <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
            </label>
            <textarea
                id="description-input"
                bind:value={description}
                placeholder="Brief description of what this monitors..."
                maxlength="200"
                rows="3"
                class="textarea textarea-bordered w-full focus:textarea-primary resize-none"
                class:textarea-error={errors.description}
            ></textarea>
            <div class="label">
                <span class="label-text-alt text-base-content/60">{description.length}/200 characters</span>
                {#if errors.description}
                    <span class="label-text-alt text-error">{errors.description}</span>
                {/if}
            </div>
        </div>

        <!-- Ping Interval -->
        <div class="form-control w-full">
            <label class="label" for="interval-select">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check Frequency
                </span>
            </label>
            <select
                id="interval-select"
                bind:value={pingInterval}
                class="select select-bordered w-full focus:select-primary"
                class:select-error={errors.pingInterval}
            >
                <option value={5}>⚡ Every 5 minutes</option>
                <option value={10}>🔄 Every 10 minutes</option>
                <option value={15}>✨ Every 15 minutes</option>
                <option value={30}>⏰ Every 30 minutes</option>
                <option value={60}>🕐 Every hour</option>
                <option value={180}>🕒 Every 3 hours</option>
                <option value={360}>🕕 Every 6 hours</option>
                <option value={720}>🕘 Every 12 hours</option>
                <option value={1440}>📅 Every 24 hours</option>
            </select>
            {#if errors.pingInterval}
                <div class="label">
                    <span class="label-text-alt text-error">{errors.pingInterval}</span>
                </div>
            {/if}
        </div>

        <!-- Submit Error -->
        {#if errors.submit}
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errors.submit}</span>
            </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
            <button 
                type="button" 
                class="btn btn-ghost flex-1" 
                onclick={handleCancel}
                disabled={loading}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-primary flex-1" 
                disabled={loading}
            >
                {#if loading}
                    <span class="loading loading-spinner loading-sm"></span>
                    Adding...
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add URL
                {/if}
            </button>
        </div>
    </form>
</div>