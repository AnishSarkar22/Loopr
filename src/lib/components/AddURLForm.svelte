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

<form onsubmit={handleSubmit} class="space-y-4">
    <!-- URL Input -->
    <div class="form-control">
        <label class="label" for="url-input">
            <span class="label-text font-medium">URL *</span>
        </label>
        <input
            id="url-input"
            type="url"
            bind:value={url}
            placeholder="https://example.com"
            class="input input-bordered"
            class:input-error={errors.url}
            required
        />
        {#if errors.url}
            <div class="label">
                <span class="label-text-alt text-error">{errors.url}</span>
            </div>
        {/if}
    </div>

    <!-- Name Input -->
    <div class="form-control">
        <label class="label" for="name-input">
            <span class="label-text font-medium">Name (Optional)</span>
        </label>
        <input
            id="name-input"
            type="text"
            bind:value={name}
            placeholder="My App"
            maxlength="50"
            class="input input-bordered"
            class:input-error={errors.name}
        />
        {#if errors.name}
            <div class="label">
                <span class="label-text-alt text-error">{errors.name}</span>
            </div>
        {/if}
    </div>

    <!-- Description Input -->
    <div class="form-control">
        <label class="label" for="description-input">
            <span class="label-text font-medium">Description (Optional)</span>
        </label>
        <textarea
            id="description-input"
            bind:value={description}
            placeholder="Brief description of this URL..."
            maxlength="200"
            rows="3"
            class="textarea textarea-bordered"
            class:textarea-error={errors.description}
        ></textarea>
        {#if errors.description}
            <div class="label">
                <span class="label-text-alt text-error">{errors.description}</span>
            </div>
        {/if}
    </div>

    <!-- Ping Interval -->
    <div class="form-control">
        <label class="label" for="interval-select">
            <span class="label-text font-medium">Ping Interval</span>
        </label>
        <select
            id="interval-select"
            bind:value={pingInterval}
            class="select select-bordered"
            class:select-error={errors.pingInterval}
        >
            <option value={5}>Every 5 minutes</option>
            <option value={10}>Every 10 minutes</option>
            <option value={15}>Every 15 minutes (Recommended)</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
            <option value={180}>Every 3 hours</option>
            <option value={360}>Every 6 hours</option>
            <option value={720}>Every 12 hours</option>
            <option value={1440}>Every 24 hours</option>
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
    <div class="modal-action">
        <button type="button" class="btn btn-ghost" onclick={handleCancel}>
            Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}
                <span class="loading loading-spinner loading-sm"></span>
            {/if}
            Add URL
        </button>
    </div>
</form>