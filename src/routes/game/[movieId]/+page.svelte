<!-- routes\game\[movieId]\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import GameStart from '../components/GameStart.svelte';
    import GameBoard from '../components/GameBoard.svelte';
    import GameResult from '../components/GameResult.svelte';
    import { gameState, loadGameData, startSpecificGame, startGameFromMovieId } from '../store/gameStore';
    import '../styles/letterboxd.css';
    
    export let data;
    
    let loading = true;
    let error: string | null = null;
    let notEnoughCluesWarning = false;
    
    onMount(async () => {
      try {
        // First load all game data (clues, movies, etc.)
        await loadGameData();
        
        // Check if we have a specific movie to load
        if (data.movieData) {
          // Check if we have enough clues
          if (!data.hasEnoughClues) {
            notEnoughCluesWarning = true;
          } else {
            // Start a game with this specific movie
            startSpecificGame(data.movieData);
          }
        } else if (data.movieId) {
          // Try to start a game using the ID from the URL
          const success = startGameFromMovieId(data.movieId);
          if (!success) {
            error = 'Could not find this movie or not enough clues available';
          }
        }
        
        loading = false;
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
    {:else if notEnoughCluesWarning}
        <div class="warning-screen" in:fade>
            <h2>Not Enough Clues Available</h2>
            <p>Sorry, this movie doesn't have enough approved clues to play (minimum 6 required).</p>
            <div class="warning-actions">
                <a href="/game" class="btn-primary">Play Random Movie</a>
                <a href="/review-selector" class="btn-secondary">Add Clues</a>
            </div>
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
        padding: 0;
    }
    
    .loading-screen, .error-screen, .warning-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background-color: var(--card-bg, #2a2a2a);
        border-radius: 4px;
        margin-top: 2rem;
        text-align: center;
        color: #fff;
    }
    
    .warning-screen {
        background-color: #332700;
        border: 1px solid #FFC107;
    }
    
    .warning-screen h2 {
        color: #FFC107;
        margin-top: 0;
    }
    
    .warning-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .btn-primary {
        background-color: var(--accent-color, #ff3e00);
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
        text-decoration: none;
    }
    
    .btn-secondary {
        background-color: #333;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
        text-decoration: none;
    }
    
    .loader {
        width: 48px;
        height: 48px;
        border: 3px solid var(--text-secondary, #888);
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
        border-bottom-color: var(--accent-color, #ff3e00);
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
        color: var(--error, #f44336);
        margin-bottom: 1.5rem;
    }
</style>