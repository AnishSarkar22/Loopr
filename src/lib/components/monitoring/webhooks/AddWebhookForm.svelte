<script lang="ts">
    import { webhookService } from '$lib/services/webhookService';
    import type { ScheduledWebhook } from '$lib/types';

    interface Props {
        userId: string | null;
        onSuccess: (webhook: ScheduledWebhook) => void;
        onCancel: () => void;
    }

    let { userId, onSuccess, onCancel }: Props = $props();

    let url = $state('');
    let name = $state('');
    let description = $state('');
    let method = $state('POST');
    let payload = $state('');
    let headers = $state('');
    let scheduledTime = $state('');
    let priority = $state(1);
    let maxRetries = $state(3);
    let loading = $state(false);
    let errors = $state<Record<string, string>>({});

    function validateForm(): boolean {
        errors = {};

        if (!url.trim()) {
            errors.url = 'URL is required';
        } else {
            try {
                new URL(url);
            } catch {
                errors.url = 'Please enter a valid URL';
            }
        }

        if (!scheduledTime) {
            errors.scheduledTime = 'Scheduled time is required';
        } else {
            const scheduleDate = new Date(scheduledTime);
            if (scheduleDate <= new Date()) {
                errors.scheduledTime = 'Scheduled time must be in the future';
            }
        }

        if (name.trim().length > 50) {
            errors.name = 'Name must be 50 characters or less';
        }

        if (description.trim().length > 200) {
            errors.description = 'Description must be 200 characters or less';
        }

        if (payload && method === 'GET') {
            errors.payload = 'GET requests cannot have a payload';
        }

        if (headers) {
            try {
                JSON.parse(headers);
            } catch {
                errors.headers = 'Headers must be valid JSON';
            }
        }

        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (!validateForm() || !userId || loading) return;

        loading = true;
        try {
            const webhook = await webhookService.createWebhook({
                userId,
                url: url.trim(),
                name: name.trim() || undefined,
                description: description.trim() || undefined,
                method,
                payload: payload.trim() || undefined,
                headers: headers.trim() || undefined,
                scheduledTime: new Date(scheduledTime).toISOString(),
                priority,
                maxRetries
            });

            onSuccess(webhook);
            
            // Reset form
            url = '';
            name = '';
            description = '';
            method = 'POST';
            payload = '';
            headers = '';
            scheduledTime = '';
            priority = 1;
            maxRetries = 3;
        } catch (error) {
            errors.submit = error instanceof Error ? error.message : 'Failed to create webhook';
        } finally {
            loading = false;
        }
    }

    function handleCancel() {
        // Reset form
        url = '';
        name = '';
        description = '';
        method = 'POST';
        payload = '';
        headers = '';
        scheduledTime = '';
        priority = 1;
        maxRetries = 3;
        errors = {};
        onCancel();
    }

    // Set minimum datetime to current time
    let minDateTime = $state('');
    $effect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // At least 1 minute in future
        minDateTime = now.toISOString().slice(0, 16);
    });
</script>

<div class="p-4 sm:p-6 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
        <h3 class="text-lg font-bold text-base-content mb-2">Schedule Webhook</h3>
        <p class="text-sm text-base-content/70">Schedule an HTTP request to be sent at a specific time</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
        <!-- URL Input -->
        <div class="form-control w-full">
            <label class="label" for="webhook-url-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Webhook URL
                </span>
                <span class="label-text-alt badge badge-error badge-xs">Required</span>
            </label>
            <input
                id="webhook-url-input"
                type="url"
                bind:value={url}
                placeholder="https://api.example.com/webhook"
                class="input input-bordered w-full focus:input-primary"
                class:input-error={errors.url}
                disabled={loading}
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
            <label class="label" for="webhook-name-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Name
                </span>
                <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
            </label>
            <input
                id="webhook-name-input"
                type="text"
                bind:value={name}
                placeholder="My Webhook"
                maxlength="50"
                class="input input-bordered w-full focus:input-primary"
                class:input-error={errors.name}
                disabled={loading}
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
            <label class="label" for="webhook-description-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description
                </span>
                <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
            </label>
            <textarea
                id="webhook-description-input"
                bind:value={description}
                placeholder="Brief description of this webhook..."
                maxlength="200"
                rows="2"
                class="textarea textarea-bordered w-full focus:textarea-primary resize-none"
                class:textarea-error={errors.description}
                disabled={loading}
            ></textarea>
            <div class="label">
                <span class="label-text-alt text-base-content/60">{description.length}/200 characters</span>
                {#if errors.description}
                    <span class="label-text-alt text-error">{errors.description}</span>
                {/if}
            </div>
        </div>

        <!-- Method and Scheduled Time Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- HTTP Method -->
            <div class="form-control w-full">
                <label class="label" for="webhook-method-select">
                    <span class="label-text font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        HTTP Method
                    </span>
                </label>
                <select
                    id="webhook-method-select"
                    bind:value={method}
                    class="select select-bordered w-full focus:select-primary"
                    disabled={loading}
                >
                    <option value="POST">📝 POST</option>
                    <option value="GET">👁️ GET</option>
                    <option value="PUT">✏️ PUT</option>
                    <option value="PATCH">🔧 PATCH</option>
                    <option value="DELETE">🗑️ DELETE</option>
                </select>
            </div>

            <!-- Scheduled Time -->
            <div class="form-control w-full">
                <label class="label" for="webhook-time-input">
                    <span class="label-text font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Scheduled Time
                    </span>
                    <span class="label-text-alt badge badge-error badge-xs">Required</span>
                </label>
                <input
                    id="webhook-time-input"
                    type="datetime-local"
                    bind:value={scheduledTime}
                    min={minDateTime}
                    class="input input-bordered w-full focus:input-primary"
                    class:input-error={errors.scheduledTime}
                    disabled={loading}
                    required
                />
                {#if errors.scheduledTime}
                    <div class="label">
                        <span class="label-text-alt text-error flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.scheduledTime}
                        </span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Priority and Max Retries Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Priority -->
            <div class="form-control w-full">
                <label class="label" for="webhook-priority-select">
                    <span class="label-text font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Priority
                    </span>
                </label>
                <select
                    id="webhook-priority-select"
                    bind:value={priority}
                    class="select select-bordered w-full focus:select-primary"
                    disabled={loading}
                >
                    <option value={1}>🔵 Low (1)</option>
                    <option value={2}>🟡 Normal (2)</option>
                    <option value={3}>🟠 High (3)</option>
                    <option value={4}>🔴 Critical (4)</option>
                </select>
            </div>

            <!-- Max Retries -->
            <div class="form-control w-full">
                <label class="label" for="webhook-retries-input">
                    <span class="label-text font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Max Retries
                    </span>
                </label>
                <input
                    id="webhook-retries-input"
                    type="number"
                    bind:value={maxRetries}
                    min="0"
                    max="10"
                    class="input input-bordered w-full focus:input-primary"
                    disabled={loading}
                />
            </div>
        </div>

        <!-- Payload Field (only for non-GET methods) -->
        {#if method !== 'GET'}
            <div class="form-control w-full">
                <label class="label" for="webhook-payload-input">
                    <span class="label-text font-semibold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Payload (JSON)
                    </span>
                    <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
                </label>
                <textarea
                    id="webhook-payload-input"
                    bind:value={payload}
                    placeholder={`{"message": "Hello World", "data": "example"}`}
                    rows="4"
                    class="textarea textarea-bordered w-full focus:textarea-primary resize-none font-mono text-sm"
                    class:textarea-error={errors.payload}
                    disabled={loading}
                ></textarea>
                {#if errors.payload}
                    <div class="label">
                        <span class="label-text-alt text-error flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.payload}
                        </span>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Headers Field -->
        <div class="form-control w-full">
            <label class="label" for="webhook-headers-input">
                <span class="label-text font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Custom Headers (JSON)
                </span>
                <span class="label-text-alt badge badge-ghost badge-xs">Optional</span>
            </label>
            <textarea
                id="webhook-headers-input"
                bind:value={headers}
                placeholder={`{"Authorization": "Bearer token", "X-Custom": "value"}`}
                rows="3"
                class="textarea textarea-bordered w-full focus:textarea-primary resize-none font-mono text-sm"
                class:textarea-error={errors.headers}
                disabled={loading}
            ></textarea>
            {#if errors.headers}
                <div class="label">
                    <span class="label-text-alt text-error flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.headers}
                    </span>
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
                disabled={loading || !userId}
            >
                {#if loading}
                    <span class="loading loading-spinner loading-sm"></span>
                    <!-- Scheduling... -->
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Schedule Webhook
                {/if}
            </button>
        </div>
    </form>
</div>