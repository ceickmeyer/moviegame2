<!-- routes\game\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import GameBoard from './components/GameBoard.svelte';
    import GameResult from './components/GameResult.svelte';
    import { gameState, loadGameData, startNewGame, isLoading } from './store/gameStore';
    import './styles/letterboxd.css';
    
    let error: string | null = null;
    
    onMount(async () => {
      try {
        // Load minimal game data and immediately start
        await loadGameData();
        await startNewGame();
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load game data';
      }
    });
</script>

<svelte:head>
    <title>Movie Guesser</title>
</svelte:head>

<div class="letterboxd-content">
    {#if error}
        <div class="error-screen" in:fade>
            <p class="error-message">{error}</p>
            <button class="btn-primary" on:click={() => window.location.reload()}>Try Again</button>
        </div>
    {:else}
        {#if $gameState === 'playing' || $isLoading}
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
        padding: 0;
    }
    
    .error-screen {
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
    
    .error-message {
        color: var(--error);
        margin-bottom: 1.5rem;
    }
</style>