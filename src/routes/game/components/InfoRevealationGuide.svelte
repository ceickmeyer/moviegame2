<!-- InfoRevealationGuide.svelte -->
<script lang="ts">
    import { fly } from 'svelte/transition';
    import { phaseConfig, currentPhase } from '../store/gameStore';
    
    // Map info types to user-friendly names
    const infoTypeNames = {
      'year': 'Release Year',
      'firstGenre': 'Main Genre',
      'thirdActor': 'Supporting Actor',
      'director': 'Director',
      'secondActor': 'Co-Star',
      'allGenres': 'All Genres',
      'firstActor': 'Lead Actor',
      'rating': 'Rating'
    };
    
    // Format the info type name
    function formatInfoName(infoType: string): string {
      return infoTypeNames[infoType] || infoType;
    }
    
    // Current phase (1-indexed)
    $: currentPhaseNum = $currentPhase;
    
    // Whether to show the guide (can be controlled by a button)
    let showGuide = false;
    
    function toggleGuide() {
      showGuide = !showGuide;
    }
  </script>
  
  <div class="info-guide-container">
    <button class="guide-toggle-btn" on:click={toggleGuide}>
      {showGuide ? 'Hide Info Guide' : 'Show Info Guide'}
    </button>
    
    {#if showGuide}
      <div class="info-guide" in:fly={{ y: 20, duration: 300 }}>
        <h3>Information Revelation Guide</h3>
        <p class="guide-desc">Here's when different information about the movie will be revealed:</p>
        
        <div class="phase-list">
          {#each $phaseConfig as phase, index}
            <div class="phase-item {index + 1 === currentPhaseNum ? 'current' : ''}">
              <div class="phase-number">{index + 1}</div>
              <div class="phase-details">
                <h4>
                  {phase.title}
                  {#if index + 1 === currentPhaseNum}
                    <span class="current-marker">(Current)</span>
                  {:else if index + 1 < currentPhaseNum}
                    <span class="completed-marker">(Completed)</span>
                  {/if}
                </h4>
                
                <div class="info-list">
                  {#each phase.infoTypes as infoType}
                    <div class="info-type">
                      <span class="info-icon">{index + 1 < currentPhaseNum ? '✓' : '🔒'}</span>
                      <span class="info-name">{formatInfoName(infoType)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .info-guide-container {
      margin-bottom: 1.5rem;
    }
    
    .guide-toggle-btn {
      background-color: rgba(33, 150, 243, 0.3);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      margin-bottom: 0.5rem;
    }
    
    .guide-toggle-btn:hover {
      background-color: rgba(33, 150, 243, 0.5);
    }
    
    .info-guide {
      background-color: rgba(44, 52, 64, 0.7);
      backdrop-filter: blur(5px);
      border-radius: 8px;
      padding: 1rem;
      color: white;
    }
    
    .info-guide h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
    }
    
    .guide-desc {
      font-size: 0.9rem;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    .phase-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .phase-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background-color: rgba(50, 60, 75, 0.5);
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    
    .phase-item.current {
      background-color: rgba(33, 150, 243, 0.3);
      border-left: 3px solid #2196F3;
    }
    
    .phase-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      font-weight: bold;
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    .phase-details {
      flex: 1;
    }
    
    .phase-details h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }
    
    .current-marker {
      font-size: 0.8rem;
      color: #2196F3;
      margin-left: 0.5rem;
      font-weight: normal;
    }
    
    .completed-marker {
      font-size: 0.8rem;
      color: #4CAF50;
      margin-left: 0.5rem;
      font-weight: normal;
    }
    
    .info-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .info-type {
      display: flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .info-icon {
      margin-right: 0.25rem;
    }
    
    /* Media query for responsiveness */
    @media (max-width: 768px) {
      .info-guide {
        padding: 0.75rem;
      }
      
      .phase-item {
        padding: 0.5rem;
      }
      
      .phase-number {
        width: 1.5rem;
        height: 1.5rem;
        font-size: 0.8rem;
      }
      
      .phase-details h4 {
        font-size: 0.9rem;
      }
      
      .info-type {
        font-size: 0.75rem;
      }
    }
  </style>