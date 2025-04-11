<!-- routes\game\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import GameStart from './components/GameStart.svelte';
    import GameBoard from './components/GameBoard.svelte';
    import GameResult from './components/GameResult.svelte';
    import { gameState, loadGameData, startNewGame } from './store/gameStore';
    import './styles/letterboxd.css';
    
    let loading = true;
    let error: string | null = null;
    
    onMount(async () => {
      try {
        await loadGameData();
        loading = false;
        // Automatically start a new game when the page loads
        await startNewGame();
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load game data';
        loading = false;
      }
    });
</script>

<svelte:head>
    <title>Movie Guesser</title>
</svelte:head>

<div class="letterboxd-content">
    <!-- Removed h1 title "Movie Guesser" -->
    
    {#if loading}
        <div class="loading-screen" in:fade>
            <span class="loader"></span>
            <p>Loading movie data...</p>
        </div>
    {:else if error}
        <div class="error-screen" in:fade>
            <p class="error-message">{error}</p>
            <button class="btn-primary" on:click={() => window.location.reload()}>Try Again</button>
        </div>
    {:else}
        {#if $gameState === 'ready'}
            <GameStart />
        {:else if $gameState === 'playing'}
            <GameBoard />
        {:else if $gameState === 'success' || $gameState === 'failed'}
            <GameResult />
        {/if}
    {/if}
</div>

<style>
    .letterboxd-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0; /* Remove padding at top */
    }
    
    .loading-screen, .error-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background-color: var(--card-bg);
        border-radius: 4px;
        margin-top: 2rem;
        text-align: center;
    }
    
    .loader {
        width: 48px;
        height: 48px;
        border: 3px solid var(--text-secondary);
        border-radius: 50%;
        display: inline-block;
        position: relative;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    .loader::after {
        content: '';  
        box-sizing: border-box;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid transparent;
        border-bottom-color: var(--accent);
    }
    
    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    } 
    
    .error-message {
        color: var(--error);
        margin-bottom: 1.5rem;
    }
</style>