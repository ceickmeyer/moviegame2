<!-- routes\game\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import GameBoard from './components/GameBoard.svelte';
    import GameResult from './components/GameResult.svelte';
    import {
        gameState,
        loadGameData,
        startNewGame,
        isLoading,
        currentMovie,
        currentClues
    } from './store/gameStore';
    import './styles/letterboxd.css';
    import type { PageData } from './$types';
    
    // Define interfaces for the data structure
    interface Clue {
      id: string;
      movie_id: string;
      movie_title: string;
      movie_year: string | number;
      clue_text: string;
      approved_at: string;
      rating?: number;
      is_liked?: boolean;
      reviewer?: string;
      review_url?: string;
    }
    
    interface ProcessedClue {
      id: string;
      movieId: string;
      movieTitle: string;
      movieYear: string | number;
      clueText: string;
      approvedAt: string;
      rating?: number;
      is_liked?: boolean;
      reviewer?: string;
      reviewUrl?: string;
    }
    
    interface ClueGroups {
      short: ProcessedClue[];
      medium: ProcessedClue[];
      long: ProcessedClue[];
    }
    
    export let data: PageData;
    
    let error: string | null = data.error || null;
    let backdropPaths: string[] = data.backdropPaths || [];
    
    onMount(async () => {
      try {
        // Load minimal game data from localStorage
        await loadGameData();
        
        // If we have server-side data, use it directly instead of making API calls
        if (data.todayMovie && data.clues) {
          // Set the current movie from server data
          currentMovie.set(data.todayMovie);
          
          // Process and set the clues
          if (data.clues.length > 0) {
            // Transform clues to expected format if needed
            const processedClues: ProcessedClue[] = data.clues.map((clue: Clue) => ({
              id: clue.id,
              movieId: clue.movie_id,
              movieTitle: clue.movie_title,
              movieYear: clue.movie_year,
              clueText: clue.clue_text,
              approvedAt: clue.approved_at,
              rating: clue.rating,
              is_liked: clue.is_liked,
              reviewer: clue.reviewer,
              reviewUrl: clue.review_url
            }));
            
            // Sort clues by length as in the original code
            const cluesByLength: ClueGroups = processedClues.reduce(
              (groups: ClueGroups, clue: ProcessedClue) => {
                const textLength = clue.clueText.length;
                
                if (textLength < 100) {
                  groups.short.push(clue);
                } else if (textLength < 200) {
                  groups.medium.push(clue);
                } else {
                  groups.long.push(clue);
                }
                
                return groups;
              },
              {
                short: [],
                medium: [],
                long: []
              }
            );
            
            // Shuffle and combine
            const shuffleArray = <T>(array: T[]): T[] => {
              const newArray = [...array];
              for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
              }
              return newArray;
            };
            
            const shuffledShort = shuffleArray(cluesByLength.short);
            const shuffledMedium = shuffleArray(cluesByLength.medium);
            const shuffledLong = shuffleArray(cluesByLength.long);
            
            // Set the sorted clues
            currentClues.set([...shuffledShort, ...shuffledMedium, ...shuffledLong]);
          }
          
          // Reset loading state
          isLoading.set(false);
        } else {
          // Fallback to API calls if server data is missing
          await startNewGame();
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load game data';
        isLoading.set(false);
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
            <GameBoard backdropPaths={backdropPaths} />
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