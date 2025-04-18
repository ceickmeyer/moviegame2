// routes\game\store\gameStore.ts
// Optimized to load only the daily movie and avoid loading all data

import {
  writable,
  derived,
  get,
  type Writable,
  type Readable,
} from "svelte/store";
import type { Movie } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue } from "$lib/types/clueTypes";

export const preloadedPoster: Writable<string | null> = writable(null);
export const usedMovieIds: Writable<string[]> = writable([]);

// Define types for game-specific data structures
export type GameState = "playing" | "success" | "failed" | "error";

export interface GameClue {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear: string | number;
  clueText: string;
  approvedAt: string;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string;
  reviewUrl?: string;
}

export interface GameHistoryEntry {
  movie: string;
  year: number | string;
  guesses: number;
  won: boolean;
  date: string;
}

export interface InfoItem {
  type: "year" | "genre" | "actor" | "director" | "allGenres" | "rating";
  position?: number;
  value: string | number | string[] | null;
  locked?: boolean; // New property to track if this info is still locked
}

export interface PhaseConfig {
  phase: number;
  title: string;
  infoTypes: string[]; // IDs of info items to reveal in this phase
}

// Default phase configurations
export const defaultPhaseConfig: PhaseConfig[] = [
  {
    phase: 1,
    title: "Starting Phase",
    infoTypes: ["year"],
  },
  {
    phase: 2,
    title: "Second Phase",
    infoTypes: ["firstGenre"],
  },
  {
    phase: 3,
    title: "Third Phase",
    infoTypes: ["thirdActor"],
  },
  {
    phase: 4,
    title: "Fourth Phase",
    infoTypes: ["director"],
  },
  {
    phase: 5,
    title: "Fifth Phase",
    infoTypes: ["secondActor", "allGenres"],
  },
  {
    phase: 6,
    title: "Final Phase",
    infoTypes: ["firstActor", "rating"],
  },
];

// Available info types mapping (for reference)
export const availableInfoTypes = [
  { id: "year", type: "year", description: "Release Year" },
  { id: "firstGenre", type: "genre", description: "First Genre" },
  {
    id: "thirdActor",
    type: "actor",
    position: 3,
    description: "Third-billed Actor",
  },
  { id: "director", type: "director", description: "Director" },
  {
    id: "secondActor",
    type: "actor",
    position: 2,
    description: "Second-billed Actor",
  },
  { id: "allGenres", type: "allGenres", description: "All Genres" },
  {
    id: "firstActor",
    type: "actor",
    position: 1,
    description: "First-billed Actor",
  },
  { id: "rating", type: "rating", description: "Rating" },
];

// Game stores with type annotations
export const gameState: Writable<GameState> = writable("playing"); // Start directly in playing mode
export const allMovies: Writable<Movie[]> = writable([]);
export const approvedClues: Writable<ApprovedClue[]> = writable([]);
export const currentMovie: Writable<Movie | null> = writable(null);
export const currentClues: Writable<GameClue[]> = writable([]);
export const revealedClueIndex: Writable<number> = writable(1); // Start with 1 to show first review immediately
export const guessInput: Writable<string> = writable("");
export const filteredMovies: Writable<Movie[]> = writable([]);
export const guessCount: Writable<number> = writable(0);
export const maxGuesses: Writable<number> = writable(6);
export const revealedInfo: Writable<InfoItem[]> = writable([]);
export const allPossibleInfo: Writable<InfoItem[]> = writable([]); // Store for all possible info items (including locked ones)
export const feedback: Writable<string> = writable("");
export const showDropdown: Writable<boolean> = writable(false);
export const gameHistory: Writable<GameHistoryEntry[]> = writable([]);
export const phaseConfig: Writable<PhaseConfig[]> = writable([
  ...defaultPhaseConfig,
]);

// Loading state
export const isLoading: Writable<boolean> = writable(false);

// Derived stores
export const displayableClues: Readable<GameClue[]> = derived(
  [currentClues, revealedClueIndex],
  ([$currentClues, $revealedClueIndex]) => {
    // Ensure the clues are sorted by length (shortest first) every time they're accessed
    const sortedClues = [...$currentClues].sort((a, b) => 
      a.clueText.length - b.clueText.length
    );
    
    // Return only the number of clues that should be visible
    return sortedClues.slice(0, $revealedClueIndex);
  }
);

export const currentGuessNumber: Readable<number> = derived(
  guessCount,
  ($guessCount) => $guessCount + 1
);

export const currentPhase: Readable<number> = derived(
  guessCount,
  ($guessCount) => $guessCount + 1
);

// Helper function to properly format arrays
export function formatArray(arr: any[] | string | object | null | undefined): string[] {
  if (!arr) return [];
  
  if (Array.isArray(arr)) return arr;
  
  if (typeof arr === 'string') {
    try {
      const parsed = JSON.parse(arr);
      return Array.isArray(parsed) ? parsed : [arr];
    } catch (e) {
      // If it's not valid JSON, split by comma
      return arr.split(',').map(item => item.trim());
    }
  }
  
  if (typeof arr === 'object') {
    // Check if it's a PostgreSQL JSONB array (objects with numeric keys)
    const keys = Object.keys(arr);
    const isNumericKeysOnly = keys.every(key => !isNaN(Number(key)));
    
    if (isNumericKeysOnly) {
      return Object.values(arr);
    }
  }
  
  return [arr.toString()];
}

// Derived store for player stats
export const stats = derived(
  gameHistory,
  ($history) => {
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
  }
);

// Helper function: Shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper function: Get ordinal suffix for numbers
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return num + "st";
  }
  if (j === 2 && k !== 12) {
    return num + "nd";
  }
  if (j === 3 && k !== 13) {
    return num + "rd";
  }
  return num + "th";
}

// Optimized initial game data loading - loads only minimal state info
export function loadGameData(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Only load game history and phase config from localStorage
      // We don't need to load all movies and clues anymore
      loadGameHistory();
      loadPhaseConfig();
      loadUsedMovieIds();
      
      // Try to ensure initial info is set if we already have a movie
      if (get(currentMovie)) {
        ensureInitialInfo();
      }
      
      resolve();
    } catch (error) {
      console.error("Error loading game data:", error);
      reject(new Error("Failed to load game data"));
    }
  });
}

// Load used movie IDs from localStorage
export function loadUsedMovieIds(): void {
  try {
    const savedUsedMovieIds = localStorage.getItem("movieGameUsedIds");
    if (savedUsedMovieIds) {
      const ids = JSON.parse(savedUsedMovieIds) as string[];
      usedMovieIds.set(ids);
    }
  } catch (error) {
    console.error("Error loading used movie IDs:", error);
    usedMovieIds.set([]);
  }
}

// Save used movie IDs to localStorage
export function saveUsedMovieIds(): void {
  try {
    localStorage.setItem("movieGameUsedIds", JSON.stringify(get(usedMovieIds)));
  } catch (error) {
    console.error("Error saving used movie IDs:", error);
  }
}

export function loadGameHistory(): void {
  try {
    const savedHistory = localStorage.getItem("movieGameHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory) as GameHistoryEntry[];
      gameHistory.set(history);
    }
  } catch (error) {
    console.error("Error loading game history:", error);
    gameHistory.set([]);
  }
}

export function loadPhaseConfig(): void {
  try {
    const savedConfig = localStorage.getItem("gamePhaseConfig");
    if (savedConfig) {
      const config = JSON.parse(savedConfig) as PhaseConfig[];
      phaseConfig.set(config);
    } else {
      // Fall back to legacy format if no phase config exists
      const savedOrder = localStorage.getItem("gameInfoOrder");
      if (savedOrder) {
        // Convert legacy to phase config
        const legacyOrder = JSON.parse(savedOrder);
        const newConfig = convertLegacyOrderToPhaseConfig(legacyOrder);
        phaseConfig.set(newConfig);
      } else {
        // Use defaults if nothing is saved
        phaseConfig.set([...defaultPhaseConfig]);
      }
    }
  } catch (error) {
    console.error("Error loading phase configuration:", error);
    phaseConfig.set([...defaultPhaseConfig]);
  }
}

function convertLegacyOrderToPhaseConfig(legacyOrder: any[]): PhaseConfig[] {
  const newConfig = defaultPhaseConfig.map((phase) => ({
    ...phase,
    infoTypes: [] as string[],  // Explicitly type as string array
  }));

  // Assign each info to a phase based on its position in the legacy order
  legacyOrder.forEach((info, index) => {
    const phaseIndex = Math.min(Math.floor(index / 2), 5); // Up to 2 items per phase
    newConfig[phaseIndex].infoTypes.push(info.id);
  });

  return newConfig;
}

export function saveGameHistory(): void {
  try {
    localStorage.setItem("movieGameHistory", JSON.stringify(get(gameHistory)));
  } catch (error) {
    console.error("Error saving game history:", error);
  }
}

// Function to preload image
function preloadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Get a poster image path for a movie
function getPosterPath(movie: Movie): string | null {
  if (!movie) return null;
  // Convert movie title to filename format
  const titleFormatted = movie.title.replace(/\s+/g, "_").replace(/[^\w\-]/g, "_");
  const year = movie.year;
  return `/posters/${titleFormatted}_${year}.jpg`;
}

export function ensureInitialInfo(): void {
  const movie = get(currentMovie);
  if (!movie || get(revealedInfo).length > 0 || get(isLoading)) {
    return; // Skip if no movie, already have info, or loading
  }
  
  
  // Get first phase
  const phases = get(phaseConfig);
  if (phases.length === 0) {
    console.warn("No phase configuration found, using defaults");
    phaseConfig.set([...defaultPhaseConfig]);
  }
  
  const firstPhase = phases.length > 0 ? phases[0] : defaultPhaseConfig[0];
  const infoTypes = firstPhase.infoTypes;
  
  // Generate info for first phase
  const firstPhaseInfo = infoTypes.map(infoType => {
    return generateInfoItem(movie, infoType);
  }).filter(Boolean);
  
  if (firstPhaseInfo.length > 0) {
    console.log("Setting initial info in ensureInitialInfo:", firstPhaseInfo);
    revealedInfo.set(firstPhaseInfo);
    
    // Update locked status
    allPossibleInfo.update(items => {
      return items.map(item => {
        // Check if this item matches something in first phase info
        const isRevealed = firstPhaseInfo.some(
          info => info.type === item.type && 
                 (info.position === item.position || 
                  (!info.position && !item.position))
        );
        
        if (isRevealed) {
          return { ...item, locked: false };
        }
        return item;
      });
    });
  } else {
    // Fallback to year if nothing else
    const yearInfo = generateInfoItem(movie, "year");
    if (yearInfo) {
      console.log("Using fallback year info:", yearInfo);
      revealedInfo.set([yearInfo]);
    }
  }
}


// Optimized startNewGame that directly fetches today's movie
export async function startNewGame(): Promise<void> {
  try {
    isLoading.set(true);
    
    // Fetch today's movie directly from the API endpoint
    console.log("Fetching movie schedule from API...");
    const response = await fetch(`/api/movie-schedule?_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie schedule: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.todayMovie) {
      gameState.set("error");
      feedback.set(
        "No movie scheduled for today. At least 6 review clues are needed per movie."
      );
      isLoading.set(false);
      return;
    }
    
    const selectedMovie = data.todayMovie;
    
    // Ensure the movie object has properly formatted arrays
    if (selectedMovie.genres) {
      selectedMovie.genres = formatArray(selectedMovie.genres);
    }
    
    if (selectedMovie.actors) {
      selectedMovie.actors = formatArray(selectedMovie.actors);
    }
    
    // Add this movie to the used list for tracking purposes
    const movieId = selectedMovie.id || `${selectedMovie.title}-${selectedMovie.year}`;
    const currentUsedMovieIds = get(usedMovieIds);
    if (!currentUsedMovieIds.includes(movieId)) {
      usedMovieIds.update(ids => [...ids, movieId]);
      saveUsedMovieIds();
    }
    
    // Set the current movie
    currentMovie.set(selectedMovie);
    
    // Fetch the specific clues for this movie directly
    try {
      const cluesResponse = await fetch(`/api/movie-clues?movieId=${movieId}&_=${Date.now()}`);
      if (cluesResponse.ok) {
        const movieClues = await cluesResponse.json();
        
        // Apply our clue ordering strategy directly on these clues
        // Transform all clues to our expected format
        const transformedClues = movieClues.map(clue => ({
          id: clue.id,
          movieId: clue.movie_id,
          movieTitle: clue.movie_title,
          movieYear: clue.movie_year,
          clueText: clue.clue_text,
          approvedAt: clue.approved_at,
          rating: clue.rating,
          is_liked: clue.is_liked,
          reviewer: clue.reviewer || extractReviewerFromUrl(clue.review_url),
          reviewUrl: clue.review_url
        }));
        
        // Sort clues by text length (shortest first)
        const sortedClues = [...transformedClues].sort((a, b) => 
          a.clueText.length - b.clueText.length
        );
        
        // Set the sorted clues
        currentClues.set(sortedClues);
      }
    } catch (clueError) {
      console.error("Error fetching clues:", clueError);
    }

    // Preload the movie poster
    const posterPath = getPosterPath(selectedMovie);
    if (posterPath) {
      preloadedPoster.set(null); // Reset while loading
      preloadImage(posterPath)
        .then((src) => {
          preloadedPoster.set(src);
        })
        .catch((error) => {
          console.error("Failed to preload movie poster:", error);
          preloadedPoster.set(null);
        });
    }
    
    // Reset game state
    revealedClueIndex.set(1); // Show first review immediately
    guessInput.set("");
    guessCount.set(0);
    
    // Clear previous state to avoid any carryover issues
    revealedInfo.set([]);
    
    console.log("Setting up movie information...");
    
    // Initialize all possible info items (both revealed and locked)
    const allInfoItems: InfoItem[] = [];
    
    // Add items for each info type
    availableInfoTypes.forEach(infoType => {
      const infoItem = generateInfoItem(selectedMovie, infoType.id);
      if (infoItem) {
        infoItem.locked = true; // Start with all locked
        allInfoItems.push(infoItem);
      }
    });
    
    // Set all possible info
    allPossibleInfo.set(allInfoItems);
    
    // Initialize with phase 1 information - these will be unlocked
    const phases = get(phaseConfig);
    console.log("Phase config:", phases);
    
    if (phases.length === 0) {
      console.error("No phase configuration found!");
      // Fall back to default phases if none are configured
      phaseConfig.set([...defaultPhaseConfig]);
    }
    
    // Always get the first phase, which should show information at the start
    const firstPhase = phases.length > 0 ? phases[0] : defaultPhaseConfig[0];
    
    // Reveal all information for the first phase
    const firstPhaseInfo = generatePhaseInfoItems(
      selectedMovie,
      firstPhase.infoTypes
    );
    
    console.log("Initial first phase info:", firstPhaseInfo);
    
    // Ensure we always have at least one piece of information to show
    let finalFirstPhaseInfo = [...firstPhaseInfo];
    if (finalFirstPhaseInfo.length === 0) {
      console.warn("No info found for first phase, adding fallback info...");
      
      // If no info is available for the first phase, try to get the year
      const yearInfo = generateInfoItem(selectedMovie, "year");
      if (yearInfo) {
        finalFirstPhaseInfo.push(yearInfo);
      }
      
      // If still no info, try to get any available info
      if (finalFirstPhaseInfo.length === 0) {
        for (const infoType of ["firstGenre", "director", "firstActor", "rating"]) {
          const info = generateInfoItem(selectedMovie, infoType);
          if (info) {
            finalFirstPhaseInfo.push(info);
            break;
          }
        }
      }
    }
    
    console.log("Final first phase info:", finalFirstPhaseInfo);
    
    // Make sure to IMMEDIATELY set the revealed info before updating lock status
    if (finalFirstPhaseInfo.length > 0) {
      // Critical fix: Set the revealed info immediately
      revealedInfo.set(finalFirstPhaseInfo);
      
      // Update the locked status for revealed items
      const revealedTypes = finalFirstPhaseInfo.map(info => 
        getInfoTypeFromItem(info)
      ).filter(Boolean);
      
      console.log("Revealed types:", revealedTypes);
      
      // Important: Make sure to update lock status AFTER setting revealed info
      setTimeout(() => {
        updateLockedStatus(revealedTypes);
      }, 10);
    } else {
      console.error("Failed to generate any initial movie information!");
    }

    // Make sure we have at least one clue to show
    if (get(currentClues).length === 0) {
      console.log("No clues available for this movie. Using placeholder.");
      // Create a placeholder clue if none are available
      currentClues.set([{
        id: "placeholder",
        movieId: selectedMovie.id || `${selectedMovie.title}-${selectedMovie.year}`,
        movieTitle: selectedMovie.title,
        movieYear: selectedMovie.year,
        clueText: "No reviews available for this movie. Try using the movie information to guess!",
        approvedAt: new Date().toISOString()
      }]);
    }

    gameState.set("playing");
    feedback.set("");
    showDropdown.set(false);
    isLoading.set(false);
  } catch (error) {
    console.error("Error starting new game:", error instanceof Error ? error.message : String(error));
    gameState.set("error");
    feedback.set(`Failed to start a new game: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`);
    isLoading.set(false);
  }
  ensureInitialInfo();
}

// Helper function to extract reviewer from URL
function extractReviewerFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  
  const match = url.match(/letterboxd\.com\/([^\/]+)/);
  return match && match[1] ? match[1] : undefined;
}

// Update locked status for revealed info types
function updateLockedStatus(revealedTypes: string[]): void {
  console.log("Updating lock status for:", revealedTypes);
  allPossibleInfo.update(items => {
    const updatedItems = items.map(item => {
      const infoType = getInfoTypeFromItem(item);
      if (infoType && revealedTypes.includes(infoType)) {
        console.log(`Unlocking item: ${infoType}`);
        return { ...item, locked: false };
      }
      return item;
    });
    console.log("Updated all possible info items");
    return updatedItems;
  });
}

// Helper to get info type id from an item
function getInfoTypeFromItem(item: InfoItem): string {
  switch (item.type) {
    case "year":
      return "year";
    case "genre":
      if (!item.position) return "firstGenre";
      return "";
    case "actor":
      if (item.position === 1) return "firstActor";
      if (item.position === 2) return "secondActor";
      if (item.position === 3) return "thirdActor";
      return "";
    case "director":
      return "director";
    case "allGenres":
      return "allGenres";
    case "rating":
      return "rating";
    default:
      return "";
  }
}

// Generate a single info item based on info type
function generateInfoItem(movie: Movie, infoId: string): InfoItem | null {
  switch (infoId) {
    case "year":
      return { type: "year", value: movie.year };
    case "firstGenre":
      if (movie.genres && movie.genres.length > 0) {
        return { type: "genre", value: formatArray(movie.genres)[0] };
      }
      break;
    case "thirdActor":
      if (movie.actors && formatArray(movie.actors).length >= 3) {
        return { type: "actor", position: 3, value: formatArray(movie.actors)[2] };
      }
      break;
    case "director":
      if (movie.director) {
        return { type: "director", value: movie.director };
      }
      break;
    case "secondActor":
      if (movie.actors && formatArray(movie.actors).length >= 2) {
        return { type: "actor", position: 2, value: formatArray(movie.actors)[1] };
      }
      break;
    case "allGenres":
      if (movie.genres && formatArray(movie.genres).length > 0) {
        return { type: "allGenres", value: formatArray(movie.genres) };
      }
      break;
    case "firstActor":
      if (movie.actors && formatArray(movie.actors).length >= 1) {
        return { type: "actor", position: 1, value: formatArray(movie.actors)[0] };
      }
      break;
    case "rating":
      if (movie.rating) {
        return { type: "rating", value: movie.rating };
      }
      break;
  }
  return null;
}

// Helper function to generate info items based on info types
function generatePhaseInfoItems(movie: Movie, infoTypes: string[]): InfoItem[] {
  const items: InfoItem[] = [];

  infoTypes.forEach((infoId) => {
    // Generate the appropriate info item based on the info type
    const infoItem = generateInfoItem(movie, infoId);
    if (infoItem) {
      items.push(infoItem);
    }
  });

  return items;
}

export function handleGuessInput(value: string): void {
  guessInput.set(value);

  // Show dropdown even with 1 character
  if (value.length < 1) {
    filteredMovies.set([]);
    showDropdown.set(false);
    return;
  }

  const query = value.toLowerCase();
  
  // Fetch movie suggestions from API if needed
  fetch(`/api/movie-suggestions?query=${query}`)
    .then(response => response.json())
    .then(data => {
      filteredMovies.set(data);
      showDropdown.set(data.length > 0);
    })
    .catch(error => {
      console.error("Error fetching movie suggestions:", error);
      filteredMovies.set([]);
      showDropdown.set(false);
    });
}

export function selectMovie(movie: Movie): void {
  guessInput.set(movie.title);
  showDropdown.set(false);
}

export function submitGuess(): void {
  const currentGuessInput = get(guessInput);
  const currentGameState = get(gameState);

  // Only check if game is in playing state
  if (currentGameState !== "playing") return;

  const selectedMovie = get(currentMovie);
  if (!selectedMovie) return;

  const currentGuessCount = get(guessCount);
  const maxGuessCount = get(maxGuesses);

  // Only check if guess matches if the input isn't empty
  let isCorrect = false;
  if (currentGuessInput.trim() !== "") {
    const normalizedGuess = currentGuessInput.toLowerCase().trim();
    const normalizedTitle = selectedMovie.title.toLowerCase().trim();
    isCorrect = normalizedGuess === normalizedTitle;
  }

  guessCount.update((count) => count + 1);

  if (isCorrect) {
    // Correct guess!
    gameState.set("success");
    feedback.set("Correct! You guessed it!");

    // Save to game history
    const newGuessCount = get(guessCount);
    const gameRecord: GameHistoryEntry = {
      movie: selectedMovie.title,
      year: selectedMovie.year,
      guesses: newGuessCount,
      won: true,
      date: new Date().toISOString(),
    };

    gameHistory.update((history) => [gameRecord, ...history]);
    saveGameHistory();

    return;
  }

  // Wrong guess or empty guess
  if (currentGuessInput.trim() === "") {
    feedback.set("You skipped this guess.");
  } else {
    feedback.set(`Sorry, "${currentGuessInput}" is not correct.`);
  }

  guessInput.set("");
  showDropdown.set(false);

  // Reveal next clue if we haven't reached max guesses
  const newGuessCount = get(guessCount);
  if (newGuessCount < maxGuessCount) {
    revealNextPhaseInfo();
    revealNextClue();
  } else {
    // Out of guesses
    gameState.set("failed");

    // Save to game history
    const gameRecord: GameHistoryEntry = {
      movie: selectedMovie.title,
      year: selectedMovie.year,
      guesses: newGuessCount,
      won: false,
      date: new Date().toISOString(),
    };

    gameHistory.update((history) => [gameRecord, ...history]);
    saveGameHistory();
  }
}

export function revealNextClue(): void {
  const availableClues = get(currentClues);

  revealedClueIndex.update((index) => {
    if (index < availableClues.length) {
      return index + 1;
    }
    return index;
  });
}

// New function to reveal information based on the current phase
export function revealNextPhaseInfo(): void {
  const selectedMovie = get(currentMovie);
  if (!selectedMovie) return;

  const currentPhaseNum = get(guessCount); // Current phase is guess count + 1
  const phases = get(phaseConfig);

  // Make sure we don't go beyond the defined phases
  if (currentPhaseNum >= phases.length) return;

  // Get the current phase configuration
  const currentPhase = phases[currentPhaseNum];

  // Generate and add info items for this phase
  const phaseInfoItems = generatePhaseInfoItems(
    selectedMovie,
    currentPhase.infoTypes
  );

  // Update revealed info
  if (phaseInfoItems.length > 0) {
    revealedInfo.update((items) => [...items, ...phaseInfoItems]);
    
    // Update locked status for these info types
    updateLockedStatus(currentPhase.infoTypes);
  }
}

export function formatInfoForDisplay(info: InfoItem): string {
  switch (info.type) {
    case "year":
      return `${info.value}`;
    case "genre":
      return `${info.value}`;
    case "actor":
      return info.position
        ? `${getOrdinalSuffix(info.position)} Billed: ${info.value}`
        : `${info.value}`;
    case "director":
      return `Directed by ${info.value}`;
    case "allGenres":
      return Array.isArray(info.value) ? info.value.join(", ") : "";
    case "rating":
      // Return the full rating, not halved
      return `${info.value}★`;
    default:
      return "";
  }
}