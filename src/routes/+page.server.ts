// routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
    // Check if user is authenticated
    const authCookie = cookies.get('admin_auth');
    
    // Skip auth check for the game route and login route
    if (url.pathname === '/game' || url.pathname === '/login') {
        return {
            isAuthenticated: !!authCookie
        };
    }
    
    // If no auth cookie, redirect to login
    if (!authCookie) {
        throw redirect(303, '/login?redirectTo=' + encodeURIComponent(url.pathname));
    }
    
    // User is authenticated, continue loading the page
    return {
        isAuthenticated: true
    };
};