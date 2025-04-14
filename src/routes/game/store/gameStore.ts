// routes\game\store\gameStore.ts
import {
  writable,
  derived,
  get,
  type Writable,
  type Readable,
} from "svelte/store";
import type { Movie } from "$lib/utils/sentenceExtractor";
import type { ApprovedClue } from "$lib/types/clueTypes";
import { getMovies, getApprovedClues } from "$lib/data";

export const preloadedPoster: Writable<string | null> = writable(null);
export const usedMovieIds: Writable<string[]> = writable([]);

function getPosterPath(movie: Movie): string | null {
  if (!movie) return null;
  // Convert movie title to filename format
  const titleFormatted = movie.title
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "_");
  const year = movie.year;
  return `/posters/${titleFormatted}_${year}.jpg`;
}

function preloadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Define types for game-specific data structures
export type GameState = "ready" | "playing" | "success" | "failed" | "error";

export interface GameClue {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear: string | number;
  clueText: string;
  approvedAt: string;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string; // Add this field to store the reviewer username
  reviewUrl?: string; // Add this field to store the review URL
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
  { id: "rating", type: "rating", description: "Letterboxd Rating" },
];

// Game stores with type annotations
export const gameState: Writable<GameState> = writable("ready");
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
export const feedback: Writable<string> = writable("");
export const showDropdown: Writable<boolean> = writable(false);
export const gameHistory: Writable<GameHistoryEntry[]> = writable([]);
export const phaseConfig: Writable<PhaseConfig[]> = writable([
  ...defaultPhaseConfig,
]);

// Derived stores
export const displayableClues: Readable<GameClue[]> = derived(
  [currentClues, revealedClueIndex],
  ([$currentClues, $revealedClueIndex]) => {
    return $currentClues.slice(0, $revealedClueIndex);
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

// Game actions
// Update this function in your gameStore.ts file

export function loadGameData(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // First try the API endpoint which now works with Supabase
      try {
        console.log("Loading movies and clues from API endpoints...");
        const [moviesResponse, cluesResponse] = await Promise.all([
          fetch('/api/clues-data?type=movies'),
          fetch('/api/clues-data?type=approved')
        ]);
        
        if (!moviesResponse.ok || !cluesResponse.ok) {
          throw new Error('API endpoints failed');
        }
        
        const moviesData: Movie[] = await moviesResponse.json();
        const cluesResponseData = await cluesResponse.json();
        const cluesData: ApprovedClue[] = cluesResponseData.map((clue: any) => ({
          ...clue,
          rating: clue.rating ? Number(clue.rating) : 0
        }));
        
        allMovies.set(moviesData);
        approvedClues.set(cluesData);
        
        console.log("Successfully loaded data from API endpoints");
      } catch (apiError) {
        console.log("API endpoints failed:", apiError);
        reject(new Error("Could not load game data"));
        return;
      }

      // Load game history from localStorage
      loadGameHistory();

      // Load phase configuration from localStorage
      loadPhaseConfig();

      // Load used movie IDs from localStorage
      loadUsedMovieIds();

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

// Get a date-based seed for consistent daily movie selection
function getDailyMovieSeed(): string {
  const now = new Date();
  // Format as YYYY-MM-DD to change daily
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// Get a deterministic random number from a string seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Normalize to 0-1 range
  return (hash & 0x7fffffff) / 0x7fffffff;
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

// Modified to implement clue ordering strategy (shorter first with randomness)
export async function startNewGame(): Promise<void> {
  try {
    // Fetch today's movie directly from the API endpoint
    // This ensures we use exactly the same movie as shown on the dashboard
    console.log("Fetching movie schedule from API...");
    const response = await fetch(`/api/movie-schedule?_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie schedule: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Movie schedule data received:", data);
    
    if (!data.todayMovie) {
      gameState.set("error");
      feedback.set(
        "No movie scheduled for today. At least 6 review clues are needed per movie."
      );
      return;
    }
    
    const selectedMovie = data.todayMovie;
    
    // Add this movie to the used list for tracking purposes
    const movieId = selectedMovie.id || `${selectedMovie.title}-${selectedMovie.year}`;
    const currentUsedMovieIds = get(usedMovieIds);
    if (!currentUsedMovieIds.includes(movieId)) {
      usedMovieIds.update(ids => [...ids, movieId]);
      saveUsedMovieIds();
    }
    
    // Set the current movie
    currentMovie.set(selectedMovie);
    
    // Get the approved clues for this movie
    const approvedCluesData = get(approvedClues);

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
    
    // Find all approved clues for this movie
    const movieClues = approvedCluesData.filter(
      (clue) =>
        clue.movieId ===
        (selectedMovie.id || `${selectedMovie.title}-${selectedMovie.year}`)
    ) as GameClue[];

  // Implementation of the clue ordering strategy:
  // 1. Split clues into three groups based on length
  const cluesByLength = movieClues.reduce(
    (groups, clue) => {
      const textLength = clue.clueText.length;

      // Make sure to carry over reviewer and reviewUrl properties
      const processedClue = {
        ...clue,
        reviewer: clue.reviewer || extractReviewerFromUrl(clue.reviewUrl),
        reviewUrl: clue.reviewUrl,
      };

      if (textLength < 100) {
        groups.short.push(processedClue);
      } else if (textLength < 200) {
        groups.medium.push(processedClue);
      } else {
        groups.long.push(processedClue);
      }
      return groups;
    },
    {
      short: [] as GameClue[],
      medium: [] as GameClue[],
      long: [] as GameClue[],
    }
  );

  // Helper function to extract a reviewer username from a Letterboxd URL
  function extractReviewerFromUrl(url?: string): string | undefined {
    if (!url) return undefined;

    const match = url.match(/letterboxd\.com\/([^\/]+)/);
    return match && match[1] ? match[1] : undefined;
  }
  // 2. Shuffle each group for randomness
  const shuffledShort = shuffleArray(cluesByLength.short);
  const shuffledMedium = shuffleArray(cluesByLength.medium);
  const shuffledLong = shuffleArray(cluesByLength.long);

  // 3. Combine the groups, starting with short clues, then medium, then long
  const sortedClues = [...shuffledShort, ...shuffledMedium, ...shuffledLong];

  // Set the sorted clues
  currentClues.set(sortedClues);

  // Reset game state
  revealedClueIndex.set(1); // Show first review immediately
  guessInput.set("");
  guessCount.set(0);

  // Initialize with phase 1 information
  const phases = get(phaseConfig);
  const firstPhase = phases[0];

  // Reveal all information for the first phase
  const firstPhaseInfo = generatePhaseInfoItems(
    selectedMovie,
    firstPhase.infoTypes
  );
  revealedInfo.set(firstPhaseInfo);

    gameState.set("playing");
    feedback.set("");
    showDropdown.set(false);
  } catch (error) {
    console.error("Error starting new game:", error instanceof Error ? error.message : String(error));
    gameState.set("error");
    feedback.set(`Failed to start a new game: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`);
  }
}

export function startSpecificGame(specificMovie: Movie): void {
  // Set the specified movie as current
  currentMovie.set(specificMovie);

  // Get movie ID - either from the ID field or generate one from title+year
  const movieId =
    specificMovie.id || `${specificMovie.title}-${specificMovie.year}`;

  // Preload poster if available
  const posterPath = getPosterPath(specificMovie);
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

  // Find all approved clues for this movie
  const approvedCluesData = get(approvedClues);
  const movieClues = approvedCluesData.filter(
    (clue) => clue.movieId === movieId
  ) as GameClue[];

  // If we don't have enough clues, show an error
  if (movieClues.length < 6) {
    gameState.set("error");
    feedback.set(
      "Not enough clues for this movie. At least 6 review clues are needed."
    );
    return;
  }

  // Implementation of the clue ordering strategy:
  // 1. Split clues into three groups based on length
  const cluesByLength = movieClues.reduce(
    (groups, clue) => {
      const textLength = clue.clueText.length;

      // Make sure to carry over reviewer and reviewUrl properties
      const processedClue = {
        ...clue,
        reviewer: clue.reviewer || extractReviewerFromUrl(clue.reviewUrl),
        reviewUrl: clue.reviewUrl,
      };

      if (textLength < 100) {
        groups.short.push(processedClue);
      } else if (textLength < 200) {
        groups.medium.push(processedClue);
      } else {
        groups.long.push(processedClue);
      }
      return groups;
    },
    {
      short: [] as GameClue[],
      medium: [] as GameClue[],
      long: [] as GameClue[],
    }
  );

  // Helper function to extract a reviewer username from a Letterboxd URL
  function extractReviewerFromUrl(url?: string): string | undefined {
    if (!url) return undefined;

    const match = url.match(/letterboxd\.com\/([^\/]+)/);
    return match && match[1] ? match[1] : undefined;
  }

  // 2. Shuffle each group for randomness
  const shuffledShort = shuffleArray(cluesByLength.short);
  const shuffledMedium = shuffleArray(cluesByLength.medium);
  const shuffledLong = shuffleArray(cluesByLength.long);

  // 3. Combine the groups, starting with short clues, then medium, then long
  const sortedClues = [...shuffledShort, ...shuffledMedium, ...shuffledLong];

  // Set the sorted clues
  currentClues.set(sortedClues);

  // Reset game state
  revealedClueIndex.set(1); // Show first review immediately
  guessInput.set("");
  guessCount.set(0);

  // Initialize with phase 1 information
  const phases = get(phaseConfig);
  const firstPhase = phases[0];

  // Reveal all information for the first phase
  const firstPhaseInfo = generatePhaseInfoItems(
    specificMovie,
    firstPhase.infoTypes
  );
  revealedInfo.set(firstPhaseInfo);

  gameState.set("playing");
  feedback.set("");
  showDropdown.set(false);
}

/**
 * Start a game from a movie ID (may be obfuscated)
 * @param movieIdParam The movie ID parameter from the URL
 */
export function startGameFromMovieId(movieIdParam: string): boolean {
  const allMoviesData = get(allMovies);
  if (!allMoviesData || allMoviesData.length === 0) {
    return false;
  }

  // Try to decode the obfuscated ID
  let decodedId;
  try {
    decodedId = atob(movieIdParam);
  } catch (e) {
    // If it's not base64, try the old format for backward compatibility
    decodedId = movieIdParam;
  }

  // Find the specific movie
  let movie: Movie | undefined;

  if (decodedId.startsWith("id:")) {
    // It's an ID-based reference
    const actualId = decodedId.substring(3);
    movie = allMoviesData.find((m) => m.id === actualId);
  } else if (decodedId.startsWith("title:")) {
    // It's a title+year reference
    const titleYearString = decodedId.substring(6);
    const [title, yearStr] = titleYearString.split(":");
    movie = allMoviesData.find(
      (m) => m.title === title && m.year.toString() === yearStr
    );
  } else {
    // Fallback: try direct ID match
    movie = allMoviesData.find((m) => m.id === movieIdParam);

    // If not found, try matching by slug from title and year
    if (!movie) {
      movie = allMoviesData.find((m) => {
        const slugTitle = m.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        const generatedId = `${slugTitle}-${m.year}`;
        return generatedId === movieIdParam;
      });
    }
  }

  if (movie) {
    startSpecificGame(movie);
    return true;
  }

  return false;
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
  const allMoviesData = get(allMovies);

  const filtered = allMoviesData
    .filter((movie) => movie.title.toLowerCase().includes(query))
    .sort((a, b) => {
      // Prioritize exact matches and starts-with matches
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      if (aTitle === query && bTitle !== query) return -1;
      if (bTitle === query && aTitle !== query) return 1;
      if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
      if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;

      return aTitle.localeCompare(bTitle);
    })
    .slice(0, 12); // Increased from 8 to 12 results

  filteredMovies.set(filtered);
  showDropdown.set(filtered.length > 0);
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
  }
}

// Helper function to generate info items based on info types
function generatePhaseInfoItems(movie: Movie, infoTypes: string[]): InfoItem[] {
  const items: InfoItem[] = [];

  infoTypes.forEach((infoId) => {
    // Skip if this info type has already been revealed
    if (isInfoAlreadyRevealed(infoId)) return;

    // Generate the appropriate info item based on the info type
    switch (infoId) {
      case "year":
        items.push({ type: "year", value: movie.year });
        break;
      case "firstGenre":
        if (movie.genres && movie.genres.length > 0) {
          items.push({ type: "genre", value: movie.genres[0] });
        }
        break;
      case "thirdActor":
        if (movie.actors && movie.actors.length >= 3) {
          items.push({ type: "actor", position: 3, value: movie.actors[2] });
        }
        break;
      case "director":
        if (movie.director) {
          items.push({ type: "director", value: movie.director });
        }
        break;
      case "secondActor":
        if (movie.actors && movie.actors.length >= 2) {
          items.push({ type: "actor", position: 2, value: movie.actors[1] });
        }
        break;
      case "allGenres":
        if (movie.genres && movie.genres.length > 0) {
          items.push({ type: "allGenres", value: movie.genres });
        }
        break;
      case "firstActor":
        if (movie.actors && movie.actors.length >= 1) {
          items.push({ type: "actor", position: 1, value: movie.actors[0] });
        }
        break;
      case "rating":
        if (movie.rating) {
          items.push({ type: "rating", value: movie.rating });
        }
        break;
    }
  });

  return items;
}

// Helper function to check if info is already revealed
function isInfoAlreadyRevealed(infoId: string): boolean {
  const revealedItems = get(revealedInfo);

  switch (infoId) {
    case "year":
      return revealedItems.some((item) => item.type === "year");
    case "firstGenre":
      return revealedItems.some(
        (item) => item.type === "genre" && !item.position
      );
    case "thirdActor":
      return revealedItems.some(
        (item) => item.type === "actor" && item.position === 3
      );
    case "director":
      return revealedItems.some((item) => item.type === "director");
    case "secondActor":
      return revealedItems.some(
        (item) => item.type === "actor" && item.position === 2
      );
    case "allGenres":
      return revealedItems.some((item) => item.type === "allGenres");
    case "firstActor":
      return revealedItems.some(
        (item) => item.type === "actor" && item.position === 1
      );
    case "rating":
      return revealedItems.some((item) => item.type === "rating");
    default:
      return false;
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
