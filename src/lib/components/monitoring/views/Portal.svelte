<!-- used in URLList and WebhookList component for dropdown -->
<!-- used for parts to appear above everything else and not be clipped by parent containers -->

<script lang="ts">
    import { onMount } from 'svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        target?: string;
        children: Snippet;
    }

    let { target = 'body', children }: Props = $props();
    let portalElement: HTMLElement;
    let targetElement: HTMLElement | null = null;

    onMount(() => {
        targetElement = document.querySelector(target);
        if (targetElement && portalElement) {
            targetElement.appendChild(portalElement);
        }

        return () => {
            if (portalElement && portalElement.parentNode) {
                portalElement.parentNode.removeChild(portalElement);
            }
        };
    });
</script>

<div bind:this={portalElement} style="position: absolute; z-index: 9999;">
    {@render children()}
</div>