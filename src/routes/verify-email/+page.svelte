<script lang="ts">
	import EmailVerification from '$lib/components/auth/EmailVerfication.svelte';
	import { page } from '$app/stores';

	const email = $page.url.searchParams.get('email') || '';

	// Redirect to login if no email is provided
	if (!email) {
		window.location.href = '/login';
	}
</script>

<EmailVerification userEmail={email} />
