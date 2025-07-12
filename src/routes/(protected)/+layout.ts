import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { account } from '$lib/appwrite';
import { user, isAuthenticated } from '$lib/stores/auth';

export const load: LayoutLoad = async () => {
    if (!browser) return {};

    try {
        const session = await account.get();
        user.set({
            id: session.$id,
            name: session.name,
            email: session.email
        });
        isAuthenticated.set(true);
        return {};
    } catch {
        user.set(null);
        isAuthenticated.set(false);
        throw redirect(302, '/dashboard');
    }
};