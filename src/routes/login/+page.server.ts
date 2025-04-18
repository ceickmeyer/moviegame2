// routes/login/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Simple admin password - in a real app, this would be stored securely
const ADMIN_PASSWORD = 'movieadmin123';

// Check if user is already logged in
export const load: PageServerLoad = async ({ cookies, url }) => {
    const authCookie = cookies.get('admin_auth');
    
    // If user is already authenticated, redirect them to intended destination
    if (authCookie) {
        const redirectTo = url.searchParams.get('redirectTo') || '/';
        throw redirect(303, redirectTo);
    }
    
    // Continue to login page if not authenticated
    return {};
};

export const actions: Actions = {
    default: async ({ request, cookies, url }) => {
        const data = await request.formData();
        const password = data.get('password')?.toString();
        const redirectTo = data.get('redirectTo')?.toString() || '/';
        
        // Validate the password
        if (!password || password !== ADMIN_PASSWORD) {
            return fail(400, { 
                message: 'Invalid password',
                incorrect: true
            });
        }
        
        // Set the auth cookie
        cookies.set('admin_auth', 'authenticated', {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        
        // Redirect to the admin dashboard or the page they were trying to access
        throw redirect(303, redirectTo);
    }
};