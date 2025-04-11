<script>
    import { gameHistory } from '../store/gameStore';
    import { derived } from 'svelte/store';
    
    // Calculate stats based on game history
    const stats = derived(gameHistory, ($history) => {
      if (!$history || $history.length === 0) {
        return { played: 0, won: 0, avgGuesses: 0 };
      }
      
      const played = $history.length;
      const won = $history.filter(game => game.won).length;
      const totalGuesses = $history.reduce((sum, game) => sum + game.guesses, 0);
      const avgGuesses = played > 0 ? totalGuesses / played : 0;
      
      return { played, won, avgGuesses };
    });
  </script>
  
  <div class="stats-card card">
    <div class="card-header">
      <h3>Your Stats</h3>
    </div>
    
    <div class="card-content">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{$stats.played}</div>
          <div class="stat-label">Games Played</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">
            {$stats.played > 0 ? Math.round(($stats.won / $stats.played) * 100) : 0}%
          </div>
          <div class="stat-label">Win Rate</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{$stats.avgGuesses.toFixed(1)}</div>
          <div class="stat-label">Avg. Guesses</div>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    .stats-card {
      width: 100%;
      max-width: 600px;
      margin-bottom: 2rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2rem;
      color: var(--accent);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>