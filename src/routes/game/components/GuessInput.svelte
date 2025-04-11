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
            <span class="movie-year">({movie.year})</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style>
    .input-with-button {
      display: flex;
    }
    
    input {
      flex: 1;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  </style>