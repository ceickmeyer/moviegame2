<!-- routes\game\components\MovieInfo.svelte -->
<script>
  import { fly } from 'svelte/transition';
  import {
    revealedInfo,
    allPossibleInfo,
    formatInfoForDisplay
  } from '../store/gameStore';
  
  function getInfoPillClass(info) {
    return `info-pill ${info.type} ${info.locked ? 'locked' : 'revealed'}`;
  }
  
  // Group all info items (revealed and locked) by type for better organization
  $: allInfoItems = [...$revealedInfo, ...$allPossibleInfo.filter(item => 
    // Only include locked items that aren't already in revealedInfo
    item.locked && !$revealedInfo.some(revealed => 
      revealed.type === item.type && 
      (revealed.position === item.position || (!revealed.position && !item.position))
    )
  )];
  
  // Sort items by type for consistent display
  $: sortedInfoItems = allInfoItems.sort((a, b) => {
    // Define priority order for info types
    const typePriority = {
      "year": 1,
      "genre": 2,
      "allGenres": 3,
      "actor": 4,
      "director": 5,
      "rating": 6
    };
    
    // Sort first by type priority
    const typeDiff = typePriority[a.type] - typePriority[b.type];
    if (typeDiff !== 0) return typeDiff;
    
    // For actors, sort by position
    if (a.type === 'actor' && b.type === 'actor') {
      return (a.position || 0) - (b.position || 0);
    }
    
    // Otherwise, unlocked items first
    return (a.locked ? 1 : 0) - (b.locked ? 1 : 0);
  });
</script>

<div class="movie-info">
  <h3 class="section-title">Movie Information</h3>
  
  <div class="info-pills">
      {#each sortedInfoItems as info (info.type + (info.position || '') + (info.locked ? '-locked' : '-revealed'))}
          <div 
            class={getInfoPillClass(info)} 
            in:fly={{ y: 10, duration: 300 }}
          >
            {#if info.locked}
              <div class="locked-content">
                <span class="lock-icon">🔒</span>
                <span class="info-type">
                  {#if info.type === 'year'}
                    Year
                  {:else if info.type === 'genre'}
                    Genre
                  {:else if info.type === 'actor'}
                    {#if info.position === 1}
                      Lead Actor
                    {:else if info.position === 2}
                      Second Actor
                    {:else if info.position === 3}
                      Third Actor
                    {:else}
                      Actor
                    {/if}
                  {:else if info.type === 'director'}
                    Director
                  {:else if info.type === 'allGenres'}
                    All Genres
                  {:else if info.type === 'rating'}
                    Rating
                  {:else}
                    Info
                  {/if}
                </span>
              </div>
            {:else}
              {formatInfoForDisplay(info)}
            {/if}
          </div>
      {/each}
  </div>
</div>

<style>
  .movie-info {
      margin-bottom: 2rem;
      padding: 1rem;
      background-color: rgba(44, 52, 64, 0.7);
      backdrop-filter: blur(5px);
      border-radius: 8px;
  }
  
  .section-title {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: var(--text-bright, #ffffff);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
  }
  
  .info-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
  }
  
  .info-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      min-width: 80px;
  }
  
  /* Revealed info styling */
  .info-pill.year.revealed {
      background-color: var(--info-bg, rgba(33, 150, 243, 0.1));
      color: var(--info-color, #2196F3);
  }
  
  .info-pill.genre.revealed {
      background-color: var(--success-bg, rgba(76, 175, 80, 0.1));
      color: var(--success-color, #4CAF50);
  }
  
  .info-pill.actor.revealed {
      background-color: var(--warning-bg, rgba(255, 152, 0, 0.1));
      color: var(--warning-color, #FF9800);
  }
  
  .info-pill.director.revealed {
      background-color: var(--accent-light, rgba(255, 62, 0, 0.1));
      color: var(--accent-color, #FF3E00);
  }
  
  .info-pill.rating.revealed {
      background-color: var(--rating-bg, rgba(0, 192, 48, 0.15));
      color: var(--rating-color, #00C030);
  }
  
  .info-pill.allGenres.revealed {
      background-color: var(--success-bg, rgba(76, 175, 80, 0.1));
      color: var(--success-color, #4CAF50);
  }
  
  /* Locked info styling */
  .info-pill.locked {
      background-color: rgba(100, 100, 100, 0.15);
      color: #888;
      border: 1px dashed rgba(170, 170, 170, 0.3);
  }
  
  .locked-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      opacity: 0.7;
  }
  
  .lock-icon {
      font-size: 0.8rem;
  }
  
  /* Media queries for better small screen display */
  @media (max-width: 480px) {
      .info-pills {
          gap: 0.5rem;
      }
      
      .info-pill {
          padding: 0.4rem 0.6rem;
          font-size: 0.8rem;
          min-width: 70px;
      }
  }
</style>