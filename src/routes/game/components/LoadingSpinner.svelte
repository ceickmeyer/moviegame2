<!-- lib/components/LoadingSpinner.svelte -->
<script>
  export let size = 48;
  export let color = "#ff3e00";
  export let text = "Loading...";
  export let showText = true;
  export let bgColor = "rgba(20, 24, 28, 0.8)";
  export let fullScreen = false;
</script>

<div class="loading-container" class:fullscreen={fullScreen} style="background-color: {fullScreen ? bgColor : 'transparent'}">
  <div class="spinner-wrapper">
    <div 
      class="spinner" 
      style="width: {size}px; height: {size}px; border: {Math.max(3, size/12)}px solid {color}; border-top-color: transparent;"
    ></div>
    
    {#if showText && text}
      <p class="loading-text">{text}</p>
    {/if}
  </div>
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .loading-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }
  
  .spinner-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .spinner {
    border-radius: 50%;
    animation: spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  }
  
  .loading-text {
    margin-top: 1rem;
    font-size: 1rem;
    color: #eee;
    font-weight: 500;
  }
  
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>