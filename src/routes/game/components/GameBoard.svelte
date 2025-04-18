<!-- routes\game\components\GameBoard.svelte -->
<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import MovieInfo from './MovieInfo.svelte';
    import ReviewCard from './ReviewCard.svelte';
    import GuessInput from './GuessInput.svelte';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import {
      guessCount,
      maxGuesses,
      feedback,
      displayableClues,
      currentClues,
      isLoading,
      revealedInfo,
      phaseConfig,
      currentMovie,
      allPossibleInfo,
      ensureInitialInfo,
      formatArray
    } from '../store/gameStore';
    
    // Accept backdropPaths as a prop
    export let backdropPaths: string[] = [];
    
    let backgroundImage = '/letterboxd_backdrops/default.jpg';
    
    onMount(() => {
      try {
        // Use the provided backdropPaths instead of fetching them
        if (backdropPaths && backdropPaths.length > 0) {
          // Select random image
          const randomIndex = Math.floor(Math.random() * backdropPaths.length);
          backgroundImage = backdropPaths[randomIndex];
          
          // Preload the image
          const img = new Image();
          img.src = backgroundImage;
        }
        
        // Verify we have revealed info at game start
        console.log("Game startup - revealed info count:", $revealedInfo.length);
        
        // If no revealed info, try to initialize it using the exported function
        if ($revealedInfo.length === 0 && $currentMovie) {
          console.warn("No revealed info at game start - attempting to fix");
          ensureInitialInfo(); // Call the function from gameStore
        }
      } catch (error) {
        console.error("Error loading backdrop:", error);
        backgroundImage = '/letterboxd_backdrops/default.jpg';
      }
    });
    
    $: guessesRemaining = $maxGuesses - $guessCount;
    $: guessesArray = Array.from({ length: $maxGuesses }, (_, i) => i < $guessCount);
    
    // Watch for changes to currentMovie and make sure we have revealed info
    $: if ($currentMovie && $revealedInfo.length === 0 && !$isLoading) {
      console.log("Current movie changed but no revealed info - attempting to fix");
      ensureInitialInfo(); // Call the function from gameStore
    }
</script>

<div class="game-board" in:fade={{ duration: 300 }}>
    <!-- Fixed backdrop with faded edges -->
    <div class="backdrop-container">
        <div class="faded faded-bottom faded-all faded-sides">
            <img src={backgroundImage} alt="Movie Game Backdrop" class="backdrop-image" />
        </div>
    </div>
    
    <!-- Loading State -->
    {#if $isLoading}
      <div class="loading-overlay">
        <LoadingSpinner text="Loading today's movie..." />
      </div>
    {:else}
      <!-- Scrollable game content on top of backdrop -->
      <div class="game-content">
          <img src="/logo.png" alt="Movie Game Logo" class="logo" />
          
          <!-- More compact guess counter -->
          <div class="guesses-counter">
              <div class="guess-dots">
                  {#each guessesArray as used, i}
                      <div class="guess-dot {used ? 'used' : ''}"></div>
                  {/each}
              </div>
              <div class="guesses-remaining-text">
                  {guessesRemaining} {guessesRemaining === 1 ? 'guess' : 'guesses'} remaining
              </div>
          </div>
          
          <!-- Movie Information (now with better styling) -->
          <MovieInfo />
          
          <!-- Reviews Section -->
          <div class="reviews-section">
              <h3 class="section-title flex justify-between items-center">
                  <span>Reviews</span>
                  <span class="text-secondary text-sm">
                      {$displayableClues.length} of {$currentClues.length}
                  </span>
              </h3>
              
              {#if $displayableClues.length > 0}
                  {#each $displayableClues as clue, index}
                      <ReviewCard {clue} {index} />
                  {/each}
              {:else}
                  <div class="no-reviews card">
                      <p>No reviews available for this movie.</p>
                  </div>
              {/if}
          </div>
          
          <!-- Guessing Section -->
          <div class="guessing-section">
              <h3 class="section-title">Make Your Guess</h3>
              <GuessInput />
              
              {#if $feedback}
                  <div 
                      class="feedback {$feedback.includes('not correct') ? 'error' : 'success'}" 
                      in:fly={{ y: 20, duration: 300 }}
                  >
                      {$feedback}
                  </div>
              {/if}
          </div>
      </div>
    {/if}
</div>

<style>
    .game-board {
        position: relative;
        width: 100%;
        background-color: #14181c;
        color: #fff;
        overflow-x: hidden;
        min-height: 100vh; /* Ensure board covers full viewport height */
    }
    
    /* Fixed backdrop styling */
    .backdrop-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }
    
    .backdrop-image {
        width: 100%;
        max-width: 1200px;
        height: 675px;
        object-fit: cover;
        object-position: center top;
        filter: brightness(0.85); /* Makes the image darker for better readability */
    }
    
    /* Dark overlay for backdrop */
    .faded::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(20, 24, 28, 0.65); /* Darker tint for better visibility */
        z-index: 1;
        pointer-events: none; /* Allows clicks to pass through */
    }
    
    /* Loading overlay styling */
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(8px);
        background-color: rgba(20, 24, 28, 0.6);
    }
    
    /* Game content that scrolls over the backdrop */
    .game-content {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 850px; /* Slightly narrower for better readability */
        margin: 0 auto;
        padding: 1.5rem;
    }
    
    .section-title {
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
    }
    
    .reviews-section, 
    .guessing-section {
        margin-bottom: 1.5rem;
    }
    
    .no-reviews {
        padding: 1.5rem;
        text-align: center;
        color: #aaa;
        font-style: italic;
        background-color: rgba(44, 52, 64, 0.8);
        border-radius: 8px;
    }
    
    /* Styles for guesses counter - more compact */
    .guesses-counter {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0.75rem auto;
        padding: 0.6rem;
        max-width: 320px;
        background-color: rgba(20, 24, 28, 0.7);
        border-radius: 8px;
        backdrop-filter: blur(5px);
    }
    
    .guess-dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .guess-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: rgba(44, 52, 64, 0.8);
        border: 2px solid #202830;
        transition: all 0.2s ease;
    }
    
    .guess-dot.used {
        background-color: var(--accent-color, #ff3e00);
        border-color: var(--accent-color, #ff3e00);
        transform: scale(0.85);
    }
    
    .guesses-remaining-text {
        font-size: 0.9rem;
        font-weight: 500;
        color: #fff;
    }
    
    .logo {
        display: block;
        margin: 0 auto; /* Centers the image horizontally */
        max-width: 260px; /* Smaller, more compact logo */
        height: auto; /* Maintain aspect ratio */
        margin-bottom: 0.75rem;
    }

    .feedback {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 6px;
    }
    
    .feedback.error {
        background-color: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
    }
    
    .feedback.success {
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
    }
    
    .text-secondary {
        color: #aaa;
    }
    
    .text-sm {
        font-size: 0.875rem;
    }
    
    .flex {
        display: flex;
    }
    
    .justify-between {
        justify-content: space-between;
    }
    
    .items-center {
        align-items: center;
    }
    
    /* Faded effect styling */
    .faded {
        position: relative;
        display: block;
        color: #14181c;
    }
    
    .faded:after {
        content: "";
        position: absolute;
        display: block;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-collapse: separate;
    }
    
@media (max-width: 768px) {
  .game-content {
    padding: 1rem;
  }
  
  .guesses-counter {
    max-width: 100%;
    padding: 0.5rem;
  }
  
  .guess-dots {
    gap: 0.4rem;
  }
  
  .guess-dot {
    width: 16px;
    height: 16px;
  }
  
  .guesses-remaining-text {
    font-size: 0.8rem;
  }
  
  .logo {
    max-width: 200px;
  }
  
  .reviews-section,
  .guessing-section {
    margin-bottom: 1.25rem;
  }
  
  .section-title {
    font-size: 0.95rem;
    margin-bottom: 0.6rem;
  }
}

@media (max-width: 480px) {
  .backdrop-image {
    height: 100vh;
    object-fit: cover;
    object-position: top;
  }
  
  .guess-dot {
    width: 14px;
    height: 14px;
  }
  
  .logo {
    max-width: 180px;
  }
}
    
    /* Additional side fades for harder edge control */
    .faded.faded-sides:after {
        box-shadow: 
            inset 100px -100px 100px 50px #14181c,  /* Left edge */
            inset -100px 0px 100px 50px #14181c; /* Right edge */
    }
</style>