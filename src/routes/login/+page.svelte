<!-- routes/login/+page.svelte -->
<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';
    
    export let form;
    let loading = false;
    let password = '';
    
    // Get the redirectTo parameter from the URL
    $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';
</script>

<svelte:head>
    <title>Admin Login</title>
</svelte:head>

<div class="login-container" in:fade>
    <div class="login-card">
        <div class="login-header">
            <h1>Movie Game Admin</h1>
            <p>Please log in to access the admin area</p>
        </div>
        
        <form method="POST" class="login-form" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
                loading = false;
                await update();
            };
        }}>
            {#if form?.incorrect}
                <div class="error-message" in:fade>
                    {form.message || 'Invalid password'}
                </div>
            {/if}
            
            <div class="form-group">
                <label for="password">Admin Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    bind:value={password}
                    placeholder="Enter admin password"
                    required
                    autocomplete="current-password"
                />
            </div>
            
            <!-- Add hidden input for redirectTo -->
            <input type="hidden" name="redirectTo" value={redirectTo}>
            
            <button type="submit" class="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
            </button>
            
            <div class="login-footer">
                <a href="/game" class="game-link">Go to Game</a>
            </div>
        </form>
    </div>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 1rem;
    }
    
    .login-card {
        background-color: var(--card-bg, #2a2a2a);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        border: 1px solid var(--border-color, #444);
    }
    
    .login-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .login-header h1 {
        color: var(--heading-color, #fff);
        margin-bottom: 0.5rem;
    }
    
    .login-header p {
        color: var(--text-muted, #aaa);
        margin: 0;
    }
    
    .login-form {
        display: flex;
        flex-direction: column;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-color, #e0e0e0);
    }
    
    input {
        width: 100%;
        padding: 0.75rem;
        border-radius: 4px;
        border: 1px solid var(--border-color, #444);
        background-color: var(--card-bg-accent, #323232);
        color: var(--text-color, #e0e0e0);
        font-size: 1rem;
    }
    
    input:focus {
        outline: none;
        border-color: var(--accent-color, #ff3e00);
    }
    
    .login-button {
        background-color: var(--accent-color, #ff3e00);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.75rem;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .login-button:hover {
        background-color: var(--accent-hover, #ff5c26);
    }
    
    .login-button:disabled {
        background-color: #666;
        cursor: not-allowed;
    }
    
    .login-footer {
        margin-top: 1.5rem;
        text-align: center;
    }
    
    .game-link {
        color: var(--text-muted, #aaa);
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    .game-link:hover {
        color: var(--text-color, #e0e0e0);
        text-decoration: underline;
    }
    
    .error-message {
        background-color: rgba(244, 67, 54, 0.1);
        color: var(--danger-color, #f44336);
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        text-align: center;
    }
</style>