<script>
  import {
    guessInput,
    filteredMovies,
    showDropdown,
    handleGuessInput,
    selectMovie,
    submitGuess
  } from '../store/gameStore';
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      submitGuess();
    }
  }
  
  // Identify movies with duplicate titles
  $: moviesWithDuplicateTitles = findDuplicateTitles($filteredMovies);
  
  // Find movies with the same title
  function findDuplicateTitles(movies) {
    // First, group movies by title
    const titleGroups = {};
    movies.forEach(movie => {
      const title = movie.title.toLowerCase().trim();
      if (!titleGroups[title]) {
        titleGroups[title] = [];
      }
      titleGroups[title].push(movie);
    });
    
    // Identify titles with more than one movie
    const duplicateTitles = {};
    Object.entries(titleGroups).forEach(([title, moviesWithTitle]) => {
      if (moviesWithTitle.length > 1) {
        duplicateTitles[title] = true;
      }
    });
    
    return duplicateTitles;
  }
  
  // Check if a movie needs its year displayed
  function shouldShowYear(movie) {
    const normalizedTitle = movie.title.toLowerCase().trim();
    return !!moviesWithDuplicateTitles[normalizedTitle];
  }
</script>

<div class="guess-input-container">
  <div class="input-with-button">
    <input
      type="text"
      placeholder="Type a movie title..."
      bind:value={$guessInput}
      on:input={() => handleGuessInput($guessInput)}
      on:focus={() => handleGuessInput($guessInput)}
      on:blur={() => setTimeout(() => ($showDropdown = false), 200)}
      on:keypress={handleKeyPress}
    />
    
    <button class="btn-primary" on:click={submitGuess}>
      Guess
    </button>
  </div>
  
  {#if $showDropdown && $filteredMovies.length > 0}
    <div class="dropdown" role="listbox">
      {#each $filteredMovies as movie}
        <div
          class="dropdown-item"
          role="option"
          aria-selected="false"
          tabindex="0"
          on:mousedown={() => selectMovie(movie)}
          on:keydown={(e) => e.key === 'Enter' && selectMovie(movie)}
        >
          <span class="movie-title">{movie.title}</span>
          {#if shouldShowYear(movie)}
            <span class="movie-year">({movie.year})</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .guess-input-container {
    position: relative;
    width: 100%;
  }

  .input-with-button {
    display: flex;
  }
  
  input {
    flex: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid #ccc;
    color: #333;
    font-size: 1rem;
  }
  
  button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: rgba(44, 52, 64, 0.95);
    backdrop-filter: blur(5px);
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
  }
  
  .dropdown-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s;
  }
  
  .dropdown-item:hover,
  .dropdown-item:focus {
    background-color: rgba(33, 150, 243, 0.2);
    outline: none;
  }
  
  .movie-title {
    font-weight: 500;
  }
  
  .movie-year {
    color: #aaa;
    margin-left: 0.5rem;
    font-size: 0.9rem;
  }
</style>