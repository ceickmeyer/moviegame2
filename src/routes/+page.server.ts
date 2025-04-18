// routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    // Check if user is authenticated
    const authCookie = cookies.get('admin_auth');
    
    // If no auth cookie, redirect to login
    if (!authCookie) {
        throw redirect(303, '/login');
    }
    
    // User is authenticated, continue loading the page
    return {
        isAuthenticated: true
    };
};