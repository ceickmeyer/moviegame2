<!-- routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	
	// State for movie schedule visibility
	let isScheduleRevealed = false;
	
	// Types for movie data
	interface Movie {
		id: string;
		title: string;
		year: string;
		director: string;
		genres: string[];
		actors: string[];
		rating: number;
		poster_path?: string;
	}
	
	interface MovieWithDate extends Movie {
		scheduledDate: string;
	}
	
	// Stats and state
	let stats = {
		count: 0,
		movieCount: 0
	};
	
	let todayMovie: Movie | null = null;
	let upcomingMovies: MovieWithDate[] = [];
	let loadingStats = true;
	let loadingMovies = true;
	
	// Toggle movie schedule visibility
	function toggleScheduleVisibility() {
		isScheduleRevealed = !isScheduleRevealed;
	}
	
	// Admin menu items
	const adminMenuItems = [
		{
			title: 'Review Selector',
			description: 'Review and select sentences for use as clues in the game.',
			icon: '📝',
			route: '/review-selector',
			color: '#4CAF50'
		},
		{
			title: 'Manage Clues',
			description: 'View, search, and change the status of approved or rejected clues.',
			icon: '🧩',
			route: '/manage-clues',
			color: '#2196F3'
		},
		{
			title: 'Game Settings',
			description: 'Configure game progression and information reveal order.',
			icon: '⚙️',
			route: '/game-settings',
			color: '#FF9800'
		},
		{
			title: 'Export Clues',
			description: 'Download approved clues as JSON for use in the game.',
			icon: '📤',
			route: '/export',
			color: '#9C27B0'
		},
		{
			title: 'Convert JSON',
			description: 'Convert Letterboxd data to the format needed by the game.',
			icon: '🔄',
			route: '/convert',
			color: '#607D8B'
		},
		{
			title: 'Play Game',
			description: 'Test the game with your current clue database.',
			icon: '🎮',
			route: '/game',
			color: '#E91E63',
			primary: true
		}
	];
	
	onMount(async () => {
		try {
			// Fetch stats
			const statsResponse = await fetch('/api/stats');
			stats = await statsResponse.json();
			loadingStats = false;
			
			// Fetch movie schedule
			try {
				// Add cache-busting parameter to ensure we get fresh data
				const scheduleResponse = await fetch(`/api/movie-schedule?_=${Date.now()}`);
				if (scheduleResponse.ok) {
					const scheduleData = await scheduleResponse.json();
					todayMovie = scheduleData.todayMovie;
					upcomingMovies = scheduleData.upcomingMovies;
				} else {
					console.error('Error fetching movie schedule:', await scheduleResponse.text());
				}
			} catch (err) {
				console.error('Error loading movie schedule:', err);
			} finally {
				loadingMovies = false;
			}
		} catch (error) {
			console.error('Error fetching stats:', error);
			loadingStats = false;
			loadingMovies = false;
		}
	});

	let advancingSchedule = false;
  
  // Add this function to your script section
  async function advanceMovieSchedule() {
    if (advancingSchedule) return;
    
    if (!confirm('Are you sure you want to advance to the next movie? This will immediately change today\'s game for all players.')) {
      return;
    }
    
    advancingSchedule = true;
    
    try {
      const response = await fetch('/api/advance-movie-schedule', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Movie schedule advanced successfully! Refreshing page...');
        window.location.reload();
      } else {
        alert(`Failed to advance schedule: ${result.error}`);
      }
    } catch (error) {
      console.error('Error advancing schedule:', error);
      alert('Error advancing schedule. Please try again.');
    } finally {
      advancingSchedule = false;
    }
  }


    // Add these new variables
	let showScheduleModal = false;
  let keepTodayMovie = true;
  let scheduleDays = 30;
  let initializingSchedule = false;
  let scheduleResult = null;
  
  // Add this new function
  async function initializeMovieSchedule() {
    if (initializingSchedule) return;
    
    // Validate inputs
    if (scheduleDays < 7) {
      scheduleResult = { success: false, message: 'Please schedule at least 7 days' };
      return;
    }
    
    if (scheduleDays > 365) {
      scheduleResult = { success: false, message: 'Maximum scheduling period is 365 days' };
      return;
    }
    
    initializingSchedule = true;
    scheduleResult = null;
    
    try {
      const response = await fetch('/api/initialize-movie-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keepToday: keepTodayMovie,
          dayCount: scheduleDays
        })
      });
      
      scheduleResult = await response.json();
      
      if (scheduleResult.success) {
        // Reload the page after a short delay to show the new schedule
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error initializing schedule:', error);
      scheduleResult = { 
        success: false, 
        message: 'Error initializing schedule. Please try again.'
      };
    } finally {
      initializingSchedule = false;
    }
  }

</script>

<svelte:head>
	<title>Movie Clue Game Admin</title>
</svelte:head>

<div class="admin-dashboard">
	<header class="dashboard-header">
		<h1>Movie Clue Game Admin Dashboard</h1>
	</header>
	
	<div class="dashboard-stats">
		{#if loadingStats}
			<div class="loading-indicator">Loading stats...</div>
		{:else}
			<div class="stat-card">
				<div class="stat-value">{stats.count}</div>
				<div class="stat-label">Total Approved Clues</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-value">{stats.movieCount}</div>
				<div class="stat-label">Movies with Clues</div>
			</div>
		{/if}
	</div>
	
	<!-- Movie Schedule Section -->
	<div class="movie-schedule-section">
		<div class="schedule-header">
			<h2>Movie Schedule</h2>
			<button class="toggle-btn" on:click={toggleScheduleVisibility}>
				{isScheduleRevealed ? 'Hide Schedule' : 'Show Schedule'}
			</button>
		</div>

		{#if isScheduleRevealed}
			<div class="schedule-content" in:slide={{ duration: 300 }}>
				{#if loadingMovies}
					<div class="loading-indicator">Loading movie schedule...</div>
				{:else}
					<div class="today-movie">
						<h3>Today's Movie</h3>

						  <div class="schedule-actions">
							<button class="action-btn advance-btn" on:click={advanceMovieSchedule} disabled={advancingSchedule}>
							  {advancingSchedule ? 'Advancing...' : 'Skip to Next Movie'}
							</button>
							<button class="action-btn refresh-schedule-btn" on:click={() => showScheduleModal = true}>
							  Manage Full Schedule
							</button>
						  </div>
						  
						{#if todayMovie}
							<div class="movie-card">
								{#if todayMovie.poster_path}
									<div class="movie-poster">
										<img src={todayMovie.poster_path} alt={todayMovie.title} />
									</div>
								{/if}
								
								<div class="movie-info">
									<h4>{todayMovie.title} ({todayMovie.year})</h4>
									
									{#if todayMovie.director}
										<div class="movie-detail">
											<span class="detail-label">Director:</span> {todayMovie.director}
										</div>
									{/if}
									
									{#if todayMovie.genres && todayMovie.genres.length > 0}
										<div class="movie-detail">
											<span class="detail-label">Genres:</span> {todayMovie.genres.join(', ')}
										</div>
									{/if}
									
									{#if todayMovie.actors && todayMovie.actors.length > 0}
										<div class="movie-detail">
											<span class="detail-label">Cast:</span> {todayMovie.actors.slice(0, 3).join(', ')}{todayMovie.actors.length > 3 ? '...' : ''}
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="no-movie-message">
								No movie scheduled for today. Make sure at least 6 clues are approved for each movie.
							</div>
						{/if}
					</div>
					
					<div class="upcoming-movies">
						<h3>Upcoming Movies</h3>
						
						{#if upcomingMovies && upcomingMovies.length > 0}
							<div class="upcoming-list">
								{#each upcomingMovies as movie}
									<div class="upcoming-movie-item">
										<div class="movie-date">{new Date(movie.scheduledDate).toLocaleDateString()}</div>
										<div class="movie-title">{movie.title} ({movie.year})</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="no-movie-message">
								No upcoming movies in schedule. Add more movies with at least 6 approved clues.
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="admin-menu">
		{#each adminMenuItems as item}
			<a 
				href={item.route} 
				class="menu-card {item.primary ? 'primary' : ''}"
				style="--card-color: {item.color}"
			>
				<div class="card-icon">{item.icon}</div>
				<div class="card-content">
					<h3>{item.title}</h3>
					<p>{item.description}</p>
				</div>
			</a>
		{/each}
	</div>
	
	<form action="/logout" method="POST">
		<button type="submit" class="logout-button">Log Out</button>
	</form>

	{#if showScheduleModal}
  <div class="modal-overlay" transition:fade={{ duration: 150 }}>
    <div class="modal-content" transition:slide={{ duration: 200 }}>
      <h2>Manage Movie Schedule</h2>
      
      <p>
        This will create a schedule for future movies, ensuring no duplicates occur in the rotation.
        You can choose to keep today's movie or reset the entire schedule.
      </p>
      
      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={keepTodayMovie}>
          Keep today's scheduled movie
        </label>
        <p class="form-help">If checked, today's movie will remain the same and only future days will be updated.</p>
      </div>
      
      <div class="form-group">
        <label for="schedule-days">Number of days to schedule:</label>
        <input 
          type="number" 
          id="schedule-days" 
          bind:value={scheduleDays} 
          min="7" 
          max="365" 
          step="1"
        >
        <p class="form-help">How many days to schedule in advance (minimum 7, maximum 365)</p>
      </div>
      
      {#if scheduleResult}
        <div class="result-message {scheduleResult.success ? 'success' : 'error'}">
          {scheduleResult.message}
        </div>
      {/if}
      
      <div class="modal-actions">
        <button class="cancel-btn" on:click={() => {
          showScheduleModal = false;
          scheduleResult = null;
        }}>
          Close
        </button>
        <button 
          class="action-btn" 
          disabled={initializingSchedule} 
          on:click={initializeMovieSchedule}
        >
          {initializingSchedule ? 'Processing...' : 'Initialize Schedule'}
        </button>
      </div>
    </div>
  </div>
{/if}

</div>

<style>


.schedule-actions {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }
  
  .action-btn:hover {
    transform: translateY(-2px);
  }
  
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .advance-btn {
    background-color: #FF9800;
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .advance-btn:hover {
    background-color: #F57C00;
  }

	.admin-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.dashboard-header {
		margin-bottom: 2rem;
		text-align: center;
	}
	
	.dashboard-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 3rem;
	}
	
	.stat-card {
		background-color: #f5f5f5;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		min-width: 150px;
	}
	
	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #333;
	}
	
	.stat-label {
		margin-top: 0.5rem;
		color: #666;
	}
	
	/* Movie Schedule Section */
	.movie-schedule-section {
		background-color: #fff;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}
	
	.schedule-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	
	.schedule-header h2 {
		margin: 0;
		color: #333;
	}
	
	.toggle-btn {
		padding: 0.5rem 1rem;
		background-color: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}
	
	.toggle-btn:hover {
		background-color: #e0e0e0;
	}
	
	.today-movie {
		margin-bottom: 2rem;
	}
	
	.today-movie h3, .upcoming-movies h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
	}
	
	.movie-card {
		display: flex;
		align-items: flex-start;
		background-color: #f9f9f9;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.movie-poster {
		width: 100px;
		height: 150px;
		overflow: hidden;
		border-radius: 4px;
		margin-right: 1rem;
		flex-shrink: 0;
	}
	
	.movie-poster img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.movie-info {
		flex: 1;
	}
	
	.movie-info h4 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: #333;
	}
	
	.movie-detail {
		margin-bottom: 0.5rem;
		color: #666;
	}
	
	.detail-label {
		font-weight: bold;
		color: #444;
	}
	
	.upcoming-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}
	
	.upcoming-movie-item {
		display: flex;
		align-items: center;
		background-color: #f9f9f9;
		border-radius: 4px;
		padding: 0.75rem;
		border-left: 3px solid #2196F3;
	}
	
	.movie-date {
		min-width: 100px;
		font-weight: bold;
		color: #2196F3;
		margin-right: 1rem;
	}
	
	.movie-title {
		color: #333;
	}
	
	.no-movie-message {
		padding: 1rem;
		background-color: #fff4e5;
		border: 1px solid #ffd699;
		border-radius: 4px;
		color: #664d03;
	}
	
	.loading-indicator {
		text-align: center;
		padding: 2rem;
		color: #666;
	}
	
	/* Admin Menu */
	.admin-menu {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.refresh-schedule-btn {
    background-color: #2196F3;
    color: white;
    border: none;
    margin-left: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .refresh-schedule-btn:hover {
    background-color: #0d8bf2;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-content h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .form-group input[type="number"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-help {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .result-message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .result-message.success {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }
  
  .result-message.error {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  .cancel-btn {
    padding: 0.75rem 1.5rem;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .cancel-btn:hover {
    background-color: #e0e0e0;
  }

	.menu-card {
		display: flex;
		align-items: center;
		background-color: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-left: 4px solid var(--card-color, #ccc);
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.menu-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.card-icon {
		font-size: 2rem;
		margin-right: 1.5rem;
		color: var(--card-color, #333);
	}
	
	.card-content h3 {
		margin: 0 0 0.5rem;
		color: #333;
	}
	
	.card-content p {
		margin: 0;
		color: #666;
	}
	
	.menu-card.primary {
		background-color: var(--card-color, #E91E63);
		color: white;
	}
	
	.menu-card.primary .card-content h3,
	.menu-card.primary .card-content p,
	.menu-card.primary .card-icon {
		color: white;
	}
	
	/* Logout button */
	.logout-button {
		display: block;
		margin: 2rem auto;
		padding: 0.75rem 1.5rem;
		background-color: #f44336;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}
	
	@media (max-width: 768px) {
		.admin-dashboard {
			padding: 1rem;
		}
		
		.dashboard-stats {
			flex-direction: column;
			align-items: center;
		}
		
		.stat-card {
			width: 100%;
		}
		
		.admin-menu {
			grid-template-columns: 1fr;
		}
		
		.movie-card {
			flex-direction: column;
		}
		
		.movie-poster {
			margin-right: 0;
			margin-bottom: 1rem;
		}
		
		.upcoming-list {
			grid-template-columns: 1fr;
		}
	}
</style>