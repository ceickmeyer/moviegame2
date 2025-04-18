<!-- routes\manage-clues\+page.svelte (Optimized) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ApprovedClue } from '$lib/types/clueTypes';
  
  let approvedClues: ApprovedClue[] = [];
  let loading = true;
  let searchTerm = '';
  let editingClue: ApprovedClue | null = null;
  let editedText = '';
  
  // Pagination variables
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalClues = 0;
  let totalPages = 1;
  
  // Fetch clues with pagination
  async function fetchClues(page: number = 1, search: string = '') {
    loading = true;
    
    try {
      // Create a cache-busting timestamp
      const timestamp = Date.now();
      
      // Build the query string
      let queryParams = `page=${page}&limit=${itemsPerPage}&_=${timestamp}`;
      if (search) {
        queryParams += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(`/api/managed-clues?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state
      approvedClues = data.clues;
      totalClues = data.total;
      totalPages = Math.ceil(totalClues / itemsPerPage);
      
      console.log(`Loaded ${approvedClues.length} clues (page ${page} of ${totalPages})`);
    } catch (error) {
      console.error('Error loading clues:', error);
      alert('Failed to load clues. Please try again.');
    } finally {
      loading = false;
    }
  }
  
  // Refresh clues
  async function refreshClues() {
    await fetchClues(currentPage, searchTerm);
  }
  
  // Handle search
  function handleSearch() {
    // Reset to first page when searching
    currentPage = 1;
    fetchClues(1, searchTerm);
  }
  
  // Handle page change
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    fetchClues(newPage, searchTerm);
    
    // Scroll to top for better UX
    window.scrollTo(0, 0);
  }
  
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
  
  // Delete a clue
  async function deleteClue(clue: ApprovedClue): Promise<void> {
    if (!confirm(`Are you sure you want to delete this clue from "${clue.movieTitle}"?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/delete-clue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: clue.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        approvedClues = approvedClues.filter(c => c.id !== clue.id);
        totalClues--;
        totalPages = Math.ceil(totalClues / itemsPerPage);
        
        // Refresh the current page if it's now empty
        if (approvedClues.length === 0 && currentPage > 1) {
          changePage(currentPage - 1);
        }
      } else {
        alert(result.error || 'Failed to delete clue');
      }
    } catch (error) {
      console.error('Error deleting clue:', error);
      alert('Error deleting clue');
    }
  }
  
  // Calculate pagination range
  $: pageStart = (currentPage - 1) * itemsPerPage + 1;
  $: pageEnd = Math.min(pageStart + itemsPerPage - 1, totalClues);
  
  // Filter clues based on search term (for client-side filtering)
  $: filteredClues = searchTerm.trim() === '' 
    ? approvedClues 
    : approvedClues.filter(clue => 
        clue.movieTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        clue.clueText?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  // Load clues on component mount
  onMount(() => {
    fetchClues();
  });
</script>

<svelte:head>
<title>Manage Clues</title>
</svelte:head>

<div class="container">
<h1>Manage Movie Clues</h1>

<div class="header-controls">
  <div class="search-box">
    <input 
      type="text" 
      placeholder="Search by movie title or clue text..." 
      bind:value={searchTerm}
      on:keydown={(e) => e.key === 'Enter' && handleSearch()}
    />
    <button class="search-btn" on:click={handleSearch}>Search</button>
  </div>
  
  <button class="refresh-btn" on:click={refreshClues} disabled={loading}>
    {loading ? 'Loading...' : 'Refresh'}
  </button>
</div>

{#if loading}
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading clues...</p>
  </div>
{:else}
  <div class="clues-stats">
    <div class="stats-info">
      Showing <strong>{filteredClues.length}</strong> clues
      {#if totalClues > itemsPerPage}
        (page {currentPage} of {totalPages}, {pageStart}-{pageEnd} of {totalClues} total)
      {/if}
    </div>
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
                <div class="button-group">
                  <button class="edit-btn" on:click={() => startEditing(clue)}>
                    Edit
                  </button>
                  <button class="delete-btn" on:click={() => deleteClue(clue)}>
                    Delete
                  </button>
                </div>
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
  
  <!-- Pagination controls -->
  {#if totalPages > 1}
    <div class="pagination">
      <button 
        class="page-btn" 
        on:click={() => changePage(1)} 
        disabled={currentPage === 1}
      >
        First
      </button>
      <button 
        class="page-btn" 
        on:click={() => changePage(currentPage - 1)} 
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      <div class="page-indicator">
        Page {currentPage} of {totalPages}
      </div>
      
      <button 
        class="page-btn" 
        on:click={() => changePage(currentPage + 1)} 
        disabled={currentPage === totalPages}
      >
        Next
      </button>
      <button 
        class="page-btn" 
        on:click={() => changePage(totalPages)} 
        disabled={currentPage === totalPages}
      >
        Last
      </button>
    </div>
  {/if}
{/if}

<div class="navigation">
  <a href="/review-selector" class="nav-link">Review Tool</a>
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

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  flex: 1;
  max-width: 600px;
}

.search-box input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.search-btn {
  padding: 0.75rem 1rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-weight: bold;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 1rem;
}

.refresh-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.clues-stats {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-info {
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
  position: sticky;
  top: 0;
  z-index: 10;
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

.button-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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

.delete-btn {
  padding: 0.4rem 0.75rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: bold;
}

.edit-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
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

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* Pagination styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  padding: 0.5rem 1rem;
  background-color: #e9e9e9;
  border-radius: 4px;
  font-weight: bold;
}

/* Loading spinner */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Navigation */
.navigation {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.nav-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #333;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #555;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .refresh-btn {
    margin-left: 0;
  }
  
  .button-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>