<!-- Create a new file at lib/components/LoadingSpinner.svelte -->
<script>
    export let size = 48;
    export let color = "#ff3e00";
    export let text = "Loading...";
    export let showText = true;
  </script>
  
  <div class="loading-container">
    <div class="spinner" style="width: {size}px; height: {size}px; border-color: {color} transparent transparent transparent;"></div>
    {#if showText}
      <p class="loading-text">{text}</p>
    {/if}
  </div>
  
  <style>
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .spinner {
      display: inline-block;
      position: relative;
      width: 48px;
      height: 48px;
    }
    
    .spinner:after {
      content: " ";
      display: block;
      border-radius: 50%;
      width: 0;
      height: 0;
      margin: 8px;
      box-sizing: border-box;
      border: 16px solid #ff3e00;
      border-color: #ff3e00 transparent #ff3e00 transparent;
      animation: spinner 1.2s infinite;
    }
    
    .loading-text {
      margin-top: 1rem;
      font-size: 1rem;
      color: #666;
    }
    
    @keyframes spinner {
      0% {
        transform: rotate(0);
        animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
      }
      50% {
        transform: rotate(180deg);
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>