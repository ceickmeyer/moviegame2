<!-- routes\+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	
	// State for movie schedule visibility
	let isScheduleRevealed = false;
	
	export const data: { 
		stats?: { 
			count: number, 
			movieCount: number 
		},
		todayMovie?: Movie,
		upcomingMovies?: MovieWithDate[]
	} = {};

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
				const approvedResponse = await fetch('/api/clues-data?type=approved');
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
	<!-- Rest of the content remains the same as in the previous file -->
</div>

<style>
	/* Dashboard Layout */
	.admin-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
	
</style>
