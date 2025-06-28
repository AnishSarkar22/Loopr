// for deleting account using appwrite server-side API
import { json } from '@sveltejs/kit';
import { Client, Users, Account } from 'node-appwrite';
import { 
    APPWRITE_ENDPOINT, 
    APPWRITE_PROJECT_ID, 
    APPWRITE_API_KEY 
} from '$env/static/private';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request, cookies }) => {
    try {
        // Get the authorization header or session cookie
        const authHeader = request.headers.get('authorization');
        const sessionCookie = cookies.get('a_session_' + APPWRITE_PROJECT_ID);
        
        if (!authHeader && !sessionCookie) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Initialize client-side Appwrite to get current user
        const userClient = new Client();
        userClient
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);

        // Set the session
        if (authHeader) {
            userClient.setJWT(authHeader.replace('Bearer ', ''));
        } else if (sessionCookie) {
            userClient.setSession(sessionCookie);
        }

        const userAccount = new Account(userClient);
        const currentUser = await userAccount.get();

        // Initialize server-side Appwrite client with API key
        const adminClient = new Client();
        adminClient
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID)
            .setKey(APPWRITE_API_KEY);

        const users = new Users(adminClient);

        // Delete the user account
        await users.delete(currentUser.$id);

        // Clear session cookies
        cookies.delete('a_session_' + APPWRITE_PROJECT_ID, { 
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });

        // Also clear any legacy session cookies
        cookies.delete('appwrite-session', { path: '/' });

        return json({ success: true, message: 'Account deleted successfully' });

    } catch (error: unknown) {
        console.error('Delete account error:', error);
        
        const { message, code } = getErrorDetails(error);
        
        return json({ 
            error: message,
            code: code
        }, { status: 500 });
    }
};