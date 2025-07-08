import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { account } from '$lib/appwrite';

export const load: LayoutLoad = async () => {
    if (!browser) return {}; // Only check on client

    try {
        await account.get();
        return {};
    } catch {
        throw redirect(302, '/dashboard');
    }
};