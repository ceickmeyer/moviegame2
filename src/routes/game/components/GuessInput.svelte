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
    max-width: 600px;
    margin: 0 auto;
  }

  .input-with-button {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  input {
    flex: 1;
    padding: 0.9rem 1.2rem;
    background-color: rgba(255, 255, 255, 0.95);
    border: none;
    color: #333;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  input:focus {
    outline: none;
    background-color: white;
    box-shadow: 0 0 0 2px rgba(255, 62, 0, 0.3);
  }
  
  button {
    padding: 0 1.5rem;
    background-color: var(--accent-color, #ff3e00);
    border: none;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1rem;
  }
  
  button:hover {
    background-color: #e83700;
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: rgba(44, 52, 64, 0.97);
    backdrop-filter: blur(10px);
    border-radius: 0 0 8px 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    margin-top: 2px;
  }
  
  .dropdown-item {
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    color: #fff;
    border-left: 3px solid transparent;
    transition: all 0.15s ease;
  }
  
  .dropdown-item:hover,
  .dropdown-item:focus {
    background-color: rgba(33, 150, 243, 0.2);
    border-left-color: var(--accent-color, #ff3e00);
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

  @media (max-width: 480px) {
    input {
      padding: 0.8rem 1rem;
      font-size: 0.9rem;
    }
    
    button {
      padding: 0 1.2rem;
      font-size: 0.9rem;
    }
    
    .dropdown-item {
      padding: 0.7rem 1rem;
    }
  }
</style>