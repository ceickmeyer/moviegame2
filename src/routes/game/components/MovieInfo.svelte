<!-- Updated routes\game\components\MovieInfo.svelte -->
<script>
    import { fly } from 'svelte/transition';
    import {
      revealedInfo,
      formatInfoForDisplay
    } from '../store/gameStore';
    
    function getInfoPillClass(info) {
      return `info-pill ${info.type}`;
    }
</script>

<div class="movie-info">
    <h3 class="section-title">Movie Information</h3>
    
    <div class="info-pills">
        {#each $revealedInfo as info (info.type + (info.position || ''))}
            <div 
              class={getInfoPillClass(info)} 
              in:fly={{ y: 10, duration: 300 }}
            >
              {formatInfoForDisplay(info)}
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
</style>