import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

// Simple admin password - in a real app, this would be stored securely
const ADMIN_PASSWORD = 'movieadmin123';

export const actions: Actions = {
    default: async ({ request, cookies, url }) => {
        const data = await request.formData();
        const password = data.get('password')?.toString();
        
        // If no password was provided or it's incorrect
        if (!password || password !== ADMIN_PASSWORD) {
            return fail(400, { 
                message: 'Invalid password',
                incorrect: true
            });
        }
        
        // Set the auth cookie
        cookies.set('admin_auth', ADMIN_PASSWORD, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' && process.env.ALLOW_HTTP !== 'true',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        // Redirect to the admin dashboard or the page they were trying to access
        const redirectTo = url.searchParams.get('redirectTo') || '/';
        throw redirect(303, redirectTo);
    }
};