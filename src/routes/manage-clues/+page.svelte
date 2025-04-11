<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApprovedClue } from '$lib/types/clueTypes';
    import type { Movie } from '$lib/utils/sentenceExtractor';
    
    let approvedClues: ApprovedClue[] = [];
    let loading = true;
    let searchTerm = '';
    let moviesMap: Record<string, Movie> = {};
    let editingClue: ApprovedClue | null = null;
    let editedText = '';
    
    onMount(async () => {
      try {
        // Load approved clues using the API endpoint
        const approvedResponse = await fetch('/api/clues-data?type=approved');
        approvedClues = await approvedResponse.json();
        
        // Load movie data using the API endpoint
        try {
          const moviesResponse = await fetch('/api/clues-data?type=movies');
          const movies: Movie[] = await moviesResponse.json();
          
          // Create a map of movie IDs to movie objects for quick lookup
          moviesMap = movies.reduce<Record<string, Movie>>((map, movie) => {
            map[movie.id || `${movie.title}-${movie.year}`] = movie;
            return map;
          }, {});
        } catch (error) {
          console.error('Error loading movies:', error);
        }
        
        loading = false;
      } catch (error) {
        console.error('Error loading clues:', error);
        loading = false;
      }
    });
    
    // Start editing a clue
    function startEditing(clue: ApprovedClue): void {
      editingClue = clue;
      editedText = clue.clueText;
    }
    
    // Cancel editing
    function cancelEditing(): void {
      editingClue = null;
      editedText = '';
    }
    
    // Save edited clue
    async function saveEditedClue(): Promise<void> {
      if (!editingClue) return;
      
      try {
        const response = await fetch('/api/update-clue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: editingClue.id,
            clueText: editedText
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Update the local state
          approvedClues = approvedClues.map(clue => 
            clue.id === editingClue?.id 
              ? { ...clue, clueText: editedText } 
              : clue
          );
          
          // Reset editing state
          editingClue = null;
          editedText = '';
        } else {
          alert(result.error || 'Failed to update clue');
        }
      } catch (error) {
        console.error('Error updating clue:', error);
        alert('Error updating clue');
      }
    }
    
    // Filter clues based on search term
    $: filteredClues = (() => {
      let clues = [...approvedClues];
      
      // Apply search filter if there is a search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        clues = clues.filter(clue => 
          clue.movieTitle?.toLowerCase().includes(term) || 
          clue.clueText?.toLowerCase().includes(term)
        );
      }
      
      // Sort by movie title
      return clues.sort((a, b) => a.movieTitle.localeCompare(b.movieTitle));
    })();
    
    // Get movie details for a clue
    function getMovieDetails(movieId: string): Movie {
      return moviesMap[movieId] || { title: 'Unknown Movie', year: 0 };
    }
</script>

<svelte:head>
  <title>Manage Clues</title>
</svelte:head>

<div class="container">
  <h1>Manage Movie Clues</h1>
  
  <div class="filters">
    <div class="search-box">
      <input 
        type="text" 
        placeholder="Search by movie title or clue text..." 
        bind:value={searchTerm}
      />
    </div>
  </div>
  
  {#if loading}
    <p class="loading">Loading clues...</p>
  {:else}
    <div class="clues-count">
      Showing {filteredClues.length} clues
    </div>
    
    <div class="clues-table">
      <table>
        <thead>
          <tr>
            <th>Movie</th>
            <th>Clue Text</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredClues as clue (clue.id)}
            <tr>
              <td class="movie-cell">
                <div class="movie-title">{clue.movieTitle}</div>
                <div class="movie-year">{clue.movieYear}</div>
              </td>
              <td class="clue-cell">
                {#if editingClue && editingClue.id === clue.id}
                  <textarea 
                    bind:value={editedText} 
                    rows="3" 
                    class="edit-textarea"
                  ></textarea>
                {:else}
                  {clue.clueText}
                {/if}
              </td>
              <td class="action-cell">
                {#if editingClue && editingClue.id === clue.id}
                  <div class="edit-actions">
                    <button class="save-btn" on:click={saveEditedClue}>Save</button>
                    <button class="cancel-btn" on:click={cancelEditing}>Cancel</button>
                  </div>
                {:else}
                  <button class="edit-btn" on:click={() => startEditing(clue)}>
                    Edit
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
          
          {#if filteredClues.length === 0}
            <tr>
              <td colspan="3" class="no-results">
                No clues found matching your criteria
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
  
  <div class="navigation">
    <a href="/review-selector" class="nav-link">Back to Review Tool</a>
    <a href="/" class="nav-link">Home</a>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  h1 {
    margin-bottom: 1.5rem;
  }
  
  .filters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .clues-count {
    margin-bottom: 1rem;
    font-style: italic;
    color: #666;
  }
  
  .clues-table {
    overflow-x: auto;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  
  .movie-cell {
    width: 20%;
    min-width: 150px;
  }
  
  .movie-title {
    font-weight: bold;
  }
  
  .movie-year {
    font-size: 0.8rem;
    color: #666;
  }
  
  .clue-cell {
    width: 60%;
  }
  
  .action-cell {
    width: 20%;
    text-align: center;
  }
  
  .edit-btn {
    padding: 0.4rem 0.75rem;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: bold;
  }
  
  .edit-btn:hover {
    background-color: #1976D2;
  }
  
  .edit-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
  }
  
  .edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .save-btn {
    padding: 0.4rem 0.75rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: bold;
  }
  
  .save-btn:hover {
    background-color: #388E3C;
  }
  
  .cancel-btn {
    padding: 0.4rem 0.75rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: bold;
  }
  
  .cancel-btn:hover {
    background-color: #D32F2F;
  }
  
  .no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
  }
  
  .navigation {
    display: flex;
    gap: 1rem;
  }
  
  .nav-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #333;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  
  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
    }
  }
</style>