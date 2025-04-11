<!-- routes\game\components\GameStart.svelte -->
<script>
    import { fade } from 'svelte/transition';
    import { gameHistory, startNewGame } from '../store/gameStore';
    import { derived } from 'svelte/store';
    import { onMount } from 'svelte';
    
    // Handle async startNewGame
    async function handleStartGame() {
        await startNewGame();
    }
    
    // Calculate stats based on game history
    const stats = derived(gameHistory, ($history) => {
      if (!$history || $history.length === 0) {
        return { played: 0, won: 0, avgGuesses: 0, streak: 0, bestStreak: 0 };
      }
      
      const played = $history.length;
      const won = $history.filter(game => game.won).length;
      const totalGuesses = $history.reduce((sum, game) => sum + game.guesses, 0);
      const avgGuesses = played > 0 ? totalGuesses / played : 0;
      
      // Calculate current streak and best streak
      let currentStreak = 0;
      let bestStreak = 0;
      
      // Start from most recent game
      for (let i = 0; i < $history.length; i++) {
        if ($history[i].won) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate best streak
      let tempStreak = 0;
      for (let i = 0; i < $history.length; i++) {
        if ($history[i].won) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      return { played, won, avgGuesses, streak: currentStreak, bestStreak };
    });
    
    // Distribution of guesses (how many guesses it took to win)
    const guessDistribution = derived(gameHistory, ($history) => {
      const distribution = [0, 0, 0, 0, 0, 0]; // 6 possible guesses
      
      if (!$history || $history.length === 0) {
        return distribution;
      }
      
      $history.forEach(game => {
        if (game.won && game.guesses >= 1 && game.guesses <= 6) {
          distribution[game.guesses - 1]++;
        }
      });
      
      return distribution;
    });
    
    // Calculate maximum value for scaling the bars
    $: maxDistribution = Math.max(...$guessDistribution, 1);
</script>

<div class="game-start" in:fade={{ duration: 300 }}>
    {#if $gameHistory && $gameHistory.length > 0}
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
                
                <div class="stat-item">
                  <div class="stat-value">{$stats.streak}</div>
                  <div class="stat-label">Current Streak</div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-value">{$stats.bestStreak}</div>
                  <div class="stat-label">Best Streak</div>
                </div>
              </div>
              
              {#if $stats.played > 0}
                <div class="guess-distribution">
                  <h4>Guess Distribution</h4>
                  <div class="distribution-bars">
                    {#each $guessDistribution as count, index}
                      <div class="bar-container">
                        <div class="bar-label">{index + 1}</div>
                        <div class="bar" style="width: {(count / maxDistribution) * 100}%">
                          <span class="bar-count">{count}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
        </div>
    {/if}
    
    <div class="button-group">
        <button class="btn-primary start-button" on:click={handleStartGame}>
            Start Game
        </button>
    </div>
</div>

<style>
    .game-start {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 300px;
        margin-top: 1rem;
    }
    
    .start-button {
        padding: 0.75rem 2rem;
        font-size: 1.1rem;
    }
    
    .stats-card {
      width: 100%;
      max-width: 600px;
      margin-bottom: 2rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      text-align: center;
      margin-bottom: 2rem;
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
    
    .guess-distribution {
      margin-top: 1.5rem;
    }
    
    h4 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    
    .distribution-bars {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .bar-container {
      display: flex;
      align-items: center;
      height: 2rem;
    }
    
    .bar-label {
      width: 1.5rem;
      font-weight: 500;
      text-align: center;
      margin-right: 0.5rem;
    }
    
    .bar {
      height: 1.5rem;
      min-width: 2rem;
      background-color: var(--accent);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.5rem;
      transition: width 0.5s ease;
    }
    
    .bar-count {
      color: white;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
</style>