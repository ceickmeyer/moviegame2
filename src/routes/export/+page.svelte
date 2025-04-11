<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApprovedClue } from '$lib/types/clueTypes';
    
    let approvedClues: ApprovedClue[] = [];
    let loading = true;
    
    onMount(async () => {
      try {
        const response = await fetch('/approved_clues.json');
        approvedClues = await response.json();
        loading = false;
      } catch (error) {
        console.error('Error loading approved clues:', error);
        loading = false;
      }
    });
    
    function downloadClues(): void {
      // Create a blob of the JSON data
      const data = JSON.stringify(approvedClues, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      
      // Create a link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'approved_clues.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
    
    // Group clues by movie
    $: cluesByMovie = approvedClues.reduce<Record<string, ApprovedClue[]>>((acc, clue) => {
      const key = `${clue.movieTitle} (${clue.movieYear})`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(clue);
      return acc;
    }, {});
  </script>
  
  <svelte:head>
    <title>Export Approved Clues</title>
  </svelte:head>
  
  <div class="container">
    <h1>Approved Movie Clues</h1>
    
    {#if loading}
      <p>Loading approved clues...</p>
    {:else}
      <div class="stats">
        <p>Total approved clues: <strong>{approvedClues.length}</strong></p>
        <p>Movies with clues: <strong>{Object.keys(cluesByMovie).length}</strong></p>
      </div>
      
      <button class="download-btn" on:click={downloadClues}>
        Download approved_clues.json
      </button>
      
      <div class="clues-list">
        <h2>Clues by Movie</h2>
        
        {#if approvedClues.length === 0}
          <p>No approved clues yet. Go to the <a href="/review-selector">review selector</a> to approve some clues.</p>
        {:else}
          {#each Object.entries(cluesByMovie) as [movieTitle, clues]}
            <div class="movie-section">
              <h3>{movieTitle}</h3>
              <ul>
                {#each clues as clue}
                  <li>
                    <div class="clue-text">{clue.clueText}</div>
                    <div class="clue-meta">Approved: {new Date(clue.approvedAt).toLocaleString()}</div>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
    
    <div class="navigation">
      <a href="/review-selector" class="nav-button">Back to Review Tool</a>
      <a href="/" class="nav-button">Home</a>
    </div>
  </div>
  
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .stats {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 5px;
      margin-bottom: 1rem;
    }
    
    .download-btn {
      background-color: #4CAF50;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: bold;
      margin-bottom: 2rem;
    }
    
    .clues-list {
      margin-top: 2rem;
    }
    
    .movie-section {
      margin-bottom: 2rem;
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
    }
    
    .movie-section h3 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .clue-text {
      background-color: white;
      border: 1px solid #eee;
      padding: 1rem;
      border-radius: 5px;
      margin-bottom: 0.5rem;
    }
    
    .clue-meta {
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .navigation {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .nav-button {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #333;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>