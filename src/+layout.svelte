<script>
    import Header from '$lib/header/Header.svelte';
    import './styles.css';
  </script>
  
  <div class="app">
    <Header />
    
    <main>
      <slot />
    </main>
    
    <footer>
      <p>Movie Clue Selector - Created with SvelteKit</p>
    </footer>
  </div>
  
  <style>
    :global(:root) {
      --accent-color: #ff3e00;
      --heading-color: #333;
      --text-color: #444;
      --background-color: #f9f9f9;
    }
    
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    
    footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.8rem;
      color: #666;
      border-top: 1px solid #eee;
      margin-top: 2rem;
    }
  </style>