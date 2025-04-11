<!-- routes\+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	
	// State for movie schedule visibility
	let isScheduleRevealed = false;
	
	// Toggle movie schedule visibility
	function toggleScheduleVisibility() {
		isScheduleRevealed = !isScheduleRevealed;
	}
	
	interface Clue {
		id: string;
		movieId: string;
		movieTitle: string;
		movieYear: string;
		clueText: string;
		approvedAt?: string;
		rejectedAt?: string;
		type: 'approved' | 'rejected';
		timestamp: number;
	}
	
	interface Movie {
		id: string;
		title: string;
		year: string;
		director: string;
		genres: string[];
		cast: string[];
		rating: number;
	}
	
	interface MovieWithDate extends Movie {
		scheduledDate: string;
	}
	
	// Stats and state
	let stats = {
		count: 0,
		movieCount: 0,
		rejectedCount: 0,
		reviewedCount: 0
	};
	
	let recentActivity: Clue[] = [];
	let todayMovie: Movie | null = null;
	let upcomingMovies: MovieWithDate[] = [];
	let loadingStats = true;
	let loadingActivity = true;
	let loadingMovies = true;
	
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
				const scheduleData = await scheduleResponse.json();
				todayMovie = scheduleData.todayMovie;
				upcomingMovies = scheduleData.upcomingMovies;
			} catch (err) {
				console.error('Error loading movie schedule:', err);
			} finally {
				loadingMovies = false;
			}
			
			// Try to load the last few approved clues as recent activity
			try {
				const approvedResponse = await fetch('/approved_clues.json');
				const approvedClues = await approvedResponse.json();
				
				// Process approved clues
				const processed = approvedClues.map((clue: any) => ({
					...clue,
					timestamp: new Date(clue.approvedAt).getTime(),
					type: 'approved' as const
				}));
				
				// Sort by newest first and take only the 5 most recent
				recentActivity = processed
					.sort((a: Clue, b: Clue) => b.timestamp - a.timestamp)
					.slice(0, 5);
			} catch (err) {
				console.error('Error loading recent activity:', err);
			} finally {
				loadingActivity = false;
			}
		} catch (error) {
			console.error('Error fetching stats:', error);
			loadingStats = false;
		}
	});
	
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
	
	// Format date for recent activity
	   function formatDate(dateString: string): string {
	 const date = new Date(dateString);
	 return new Intl.DateTimeFormat('en-US', {
	   month: 'short',
	   day: 'numeric',
	   hour: '2-digit',
	   minute: '2-digit'
	 }).format(date);
	}
</script>

<svelte:head>
	<title>Movie Clue Game Admin</title>
</svelte:head>

<div class="admin-dashboard">
	<section class="dashboard-header">
		<div class="title-section">
			<h1>Movie Game Admin</h1>
			<p class="subtitle">Manage clues, settings, and review sentences for your movie guessing game</p>
		</div>
		<div class="admin-actions">
			<form method="POST" action="/logout">
				<button type="submit" class="logout-btn">Logout</button>
			</form>
		</div>
	</section>
	
	<!-- Stats Overview -->
	<section class="stats-section">
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon" style="background-color: #4CAF50;">
					<span>✓</span>
				</div>
				<div class="stat-content">
					<div class="stat-value">{loadingStats ? '...' : stats.count}</div>
					<div class="stat-label">Approved Clues</div>
				</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon" style="background-color: #2196F3;">
					<span>🎬</span>
				</div>
				<div class="stat-content">
					<div class="stat-value">{loadingStats ? '...' : stats.movieCount}</div>
					<div class="stat-label">Movies</div>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Movie Schedule -->
	<section class="movie-schedule-section">
		<div class="section-header">
			<h2>Movie Schedule</h2>
			<button class="toggle-button" on:click={toggleScheduleVisibility} aria-label={isScheduleRevealed ? 'Hide movie schedule' : 'Show movie schedule'}>
				{#if isScheduleRevealed}
					<span class="toggle-icon">👁️</span> Hide Movies
				{:else}
					<span class="toggle-icon">👁️‍🗨️</span> Reveal Movies
				{/if}
			</button>
		</div>
		
		<div class="movie-schedule-content {isScheduleRevealed ? 'revealed' : 'hidden'}">
			<div class="current-movie">
				<h3>Today's Movie</h3>
				{#if loadingMovies}
					<div class="loading-movie">Loading movie information...</div>
				{:else if !todayMovie}
					<div class="no-movie">
						<p>No movie scheduled for today.</p>
						<p class="movie-note">Add at least 6 approved clues to movies to make them eligible for scheduling.</p>
					</div>
				{:else}
					<div class="movie-card">
						<div class="movie-poster">
							<span class="movie-icon">🎬</span>
						</div>
						<div class="movie-details">
							<div class="movie-title">{todayMovie.title}</div>
							<div class="movie-year">{todayMovie.year}</div>
							<div class="movie-director">Director: {todayMovie.director}</div>
							{#if todayMovie.genres && todayMovie.genres.length > 0}
								<div class="movie-genres">{todayMovie.genres.join(', ')}</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
			
			<div class="upcoming-movies">
				<h3>Upcoming Movies</h3>
				{#if loadingMovies}
					<div class="loading-movie">Loading upcoming movies...</div>
				{:else if upcomingMovies.length === 0}
					<div class="no-movie">
						<p>No upcoming movies scheduled.</p>
						<p class="movie-note">Add at least 6 approved clues to movies to make them eligible for scheduling.</p>
					</div>
				{:else}
					<div class="movie-calendar">
						{#each upcomingMovies as movie}
							{@const date = new Date(movie.scheduledDate)}
							<div class="calendar-item">
								<div class="calendar-date">
									{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								</div>
								<div class="calendar-movie">{movie.title} ({movie.year})</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>
	
	<!-- Admin Functions Menu -->
	<section class="admin-menu-section">
		<h2>Admin Functions</h2>
		
		<div class="admin-menu-grid">
			{#each adminMenuItems as item}
				<a href={item.route} class="admin-menu-card {item.primary ? 'primary' : ''}">
					<div class="menu-card-icon" style="background-color: {item.color}">
						<span>{item.icon}</span>
					</div>
					<div class="menu-card-content">
						<h3>{item.title}</h3>
						<p>{item.description}</p>
					</div>
				</a>
			{/each}
		</div>
	</section>
	
	<!-- Recent Clues -->
	<section class="recent-clues-section">
		<h2>Recent Clues</h2>
		
		{#if loadingActivity}
			<div class="loading-activity">Loading recent clues...</div>
		{:else if recentActivity.length === 0}
			<div class="no-activity">No recent clues found. Start reviewing clues to see them here.</div>
		{:else}
			<div class="activity-list">
				{#each recentActivity.filter(a => a.type === 'approved') as activity}
					<div class="activity-item">
						<div class="activity-badge approved">
							✓
						</div>
						<div class="activity-content">
							<div class="activity-text">{activity.clueText}</div>
							<div class="activity-meta">
								<span class="activity-movie">{activity.movieTitle} ({activity.movieYear})</span>
								<span class="activity-time">
									{activity.approvedAt ? formatDate(activity.approvedAt) : ''}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	
	<!-- Quick Guide -->
	<section class="quick-guide-section">
		<h2>Quick Guide</h2>
		
		<div class="guide-grid">
			<div class="guide-card">
				<h3>1. Add Movie Data</h3>
				<p>Use the Convert JSON tool to prepare your Letterboxd movie data.</p>
				<a href="/convert" class="guide-link">Convert Data</a>
			</div>
			
			<div class="guide-card">
				<h3>2. Review Sentences</h3>
				<p>Select which sentences from movie reviews make good clues.</p>
				<a href="/review-selector" class="guide-link">Start Reviewing</a>
			</div>
			
			<div class="guide-card">
				<h3>3. Configure Game</h3>
				<p>Set up how information is revealed during gameplay.</p>
				<a href="/game-settings" class="guide-link">Game Settings</a>
			</div>
			
			<div class="guide-card">
				<h3>4. Test the Game</h3>
				<p>Play a few rounds to make sure everything works as expected.</p>
				<a href="/game" class="guide-link">Play Game</a>
			</div>
		</div>
	</section>
</div>

<style>
	/* Dashboard Layout */
	.admin-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	/* Header Section */
	.dashboard-header {
		margin-bottom: 2rem;
	}
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: var(--heading-color);
	}
	
	.subtitle {
		font-size: 1.2rem;
		color: #666;
		margin-top: 0;
	}
	
	/* Section Styling */
	section {
		margin-bottom: 3rem;
	}
	
	h2 {
		font-size: 1.8rem;
		margin-bottom: 1.5rem;
		color: var(--heading-color);
		border-bottom: 2px solid #eee;
		padding-bottom: 0.5rem;
	}
	
	/* Stats Section */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.stat-card {
		background-color: white;
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		display: flex;
		align-items: center;
	}
	
	.stat-icon {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
		font-size: 1.8rem;
		color: white;
	}
	
	.stat-content {
		flex: 1;
	}
	
	.stat-value {
		font-size: 2.2rem;
		font-weight: bold;
		margin-bottom: 0.3rem;
		color: #333;
	}
	
	.stat-label {
		font-size: 1rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	/* Admin Menu Grid */
	.admin-menu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}
	
	.admin-menu-card {
		background-color: white;
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		padding: 1.5rem;
		display: flex;
		align-items: center;
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.admin-menu-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
	}
	
	.admin-menu-card.primary {
		border: 2px solid var(--accent-color);
	}
	
	.menu-card-icon {
		width: 60px;
		height: 60px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
		font-size: 1.8rem;
		color: white;
	}
	
	.menu-card-content {
		flex: 1;
	}
	
	.menu-card-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.4rem;
		color: #333;
	}
	
	.menu-card-content p {
		margin: 0;
		color: #666;
		font-size: 1rem;
		line-height: 1.5;
	}
	
	/* Recent Activity Section */
	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.activity-item {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		padding: 1rem;
		display: flex;
		align-items: flex-start;
	}
	
	.activity-badge {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		font-size: 1rem;
		color: white;
		flex-shrink: 0;
	}
	
	.activity-badge.approved {
		background-color: #4CAF50;
	}
	

	.activity-content {
		flex: 1;
	}
	
	.activity-text {
		margin-bottom: 0.5rem;
		font-size: 1rem;
		line-height: 1.5;
		color: #333;
	}
	
	/* Movie Schedule Section */
	.movie-schedule-section {
		margin-bottom: 3rem;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	
	.toggle-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.toggle-button:hover {
		background-color: #d03600;
	}
	
	.toggle-icon {
		font-size: 1.1rem;
	}
	
	.movie-schedule-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	
	@media (max-width: 768px) {
		.movie-schedule-content {
			grid-template-columns: 1fr;
		}
	}
	
	.current-movie, .upcoming-movies {
		background-color: white;
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		transition: filter 0.3s ease;
	}
	
	/* Styles for hidden/revealed movie schedule */
	.movie-schedule-content.hidden .movie-card,
	.movie-schedule-content.hidden .movie-calendar {
		filter: blur(8px);
		user-select: none;
	}
	
	.movie-schedule-content.hidden .movie-title,
	.movie-schedule-content.hidden .movie-year,
	.movie-schedule-content.hidden .movie-director,
	.movie-schedule-content.hidden .movie-genres,
	.movie-schedule-content.hidden .calendar-movie {
		color: transparent;
		text-shadow: 0 0 8px rgba(0,0,0,0.5);
	}
	
	.movie-schedule-content.revealed .movie-card,
	.movie-schedule-content.revealed .movie-calendar {
		filter: none;
	}
	
	.movie-schedule-content {
		position: relative;
	}
	
	.movie-schedule-content.hidden::after {
		content: "Click 'Reveal Movies' to see the schedule";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(255,255,255,0.8);
		padding: 1rem;
		border-radius: 8px;
		font-weight: bold;
		color: var(--accent-color);
		z-index: 10;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.current-movie h3, .upcoming-movies h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.4rem;
		color: #333;
	}
	
	.movie-card {
		display: flex;
		align-items: center;
	}
	
	.movie-poster {
		width: 80px;
		height: 80px;
		background-color: #f0f0f0;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
	}
	
	.movie-icon {
		font-size: 2rem;
	}
	
	.movie-details {
		flex: 1;
	}
	
	.movie-title {
		font-size: 1.4rem;
		font-weight: bold;
		margin-bottom: 0.3rem;
		color: #333;
	}
	
	.movie-year {
		font-size: 1rem;
		color: #666;
		margin-bottom: 0.5rem;
	}
	
	.movie-director {
		font-size: 0.9rem;
		color: #666;
	}
	
	.movie-calendar {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	
	.calendar-item {
		display: flex;
		align-items: center;
		padding: 0.8rem;
		background-color: #f9f9f9;
		border-radius: 6px;
		border-left: 4px solid var(--accent-color);
	}
	
	.calendar-date {
		font-weight: bold;
		min-width: 70px;
		color: #333;
	}
	.no-movie {
		padding: 1.5rem;
		text-align: center;
		background-color: #f9f9f9;
		border-radius: 8px;
		color: #666;
	}
	
	.movie-note {
		font-size: 0.9rem;
		font-style: italic;
		margin-top: 0.5rem;
	}
	
	.movie-genres {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.3rem;
	}
	
	.calendar-movie {
		flex: 1;
		color: #555;
	}
	.admin-actions {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}
	
	.logout-btn {
		background-color: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-muted);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}
	
	.logout-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
		color: var(--text-color);
	}
	
	.dashboard-header {
		position: relative;
	}
	
	.activity-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: #666;
	}
	
	.activity-movie {
		font-weight: 500;
	}
	
	.loading-activity, .no-activity {
		background-color: white;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}
	
	/* Quick Guide Section */
	.guide-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.guide-card {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		padding: 1.5rem;
	}
	
	.guide-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
		font-size: 1.2rem;
	}
	
	.guide-card p {
		margin-bottom: 1.5rem;
		color: #666;
		line-height: 1.5;
	}
	
	.guide-link {
		display: inline-block;
		background-color: var(--accent-color);
		color: white;
		padding: 0.6rem 1.2rem;
		border-radius: 5px;
		font-weight: bold;
		text-decoration: none;
		transition: background-color 0.2s;
	}
	
	.guide-link:hover {
		background-color: #d03600;
	}
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.stats-grid, .admin-menu-grid, .guide-grid {
			grid-template-columns: 1fr;
		}
		
		.admin-menu-card, .stat-card {
			padding: 1.2rem;
		}
		
		.menu-card-icon, .stat-icon {
			width: 50px;
			height: 50px;
			font-size: 1.5rem;
			margin-right: 1rem;
		}
		
		.stat-value {
			font-size: 1.8rem;
		}
		
		.activity-meta {
			flex-direction: column;
			gap: 0.3rem;
		}
	}
</style>

