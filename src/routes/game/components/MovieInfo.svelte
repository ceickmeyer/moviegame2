<!-- Updated MovieInfo.svelte with enhanced UI -->
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
  
  // Group all info items for better organization
  $: allInfoItems = $phaseConfig.flatMap((phase, phaseIndex) => {
    return phase.infoTypes.map(infoType => {
      // Find if this info is already revealed
      const revealedItem = $revealedInfo.find(info => getLocalInfoType(info) === infoType);
      
      // If revealed, return that item
      if (revealedItem) {
        return {
          ...revealedItem,
          phaseNum: phaseIndex + 1
        };
      }
      
      // Otherwise return a locked placeholder
      return {
        type: infoType,
        value: getInfoTypeName(infoType),
        locked: true,
        phaseNum: phaseIndex + 1
      };
    });
  });
  
  // Sort by phase number
  $: sortedInfoItems = [...allInfoItems].sort((a, b) => a.phaseNum - b.phaseNum);
</script>

<div class="movie-info">
  <h3 class="section-title">Movie Information</h3>
  
  <div class="info-section">
    <div class="info-pills">
      {#each sortedInfoItems as info (getLocalInfoType(info) + (info.phaseNum || 0))}
        {#if !info.locked}
          <div 
            class="info-pill {info.type} revealed" 
            in:fly={{ y: 10, duration: 300 }}
          >
            {formatInfoForDisplay(info)}
          </div>
        {:else}
          <div 
            class="info-pill locked" 
            in:fly={{ y: 10, duration: 300 }}
            data-phase={info.phaseNum}
            data-info-type={getInfoTypeName(info.type)}
          >
            <div class="locked-content">
              <span class="lock-icon">🔒</span>
              <span class="info-name">{getInfoTypeName(info.type)}</span>
              <span class="reveal-phase">(Guess {info.phaseNum})</span>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
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
    text-align: center;
  }
  
  .info-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .info-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .info-pill {
    position: relative;
    min-height: 2.2rem;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  /* Revealed info styling */
  .info-pill.year.revealed {
    background-color: rgba(33, 150, 243, 0.2);
    color: #64B5F6;
  }
  
  .info-pill.genre.revealed {
    background-color: rgba(76, 175, 80, 0.2);
    color: #81C784;
  }
  
  .info-pill.actor.revealed {
    background-color: rgba(255, 152, 0, 0.2);
    color: #FFB74D;
  }
  
  .info-pill.director.revealed {
    background-color: rgba(255, 62, 0, 0.2);
    color: #FF7043;
  }
  
  .info-pill.rating.revealed {
    background-color: rgba(0, 192, 48, 0.2);
    color: #4CD964;
  }
  
  .info-pill.allGenres.revealed {
    background-color: rgba(76, 175, 80, 0.2);
    color: #81C784;
  }
  
  /* Locked info styling */
  .info-pill.locked {
    background-color: rgba(100, 100, 100, 0.2);
    color: transparent;
    border: 1px dashed rgba(170, 170, 170, 0.4);
    overflow: hidden;
  }
  
  .info-pill.locked::before {
    content: "🔒";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1rem;
    color: #aaa;
  }
  
  .locked-content {
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  /* Media queries for better small screen display */
  @media (max-width: 480px) {
    .info-pills {
      gap: 0.4rem;
    }
    
    .info-pill {
      padding: 0.35rem 0.5rem;
      font-size: 0.75rem;
      min-width: 80px;
    }
  }
</style>