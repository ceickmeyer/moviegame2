import { redirect, type Handle } from '@sveltejs/kit';

// Simple admin password - in a real app, this would be stored securely
const ADMIN_PASSWORD = 'movieadmin123';

export const handle: Handle = async ({ event, resolve }) => {
    // Get the auth cookie
    const authCookie = event.cookies.get('admin_auth');
    
    // Check if the path is an admin path (not the game path, login path, or static paths)
    const isAdminPath = !event.url.pathname.startsWith('/game') &&
                        !event.url.pathname.startsWith('/login') &&
                        !event.url.pathname.startsWith('/static') &&
                        !event.url.pathname.endsWith('.json');
    
    // If it's an admin path and not authenticated, redirect to login
    if (isAdminPath && authCookie !== ADMIN_PASSWORD) {
        console.log(`Redirecting unauthenticated request for ${event.url.pathname} to login`);
        throw redirect(303, '/login');
    }
    
    // Continue with the request
    const response = await resolve(event);
    return response;
};