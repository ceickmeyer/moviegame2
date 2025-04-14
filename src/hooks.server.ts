// hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';
import { downloadDatabaseIfOnVercel } from '$lib/vercel-sqlite';

// Simple admin password - in a real app, this would be stored securely
const ADMIN_PASSWORD = 'movieadmin123';

export const handle: Handle = async ({ event, resolve }) => {
    // Initialize database by downloading from external storage if on Vercel
    await downloadDatabaseIfOnVercel();
    
    // Get the auth cookie
    const authCookie = event.cookies.get('admin_auth');
    
    // Log environment information to help debug
    if (event.url.pathname === '/') {
        console.log('Environment info:', {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            VERCEL_URL: process.env.VERCEL_URL,
            BASE_PATH: process.env.BASE_PATH || '(not set)'
        });
    }
    
    // Create a list of paths that should be publicly accessible
    const publicPaths = [
        '/game',
        '/game/', 
        '/api/movie-schedule',
        '/api/clues-data',
        '/api/static-data',
        '/api/backdrop-images',
        '/login',
        '/static',
        '/favicon.png'
    ];
    
    // Check if the current path starts with any of the public paths
    const isPublicPath = publicPaths.some(path => 
        event.url.pathname === path || 
        event.url.pathname.startsWith(`${path}/`)
    );
    
    // Always allow access to API endpoints used by the game
    const isGameApi = event.url.pathname.startsWith('/api/') && 
                     (event.url.pathname.includes('movie-') || 
                      event.url.pathname.includes('clues-') || 
                      event.url.pathname.includes('static-'));
    
    // If it's not a public path or game API and not authenticated, redirect to login
    if (!isPublicPath && !isGameApi && authCookie !== ADMIN_PASSWORD) {
        console.log(`Redirecting unauthenticated request for ${event.url.pathname} to login`);
        throw redirect(303, '/login');
    }
    
    // Continue with the request
    const response = await resolve(event);
    return response;
};