<!-- routes\review-selector\+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { extractSentences, redactSensitiveInfo } from '$lib/utils/sentenceExtractor';
    import type { Movie } from '$lib/utils/sentenceExtractor';
    import type { ApprovedClue } from '$lib/types/clueTypes';
    
    export let data: {
      movies: Movie[];
      approvedCount: number;
      rejectedCount: number;
      error?: string;
    };
    
    // State management
    let currentMovieIndex = 0;
    let movieReviews: {
  reviewText: string;
  parsedSentences: {
    original: string;
    redacted: string;
    selected: boolean;
    hash: string;
    isApproved: boolean;
    startIndex: number;
    endIndex: number;
    rating?: number;
    is_liked?: boolean;
    reviewer?: string;  // Add this
    reviewUrl?: string; // Add this
  }[];
  rating?: number;
  is_liked?: boolean;
  reviewer?: string;    // Add this
  reviewUrl?: string;   // Add this
}[] = [];
    
let selectedSentences: Map<string, {
  text: string;
  movieId: string;
  movieTitle: string;
  movieYear: string | number;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string;  // Add this
  reviewUrl?: string; // Add this
}> = new Map();
    
    let hoveredSentenceHash: string | null = null;
    let savingInProgress = false;
    let approvedCount = data.approvedCount;
    let loadingReviews = true;
    
    // Store existing approved clues to show already selected sentences
    let approvedCluesMap: Map<string, boolean> = new Map();
    
    // Random starting point instead of always the first movie
    function initializeRandomMovie() {
      if (data.movies && data.movies.length > 0) {
        currentMovieIndex = Math.floor(Math.random() * data.movies.length);
        loadMovieReviews();
      }
    }
    
    onMount(async () => {
      try {
        // Load approved clues to know which sentences are already selected
        // Use the API endpoint that knows the correct path
        const approvedResponse = await fetch('/api/clues-data?type=approved');
        const approvedClues: ApprovedClue[] = await approvedResponse.json();
        
        // Create lookup map for approved clues
        approvedClues.forEach((clue) => {
          approvedCluesMap.set(generateSentenceHash(clue.movieId, clue.clueText), true);
        });
        
        initializeRandomMovie();
      } catch (error) {
        console.error('Error loading approved clues:', error);
        if (data.movies && data.movies.length > 0) {
          loadMovieReviews();
        }
      }
    });
    
    // Generate a hash for a sentence to uniquely identify it
    function generateSentenceHash(movieId: string, sentenceText: string): string {
  // Use the entire sentence text for the hash instead of just the first 50 characters
  return `${movieId}:${sentenceText}`;
}

// Replace this function in routes/review-selector/+page.svelte
async function loadMovieReviews() {
  loadingReviews = true;
  movieReviews = [];
  selectedSentences.clear();
  hoveredSentenceHash = null;
  
  try {
    if (!data.movies || data.movies.length === 0) {
      loadingReviews = false;
      return;
    }
    
    const movie = data.movies[currentMovieIndex];
    console.log("Current movie:", movie.title);
    console.log("Movie ID type:", typeof movie.id);
    console.log("Movie ID value:", movie.id);
    
    let hasProcessedReviews = false;
    
    // First, check if movie already has reviews
    if (movie.reviews && movie.reviews.length > 0) {
      console.log(`Movie has ${movie.reviews.length} existing reviews`);
      
      // Process existing reviews
      for (const review of movie.reviews) {
        if (!review.text) continue;
        
        const sentences = extractSentences(review.text);
        console.log(`Extracted ${sentences.length} sentences from review`);
        
        const parsedSentences = sentences.map((sentence, index) => {
          const redactedSentence = redactSensitiveInfo(sentence, movie);
          const hash = generateSentenceHash(movie.id, redactedSentence);
          
          return {
            original: sentence,
            redacted: redactedSentence,
            selected: false,
            hash: hash,
            isApproved: approvedCluesMap.has(hash),
            startIndex: index,
            endIndex: index,
            rating: review.rating,
            is_liked: review.is_liked,
            reviewer: review.author,
            reviewUrl: review.url
          };
        });
        
        if (parsedSentences.length > 0) {
          movieReviews.push({
            reviewText: review.text,
            parsedSentences,
            rating: review.rating,
            is_liked: review.is_liked,
            reviewer: review.author,
            reviewUrl: review.url
          });
          hasProcessedReviews = true;
        }
      }
    }
    
    // If no reviews were found or processed, try to fetch them directly
    if (!hasProcessedReviews) {
      console.log("No existing reviews found, trying direct API fetch...");
      const movieId = movie.id;
      
      try {
        // Direct API call to get reviews for the current movie
        const response = await fetch(`/api/movie-reviews?movieId=${movieId}&_=${Date.now()}`);
        if (response.ok) {
          const reviewsData = await response.json();
          console.log(`API returned ${reviewsData.length} reviews for movie ${movieId}`);
          
          if (reviewsData && reviewsData.length > 0) {
            // Process each review
            for (const review of reviewsData) {
              // Skip empty reviews
              if (!review.text) continue;
              
              const sentences = extractSentences(review.text);
              console.log(`Extracted ${sentences.length} sentences from review`);
              
              const parsedSentences = sentences.map((sentence, index) => {
                const redactedSentence = redactSensitiveInfo(sentence, movie);
                const hash = generateSentenceHash(movieId, redactedSentence);
                
                return {
                  original: sentence,
                  redacted: redactedSentence,
                  selected: false,
                  hash: hash,
                  isApproved: approvedCluesMap.has(hash),
                  startIndex: index,
                  endIndex: index,
                  rating: review.rating,
                  is_liked: review.is_liked,
                  reviewer: review.author,
                  reviewUrl: review.url
                };
              });
              
              if (parsedSentences.length > 0) {
                movieReviews.push({
                  reviewText: review.text,
                  parsedSentences,
                  rating: review.rating,
                  is_liked: review.is_liked,
                  reviewer: review.author,
                  reviewUrl: review.url
                });
                hasProcessedReviews = true;
              }
            }
          }
        }
      } catch (reviewError) {
        console.error("Error fetching reviews:", reviewError);
      }
    }
    
    console.log(`Processed ${movieReviews.length} reviews with usable sentences`);
    
    if (movieReviews.length === 0) {
      console.warn(`No usable reviews found for movie "${movie.title}"`);
    }
    
  } catch (error) {
    console.error('Error loading movie reviews:', error);
  } finally {
    loadingReviews = false;
  }
}
 
interface ParsedSentence {
  original: string;
  redacted: string;
  selected: boolean;
  hash: string;
  isApproved: boolean;
  startIndex: number;
  endIndex: number;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string;
  reviewUrl?: string;
}

    // Toggle sentence selection
// Toggle sentence selection
function toggleSentenceSelection(sentence, reviewIndex) {
  const sentenceIndex = movieReviews[reviewIndex].parsedSentences.findIndex(s => s.hash === sentence.hash);
  
  if (sentenceIndex !== -1) {
    // Toggle the selection state
    movieReviews[reviewIndex].parsedSentences[sentenceIndex].selected = !movieReviews[reviewIndex].parsedSentences[sentenceIndex].selected;
    
    // Update the selectedSentences map
    if (movieReviews[reviewIndex].parsedSentences[sentenceIndex].selected) {
      const movie = data.movies[currentMovieIndex];
      const movieId = movie.id || `${movie.title}-${movie.year}`;
      
      selectedSentences.set(sentence.hash, {
        text: sentence.redacted,
        movieId,
        movieTitle: movie.title,
        movieYear: movie.year,
        rating: sentence.rating,
        is_liked: sentence.is_liked,
        reviewer: sentence.reviewer,
        reviewUrl: sentence.reviewUrl
      });
    } else {
      selectedSentences.delete(sentence.hash);
    }
    
    // Force Svelte to update
    movieReviews = [...movieReviews];
    selectedSentences = new Map(selectedSentences);
  }
}
    
    // Set hovered sentence
    function setHoveredSentence(hash: string | null) {
      hoveredSentenceHash = hash;
    }
    
    // Save selected sentences to the approved clues
// Save selected sentences to the approved clues
async function saveSelectedSentences() {
  if (selectedSentences.size === 0) return;
  
  savingInProgress = true;
  
  try {
    const movie = data.movies[currentMovieIndex];
    const movieId = movie.id || `${movie.title}-${movie.year}`;
    const sentences = Array.from(selectedSentences.values());
    
    // Log what we're sending to help debug
    console.log("Sending clues to save:", sentences.length, "clues");
    
    const response = await fetch('/api/batch-approve-clues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clues: sentences.map(sentence => ({
          movieId: sentence.movieId,
          movieTitle: sentence.movieTitle,
          movieYear: sentence.movieYear,
          clueText: sentence.text,
          rating: sentence.rating,
          is_liked: sentence.is_liked,
          reviewer: sentence.reviewer,
          reviewUrl: sentence.reviewUrl
        }))
      })
    });
    
    if (!response.ok) {
      console.error("Error response from server:", await response.text());
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Server response:", result);
    
    if (result.success) {
      // Update counts
      approvedCount = result.approvedCount || approvedCount;
      
      // Mark all selected sentences as approved
      movieReviews = movieReviews.map(review => {
        review.parsedSentences = review.parsedSentences.map(sentence => {
          if (sentence.selected) {
            return { ...sentence, isApproved: true };
          }
          return sentence;
        });
        return review;
      });
      
      // Update the approvedCluesMap
      sentences.forEach(sentence => {
        const hash = generateSentenceHash(sentence.movieId, sentence.text);
        approvedCluesMap.set(hash, true);
      });
      
      // Success message
      alert(`Successfully saved ${sentences.length} clues!`);
    } else {
      alert(result.error || 'Error saving clues');
    }
  } catch (error) {
    console.error('Error saving clues:', error);
    alert('Error saving clues: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    savingInProgress = false;
  }
}
    
    // Navigation functions
    function goToNextMovie() {
      if (!data.movies || data.movies.length <= 1) return;
      
      currentMovieIndex = (currentMovieIndex + 1) % data.movies.length;
      
      // Clear the selected sentences when switching movies
      selectedSentences.clear();
      selectedSentences = new Map(); // Force Svelte to update
      
      loadMovieReviews();
    }
    
    function goToPreviousMovie() {
      if (!data.movies || data.movies.length <= 1) return;
      
      currentMovieIndex = (currentMovieIndex - 1 + data.movies.length) % data.movies.length;
      
      // Clear the selected sentences when switching movies
      selectedSentences.clear();
      selectedSentences = new Map(); // Force Svelte to update
      
      loadMovieReviews();
    }
    
    function goToRandomMovie() {
      if (!data.movies || data.movies.length <= 1) return;
      
      // Ensure we get a different movie than the current one
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * data.movies.length);
      } while (randomIndex === currentMovieIndex && data.movies.length > 1);
      
      currentMovieIndex = randomIndex;
      
      // Clear the selected sentences when switching movies
      selectedSentences.clear();
      selectedSentences = new Map(); // Force Svelte to update
      
      loadMovieReviews();
    }
    
    // Computed values
    $: currentMovie = data.movies && data.movies[currentMovieIndex];
    $: selectedSentencesCount = selectedSentences.size;
    $: movieProgress = data.movies?.length ? 
      `Movie ${currentMovieIndex + 1} of ${data.movies.length}` : '';
  </script>
  
  <svelte:head>
    <title>Review Selector</title>
  </svelte:head>
  
  <div class="review-selector">
    <!-- Floating overlay to show selected clue count -->
    <div class="clue-counter-overlay {selectedSentencesCount >= 6 ? 'complete' : selectedSentencesCount > 0 ? 'in-progress' : ''}">
      <div class="counter-content">
        <span class="counter-number">{selectedSentencesCount}</span>
        <span class="counter-label">/ 6 clues selected</span>
      </div>
    </div>
    <header>
      <h1>Interactive Review Selector</h1>
      
      <div class="stats">
        <div class="stat">
          <span>Total Approved:</span>
          <strong>{approvedCount}</strong>
        </div>
        <div class="stat">
          <span>Selected:</span>
          <strong>{selectedSentencesCount}</strong>
        </div>
        <div class="stat">
          <span>{movieProgress}</span>
        </div>
      </div>
    </header>
    
    {#if currentMovie}
      <div class="movie-info">
        <h2>{currentMovie.title} ({currentMovie.year})</h2>
        
        <div class="movie-details">
          {#if currentMovie.director}
            <div class="detail"><span>Director:</span> {currentMovie.director}</div>
          {/if}
          
          {#if currentMovie.actors && currentMovie.actors.length > 0}
            <div class="detail"><span>Cast:</span> {currentMovie.actors.slice(0, 3).join(', ')}{currentMovie.actors.length > 3 ? '...' : ''}</div>
          {/if}
          
          {#if currentMovie.genres && currentMovie.genres.length > 0}
            <div class="detail"><span>Genres:</span> {currentMovie.genres.join(', ')}</div>
          {/if}
        </div>
      </div>
      
      {#if loadingReviews}
        <div class="loading">Loading reviews...</div>
      {:else if movieReviews.length === 0}
        <div class="no-reviews">No reviews available for this movie.</div>
      {:else}
        <div class="reviews-container">
          <h3>Reviews</h3>
          <p class="instructions">Click on any sentence to select/deselect it as a clue</p>
          
          {#each movieReviews as review, reviewIndex}
            <div class="review">
              <div class="review-meta">
                {#if review.rating !== undefined}
                  <div class="meta-item rating">
                    <span class="meta-icon">★</span>
                    <span>{(review.rating/2).toFixed(1)}</span>
                  </div>
                {/if}
                
                {#if review.is_liked}
                  <div class="meta-item liked">
                    <span class="meta-icon">♥</span>
                  </div>
                {/if}
              </div>
              
              <div class="review-text">
                {#each review.parsedSentences as sentence}
                <span
                class="sentence {sentence.selected ? 'selected' : ''} {hoveredSentenceHash === sentence.hash ? 'hovered' : ''} {sentence.isApproved ? 'approved' : ''}"
                role="button"
                tabindex="0"
                on:click={() => toggleSentenceSelection(sentence, reviewIndex)}
                on:keydown={(e) => e.key === 'Enter' && toggleSentenceSelection(sentence, reviewIndex)}
                on:mouseenter={() => setHoveredSentence(sentence.hash)}
                on:mouseleave={() => setHoveredSentence(null)}
              >
                {sentence.redacted}
              </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="selected-sentences">
          <h3>Selected Sentences ({selectedSentencesCount})</h3>
          
          {#if selectedSentencesCount > 0}
            <ul>
              {#each Array.from(selectedSentences.entries()) as [hash, sentence]}
                <li>
                  <div class="selected-text">{sentence.text}</div>
                  <button class="remove-btn" on:click={() => {
                    // Find and deselect this sentence in the reviews
                    let found = false;
                    for (let i = 0; i < movieReviews.length && !found; i++) {
                      const sentenceIndex = movieReviews[i].parsedSentences.findIndex(s => s.hash === hash);
                      if (sentenceIndex !== -1) {
                        toggleSentenceSelection(movieReviews[i].parsedSentences[sentenceIndex], i);
                        found = true;
                      }
                    }
                  }}>Remove</button>
                </li>
              {/each}
            </ul>
            
            <button 
              class="save-btn {savingInProgress ? 'saving' : ''}" 
              on:click={saveSelectedSentences}
              disabled={savingInProgress || selectedSentencesCount === 0}
            >
              {savingInProgress ? 'Saving...' : 'Save Selected Sentences'}
            </button>
          {:else}
            <p class="no-selections">No sentences selected yet. Click on sentences in the reviews above to select them.</p>
          {/if}
        </div>
      {/if}
      
      <div class="navigation">
        <button class="nav-btn" on:click={goToPreviousMovie}>
          ← Previous Movie
        </button>
        <button class="nav-btn" on:click={goToRandomMovie}>
          🔀 Random Movie
        </button>
        <button class="nav-btn" on:click={goToNextMovie}>
          Next Movie →
        </button>
      </div>
    {:else}
      <div class="no-movies">
        <p>No movies available. Please check if your data is properly loaded.</p>
        <a href="/" class="home-link">Return to Home</a>
      </div>
    {/if}
  </div>
  
  <style>
    /* Floating clue counter overlay */
    .clue-counter-overlay {
      position: fixed;
      bottom: 5rem; /* Position above the navigation */
      right: 2rem;
      background-color: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 2rem;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      z-index: 90;
      transition: all 0.3s ease;
    }
    
    .counter-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .counter-number {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .counter-label {
      font-size: 1rem;
    }
    
    /* Change color based on selection count */
    .clue-counter-overlay.in-progress {
      background-color: rgba(255, 152, 0, 0.9); /* Orange for in progress */
    }
    
    .clue-counter-overlay.complete {
      background-color: rgba(76, 175, 80, 0.9); /* Green for complete */
    }
    /* Main container */
    .review-selector {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  padding-bottom: 5rem; /* Added padding to prevent content from being hidden behind the fixed navigation */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
  color: #333;
  background-color: #f9f9f9;
}
    
    /* Header and title */
    header {
      margin-bottom: 2rem;
    }
    
    h1 {
      margin-bottom: 1rem;
      font-size: 2.2rem;
      color: #222;
    }
    
    /* Stats bar */
    .stats {
      display: flex;
      gap: 2rem;
      font-size: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    
    .stat span {
      color: #555;
      margin-right: 0.5rem;
    }
    
    .stat strong {
      color: #222;
      font-size: 1.1rem;
    }
    
    /* Movie info section */
    .movie-info {
      background-color: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    
    .movie-info h2 {
      margin-top: 0;
      margin-bottom: 1.25rem;
      font-size: 1.8rem;
      color: #222;
    }
    
    .movie-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .detail {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
    
    .detail span {
      font-weight: bold;
      color: #444;
      margin-right: 0.5rem;
    }
    
    /* Reviews section */
    .reviews-container {
      margin-bottom: 2.5rem;
    }
    
    .reviews-container h3 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      color: #222;
    }
    
    .instructions {
      margin-bottom: 1.5rem;
      font-style: italic;
      color: #555;
      background-color: #eaf6ff;
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid #2196F3;
    }
    
    /* Individual review */
    .review {
      background-color: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      position: relative;
    }
    
    .review-meta {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.75rem;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      padding: 0.35rem 0.7rem;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .rating {
      background-color: rgba(0, 192, 48, 0.15);
    }
    
    .rating .meta-icon {
      color: #00c030;
      margin-right: 0.35rem;
    }
    
    .liked {
      background-color: rgba(255, 144, 16, 0.15);
    }
    
    .liked .meta-icon {
      color: #ff9010;
    }
    
    /* Review text and sentences */
    .review-text {
      font-size: 1.15rem;
      line-height: 1.8;
      color: #333;
    }
    
    /* This is the key styling for interactive sentences */
    .sentence {
      cursor: pointer;
      padding: 3px 2px;
      border-radius: 4px;
      transition: all 0.2s ease;
      position: relative;
      display: inline;
    }
    
    /* Hover state - more prominent yellow background */
    .sentence:hover,
    .sentence.hovered {
      background-color: rgba(255, 220, 0, 0.4);
      box-shadow: 0 0 0 2px rgba(255, 220, 0, 0.4);
    }
    
    /* Selected state - blue background with border */
    .sentence.selected {
      background-color: rgba(33, 150, 243, 0.25);
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.25);
    }
    
    /* Approved state - green background */
    .sentence.approved {
      background-color: rgba(76, 175, 80, 0.2);
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    }
    
    /* Selected and previously approved - prioritize selected state */
    .sentence.selected.approved {
      background-color: rgba(33, 150, 243, 0.25);
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.25);
    }
    
    /* Selected sentences section */
    .selected-sentences {
      background-color: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    
    .selected-sentences h3 {
      font-size: 1.5rem;
      margin-top: 0;
      margin-bottom: 1.25rem;
      color: #222;
    }
    
    .selected-sentences ul {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
    }
    
    .selected-sentences li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: #f0f7ff;
      border-radius: 6px;
      margin-bottom: 0.75rem;
      border-left: 4px solid #2196F3;
    }
    
    .selected-text {
      flex: 1;
      margin-right: 1.5rem;
      font-size: 1.1rem;
      line-height: 1.5;
    }
    
    .remove-btn {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .remove-btn:hover {
      background-color: #d32f2f;
    }
    
    /* Save button */
    .save-btn {
      display: block;
      width: 100%;
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    
    .save-btn:hover {
      background-color: #388e3c;
    }
    
    .save-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .save-btn.saving {
      background-color: #999;
    }
    
    .no-selections {
      padding: 1.5rem;
      background-color: #f9f9f9;
      border-radius: 6px;
      font-style: italic;
      color: #555;
      text-align: center;
      font-size: 1.1rem;
    }
    
    /* Fixed navigation styling */
.navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  padding: 1rem 2rem;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-width: 1200px;
  margin: 0 auto;
}

/* Make the buttons more prominent */
.nav-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.2s, transform 0.1s;
}

.nav-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
}

.nav-btn:active {
  transform: translateY(0);
}
    
    /* Other UI elements */
    .loading, .no-reviews, .no-movies {
      background-color: white;
      padding: 3rem 2rem;
      border-radius: 8px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
      margin-bottom: 2rem;
      font-size: 1.2rem;
      color: #555;
    }
    
    .home-link {
      display: inline-block;
      margin-top: 1.5rem;
      background-color: #333;
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .home-link:hover {
      background-color: #444;
    }
    
    /* Media queries for better responsiveness */
    @media (max-width: 768px) {
  .navigation {
    grid-template-columns: repeat(3, 1fr);
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .nav-btn {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .navigation {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .nav-btn {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
}
  </style>