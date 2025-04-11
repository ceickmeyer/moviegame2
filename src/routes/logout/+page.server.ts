import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ cookies }) => {
        // Clear the auth cookie
        cookies.delete('admin_auth', { path: '/' });
        
        // Redirect to the game page
        throw redirect(303, '/game');
    }
};