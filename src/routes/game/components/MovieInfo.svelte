<!-- routes\game\components\MovieInfo.svelte -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import {
    revealedInfo,
    allPossibleInfo,
    formatInfoForDisplay,
    phaseConfig,
    currentPhase
  } from '../store/gameStore';
  
  // Helper function to get info type ID locally (without importing)
  function getLocalInfoType(item) {
    switch (item.type) {
      case "year":
        return "year";
      case "genre":
        if (!item.position) return "firstGenre";
        return "";
      case "actor":
        if (item.position === 1) return "firstActor";
        if (item.position === 2) return "secondActor";
        if (item.position === 3) return "thirdActor";
        return "";
      case "director":
        return "director";
      case "allGenres":
        return "allGenres";
      case "rating":
        return "rating";
      default:
        return "";
    }
  }
  
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
  
  // Sort items based on the phase configuration order
  $: sortedInfoItems = allInfoItems.sort((a, b) => {
    const aTypeId = getLocalInfoType(a);
    const bTypeId = getLocalInfoType(b);
    
    // Create a map of info type to its phase order
    const phaseOrderMap = {};
    $phaseConfig.forEach((phase, phaseIndex) => {
      phase.infoTypes.forEach((infoType, infoIndex) => {
        // Use phaseIndex * 100 + infoIndex to ensure proper ordering
        phaseOrderMap[infoType] = (phaseIndex * 100) + infoIndex;
      });
    });
    
    // Sort by phase order
    const aOrder = (aTypeId in phaseOrderMap) ? phaseOrderMap[aTypeId] : 999;
    const bOrder = (bTypeId in phaseOrderMap) ? phaseOrderMap[bTypeId] : 999;
    
    const orderDiff = aOrder - bOrder;
    if (orderDiff !== 0) return orderDiff;
    
    // For actors, sort by position if they're in the same phase
    if (a.type === 'actor' && b.type === 'actor') {
      return (a.position || 0) - (b.position || 0);
    }
    
    // Otherwise, unlocked items first
    return (a.locked ? 1 : 0) - (b.locked ? 1 : 0);
  });
  
  // Function to get the phase number that will reveal a specific locked info item
  function getRevealPhaseForInfo(infoTypeId) {
    for (let i = 0; i < $phaseConfig.length; i++) {
      if ($phaseConfig[i].infoTypes.includes(infoTypeId)) {
        return i + 1; // Phases are 1-indexed
      }
    }
    return null;
  }
  
  // Improved function to get a more user-friendly name for the info type
  function getInfoTypeName(infoTypeId) {
    switch(infoTypeId) {
      case 'year': return 'Release Year';
      case 'firstGenre': return 'Main Genre';
      case 'thirdActor': return 'Supporting Actor';
      case 'director': return 'Director';
      case 'secondActor': return 'Co-star';
      case 'allGenres': return 'All Genres';
      case 'firstActor': return 'Lead Actor';
      case 'rating': return 'Rating';
      default: return 'Information';
    }
  }
  
  // Create an array of upcoming info
  $: upcomingInfo = [];
  $: {
    // Clear array
    upcomingInfo = [];
    
    // Process each phase
    $phaseConfig.forEach((phase, idx) => {
      // Only include future phases
      if (idx + 1 > $currentPhase) {
        phase.infoTypes.forEach(infoType => {
          // Check if this info is already revealed
          const isRevealed = $revealedInfo.some(info => getLocalInfoType(info) === infoType);
          
          // Only add if not already revealed
          if (!isRevealed) {
            upcomingInfo.push({
              phase: phase.phase,
              name: getInfoTypeName(infoType),
              id: infoType
            });
          }
        });
      }
    });
  }
</script>

<div class="movie-info">
  <h3 class="section-title">Movie Information</h3>
  
  <!-- Revealed information -->
  <div class="info-section">
    {#if $revealedInfo.length > 0}
      <div class="revealed-info">
        <h4 class="subsection-title">Revealed Information</h4>
        <div class="info-pills">
          {#each $revealedInfo as info (info.type + (info.position || ''))}
            <div 
              class="info-pill {info.type} revealed" 
              in:fly={{ y: 10, duration: 300 }}
            >
              {formatInfoForDisplay(info)}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="no-info">
        <p>Waiting for information to be revealed...</p>
      </div>
    {/if}
  </div>
  
  <!-- Upcoming information -->
  {#if upcomingInfo.length > 0}
    <div class="upcoming-info">
      <h4 class="subsection-title">Coming Next</h4>
      <div class="info-pills">
        {#each upcomingInfo as info}
          <div class="info-pill locked" in:fly={{ y: 10, duration: 300 }}>
            <div class="locked-content">
              <span class="lock-icon">🔒</span>
              <span class="info-name">{info.name}</span>
              <span class="reveal-phase">(Guess {info.phase})</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .movie-info {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background-color: rgba(44, 52, 64, 0.7);
    backdrop-filter: blur(5px);
    border-radius: 8px;
  }
  
  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    color: var(--text-bright, #ffffff);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
  
  .info-section, .upcoming-info {
    margin-bottom: 1rem;
  }
  
  .subsection-title {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: var(--text-secondary, #aaaaaa);
    font-weight: 500;
  }
  
  .info-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .info-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s ease;
    min-width: 70px;
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
    gap: 0.3rem;
    opacity: 0.7;
  }
  
  .lock-icon {
    font-size: 0.7rem;
  }
  
  .info-name {
    font-weight: 500;
  }
  
  .reveal-phase {
    font-size: 0.7rem;
    opacity: 0.8;
    font-style: italic;
  }
  
  .no-info {
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0.75rem;
    border-radius: 4px;
    font-style: italic;
    color: #aaa;
  }
  
  /* Media queries for better small screen display */
  @media (max-width: 480px) {
    .info-pills {
      gap: 0.4rem;
    }
    
    .info-pill {
      padding: 0.35rem 0.5rem;
      font-size: 0.75rem;
      min-width: 60px;
    }
    
    .reveal-phase {
      font-size: 0.65rem;
    }
  }
</style>