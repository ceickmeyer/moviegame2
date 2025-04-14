<!-- Updated routes\game\components\GameBoard.svelte -->
<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import MovieInfo from './MovieInfo.svelte';
    import ReviewCard from './ReviewCard.svelte';
    import GuessInput from './GuessInput.svelte';
    import {
      guessCount,
      maxGuesses,
      feedback,
      displayableClues,
      currentClues
    } from '../store/gameStore';
    
    let backgroundImage = '/letterboxd_backdrops/default.jpg';


    
onMount(async () => {
  try {
    // Fetch the list of backdrop paths from the API
    const response = await fetch('/api/backdrop-images');
    const backdropPaths = await response.json();
    
    if (backdropPaths.length > 0) {
      // Select random image
      const randomIndex = Math.floor(Math.random() * backdropPaths.length);
      backgroundImage = backdropPaths[randomIndex];
      
      console.log("Selected backdrop:", backgroundImage);
      
      // Preload the image
      const img = new Image();
      img.src = backgroundImage;
    }
  } catch (error) {
    console.error("Error loading backdrop:", error);
    backgroundImage = '/letterboxd_backdrops/default.jpg';
  }
});
    
    $: guessesRemaining = $maxGuesses - $guessCount;
    $: guessesArray = Array.from({ length: $maxGuesses }, (_, i) => i < $guessCount);
</script>

<div class="game-board" in:fade={{ duration: 300 }}>
    <!-- Fixed backdrop with faded edges -->
    <div class="backdrop-container">
        <div class="faded faded-bottom faded-all faded-sides">
            <img src={backgroundImage} alt="Movie Game Backdrop" class="backdrop-image" />
        </div>
    </div>
    
    <!-- Scrollable game content on top of backdrop -->
    <div class="game-content">
        <img src="/logo.png" alt="Movie Game Logo" class="logo" />
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
        
        <!-- Movie Information -->
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
</div>

<style>
    .game-board {
        position: relative;
        width: 100%;
        
        background-color: #14181c;
        color: #fff;
        overflow-x: hidden;
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
        filter: brightness(1); /* Makes the image slightly darker */
    }
    
    /* Dark overlay for backdrop */
    .faded::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(20, 24, 28, 0.5); /* Adds a slight dark tint */
        z-index: 1;
        pointer-events: none; /* Allows clicks to pass through */
    }
    
    /* Game content that scrolls over the backdrop */
    .game-content {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    .section-title {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
    }
    
    .reviews-section, 
    .guessing-section {
        margin-bottom: 2rem;
    }
    
    .no-reviews {
        padding: 2rem;
        text-align: center;
        color: #aaa;
        font-style: italic;
        background-color: rgba(44, 52, 64, 0.8);
        border-radius: 8px;
    }
    
    /* Styles for guesses counter */
    .guesses-counter {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 1.5rem auto;
        padding: 1rem;
        max-width: 400px;
        background-color: rgba(20, 24, 28, 0.7);
        border-radius: 8px;
        backdrop-filter: blur(5px);
    }
    
    .guess-dots {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }
    
    .guess-dot {
        width: 24px;
        height: 24px;
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
        font-size: 1.1rem;
        font-weight: 500;
        color: #fff;
    }
    
    .logo {
        display: block;
        margin: 0 auto; /* Centers the image horizontally */
        max-width: 500px; /* Set an appropriate max-width */
        height: auto; /* Maintain aspect ratio */
    }

    .feedback {
        margin-top: 1rem;
        padding: 1rem;
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
    padding: 0.75rem;
  }
  
  .guess-dots {
    gap: 0.5rem;
  }
  
  .guess-dot {
    width: 18px;
    height: 18px;
  }
  
  .guesses-remaining-text {
    font-size: 0.9rem;
  }
  
  .logo {
    max-width: 320px;
  }
  
  .reviews-section,
  .guessing-section {
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .backdrop-image {
    height: 100vh;
    object-fit: cover;
    object-position: top;
  }
  
  .guess-dot {
    width: 16px;
    height: 16px;
  }
  
  .review-card {
    padding: 1.25rem 1rem;
  }
  
  .review-text {
    font-size: 1rem;
    line-height: 1.5;
    padding-top: 2.5rem;
    max-width: 100%;
  }
}

    
    /* Additional side fades for harder edge control */
    .faded.faded-sides:after {
        box-shadow: 
            inset 100px -100px 100px 50px #14181c,  /* Left edge */
            inset -100px 0px 100px 50px #14181c; /* Right edge */
    }
</style>