<!-- routes\game\components\GameResult.svelte -->
<script lang="ts">
    import { fly } from 'svelte/transition';
    import {
      gameState,
      currentMovie,
      guessCount,
      maxGuesses,
      startNewGame,
      preloadedPoster,
      gameHistory,
      stats
    } from '../store/gameStore';
    import { onMount } from 'svelte';
    
    $: isSuccess = $gameState === 'success';
    $: movie = $currentMovie;
    $: correctGuess = movie && isSuccess;
    let imageLoadError = false;
    let shareMessage = '';
    let showShareMessage = false;
    let timeUntilNextMovie = '';
    let countdownInterval: ReturnType<typeof setInterval>;
    
    // Calculate time until next movie (midnight)
    function updateCountdown() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      
      // Format as hours:minutes:seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      timeUntilNextMovie = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    onMount(() => {
      // Update countdown immediately
      updateCountdown();
      
      // Update countdown every second
      countdownInterval = setInterval(updateCountdown, 1000);
      
      // Clean up interval on component destruction
      return () => {
        clearInterval(countdownInterval);
      };
    });
    
    // Use the original rating, not halved
    function getLetterboxdRating(rating: number | string | null | undefined): string {
      if (rating === null || rating === undefined) return '–';
      
      // Convert to number if it's not already
      const numRating = typeof rating === 'number' ? rating : Number(rating);
      
      // Check if the conversion resulted in a valid number
      if (isNaN(numRating)) return '–';
      
      // This is the movie's overall rating (0-5 scale), so no need to halve
      return numRating.toFixed(1);
    }

    // Get the poster image path
    function getPosterPath(movie: any): string | null {
      if (!movie) return null;
      // Convert movie title to filename format
      const titleFormatted = movie.title.replace(/\s+/g, '_').replace(/[^\w\-]/g, '_');
      const year = movie.year;
      return `/posters/${titleFormatted}_${year}.jpg`;
    }
    
    // Handle image load error
    function handleImageError() {
      imageLoadError = true;
    }
    
    // Get a simple numeric game ID for display
    function getGameId() {
      // Use the current date to generate a consistent game number
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      
      // Create a simple numeric ID based on the date
      // This will be consistent for all users on the same day
      return (year * 10000) + (month * 100) + day;
    }
    
    // Generate share text for results
    function generateShareText() {
      if (!movie) return '';
      
      // Get a consistent game ID based on the date
      const gameId = getGameId();
      
      // Game name and ID
      let shareText = `Pizza Movie #${gameId}\n`;
      
      // Generate the emoji grid showing guesses
      // 🟥 - incorrect guess
      // 🟩 - correct guess
      // ⬛ - unused guess
      const totalGuesses = $maxGuesses;
      const usedGuesses = $guessCount;
      const emojis = [];
      
      // If they got it right, the last guess is correct (green)
      if (isSuccess) {
        // Add red squares for all incorrect guesses
        for (let i = 0; i < usedGuesses - 1; i++) {
          emojis.push('🟥');
        }
        // Add green square for the correct guess
        emojis.push('🟩');
      } else {
        // All guesses were incorrect
        for (let i = 0; i < usedGuesses; i++) {
          emojis.push('🟥');
        }
      }
      
      // Add black squares for remaining unused guesses
      for (let i = emojis.length; i < totalGuesses; i++) {
        emojis.push('⬛');
      }
      
      // Add the emoji grid to the share text
      shareText += emojis.join(' ') + '\n';
      // Add a URL to the game
      shareText += `https://moviegame2.vercel.app/game`;
      
      return shareText;
    }
    
    // Copy share text to clipboard
    async function shareResults() {
      const shareText = generateShareText();
      
      try {
        await navigator.clipboard.writeText(shareText);
        
        // Show success message
        shareMessage = 'Results copied to clipboard!';
        showShareMessage = true;
        
        // Hide message after 3 seconds
        setTimeout(() => {
          showShareMessage = false;
        }, 3000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        
        // Show error message
        shareMessage = 'Failed to copy. Try again.';
        showShareMessage = true;
        
        // Hide message after 3 seconds
        setTimeout(() => {
          showShareMessage = false;
        }, 3000);
      }
    }
    
    // Use the preloaded poster if available, otherwise fall back to generating the path
    $: posterSrc = $preloadedPoster || (movie ? getPosterPath(movie) : null);
  </script>
  
  <div class="game-result" in:fly={{ y: 30, duration: 300 }}>
    <div class="result-header">
      <h2 class={isSuccess ? 'success' : 'error'}>
        {isSuccess ? 'You got it!' : 'Game Over'}
      </h2>
      
      <p class="result-message">
        {#if isSuccess}
          You correctly guessed the movie in {$guessCount} {$guessCount === 1 ? 'try' : 'tries'}!
        {:else}
          You've used all your guesses. The movie was:
        {/if}
      </p>
    </div>
    
    {#if movie}
      <div class="movie-result">
        <div class="movie-poster">
          <!-- Use the preloaded poster image -->
          {#if !imageLoadError && posterSrc}
            <img 
              src={posterSrc} 
              alt={movie.title}
              on:error={handleImageError}
            />
          {/if}
          
          {#if imageLoadError || !posterSrc}
            <div class="poster-placeholder">
              <div>{movie.title}</div>
            </div>
          {/if}
        </div>
        
        <div class="movie-details">
          <h3 class="movie-title">{movie.title} <span class="movie-year">({movie.year})</span></h3>
          
          <div class="movie-meta">
            {#if movie.director}
              <div>Directed by <span class="text-bright">{movie.director}</span></div>
            {/if}
            
            {#if movie.actors && movie.actors.length > 0}
              <div class="mt-2">Starring <span class="text-bright">{movie.actors.slice(0, 3).join(', ')}{movie.actors.length > 3 ? '...' : ''}</span></div>
            {/if}
          </div>
          
          {#if movie.genres && movie.genres.length > 0}
            <div class="movie-genres">
              {#each movie.genres as genre}
                <span class="tag">{genre}</span>
              {/each}
            </div>
          {/if}
          
          <div class="movie-stats">
            {#if movie.rating}
              <div class="movie-stat">
                <span class="stat-icon">★</span>
                <span>{getLetterboxdRating(movie.rating)}</span>
              </div>
            {/if}
            
            {#if movie.watchCount}
              <div class="movie-stat">
                <span class="stat-icon">👁️</span>
                <span>{movie.watchCount.toLocaleString()}</span>
              </div>
            {/if}
            
            {#if movie.likeCount}
              <div class="movie-stat">
                <span class="stat-icon">❤️</span>
                <span>{movie.likeCount.toLocaleString()}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Player Stats Section -->
      <div class="player-stats">
        <h3>Your Stats</h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{$stats.played}</div>
            <div class="stat-label">Games Played</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">
              {$stats.played > 0 ? Math.round(($stats.won / $stats.played) * 100) : 0}%
            </div>
            <div class="stat-label">Win Rate</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">{$stats.avgGuesses.toFixed(1)}</div>
            <div class="stat-label">Avg. Guesses</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">{$stats.streak}</div>
            <div class="stat-label">Current Streak</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">{$stats.bestStreak}</div>
            <div class="stat-label">Best Streak</div>
          </div>
        </div>
        
        <!-- Countdown to next movie -->
        <div class="next-movie-countdown">
          <h4>Next Movie In</h4>
          <div class="countdown-timer">{timeUntilNextMovie}</div>
        </div>
      </div>
    {/if}
    
    <div class="actions">
      <button class="btn-primary" on:click={startNewGame}>
        Play Again
      </button>
      <button class="btn-share" on:click={shareResults}>
        Share Results
      </button>
    </div>
    
    {#if showShareMessage}
      <div class="share-message" in:fly={{ y: 20, duration: 200 }}>
        {shareMessage}
      </div>
    {/if}
  </div>
  
  <style>
    .game-result {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #14181c;
      color: #fff;
      padding: 2rem 1rem;
    }
    
    .result-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    h2.success {
      color: #4CAF50;
    }
    
    h2.error {
      color: #f44336;
    }
    
    .result-message {
      font-size: 1.2rem;
      margin-top: 0.5rem;
      color: #aaa;
    }
    
    .movie-result {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      width: 100%;
      max-width: 600px;
    }
    
    .movie-poster {
      width: 180px;
      height: 270px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    }
    
    .movie-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .poster-placeholder {
      width: 100%;
      height: 100%;
      background-color: #2c3440;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1rem;
      font-weight: 500;
      color: #fff;
    }
    
    .movie-details {
      flex: 1;
    }
    
    .movie-title {
      font-size: 1.5rem;
      margin: 0 0 0.75rem 0;
      color: #fff;
    }
    
    .movie-year {
      font-weight: normal;
      color: #aaa;
    }
    
    .movie-meta {
      margin-bottom: 1rem;
      color: #ddd;
    }
    
    .text-bright {
      color: #fff;
      font-weight: 500;
    }
    
    .movie-genres {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    
    .tag {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.3rem 0.8rem;
      border-radius: 2rem;
      font-size: 0.8rem;
    }
    
    .movie-stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .movie-stat {
      display: flex;
      align-items: center;
      color: #aaa;
    }
    
    .stat-icon {
      margin-right: 0.5rem;
    }
    
    .actions {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
      gap: 1rem;
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
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
    }
    
    .btn-share {
      background-color: #2196F3;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .btn-share:hover {
      background-color: #1976D2;
      transform: translateY(-2px);
    }
    
    .share-message {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      color: white;
      font-weight: 500;
    }
    
    /* Player Stats Section */
    .player-stats {
      width: 100%;
      max-width: 600px;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .player-stats h3 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: #fff;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .stat-item {
      padding: 0.75rem;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
    
    .stat-value {
      font-size: 1.5rem;
      color: var(--accent-color, #ff3e00);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #aaa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Countdown Section */
    .next-movie-countdown {
      text-align: center;
      margin-top: 1.5rem;
    }
    
    .next-movie-countdown h4 {
      font-size: 1rem;
      color: #aaa;
      margin-bottom: 0.5rem;
    }
    
    .countdown-timer {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      font-family: monospace;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      display: inline-block;
    }
    
    .mt-2 {
      margin-top: 0.5rem;
    }
    
    @media (max-width: 600px) {
      .movie-result {
        flex-direction: column;
        align-items: center;
      }
      
      .movie-poster {
        margin-bottom: 1rem;
      }
      
      .actions {
        flex-direction: column;
        width: 100%;
        max-width: 300px;
      }
      
      .btn-primary, .btn-share {
        width: 100%;
      }
    }
  </style>

