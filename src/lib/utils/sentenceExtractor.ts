// lib\utils\sentenceExtractor.ts
// Define types for the movie object
export interface Movie {
  id?: string;
  title: string;
  year: number;
  director?: string;
  actors?: string[];
  genres?: string[];
  rating?: number;
  reviews?: MovieReview[];
  watchCount?: number;
  likeCount?: number;
}

// Update in lib\utils\sentenceExtractor.ts

export interface MovieReview {
  text: string;
  rating?: number;
  author?: string;
  url?: string; // Add the URL field
  is_liked?: boolean; // Ensure this field is included
}

/**
 * Extracts sentences from a review text
 * @param {string} text - The review text
 * @returns {string[]} - Array of sentences
 */
export function extractSentences(text: string): string[] {
  if (!text) return [];

  // Step 1: Preprocess text to handle special cases
  // Handle ellipses before splitting (common in movie reviews)
  let processedText = text.replace(/\.{3,}/g, "<ELLIPSIS>");

  // Handle common abbreviations to avoid incorrect splitting
  processedText = processedText
    .replace(/Mr\./g, "Mr<DOT>")
    .replace(/Mrs\./g, "Mrs<DOT>")
    .replace(/Dr\./g, "Dr<DOT>")
    .replace(/Ms\./g, "Ms<DOT>")
    .replace(/etc\./g, "etc<DOT>")
    .replace(/vs\./g, "vs<DOT>")
    .replace(/i\.e\./g, "i<DOT>e<DOT>")
    .replace(/e\.g\./g, "e<DOT>g<DOT>")
    .replace(/No\.\s*\d+/g, (match) => match.replace(".", "<DOT>")) // Handle "No. 1", "No. 2", etc.
    .replace(/\b\d+\./g, (match) => match.replace(".", "<DOT>")); // Handle numbered lists

  // First, split the text into paragraphs
  const paragraphs = processedText.split(/\n\n+/);

  let allSentences: string[] = [];

  // Process each paragraph
  paragraphs.forEach((paragraph) => {
    // Improved sentence splitting regex that handles more cases:
    // 1. Properly handles sentences starting with numbers
    // 2. Accounts for quotes and parentheses
    // 3. Better handling of special characters

    // This pattern looks for:
    // - A period, exclamation point, or question mark
    // - Optionally followed by a closing quote or parenthesis
    // - Followed by whitespace
    // - Followed by the start of a new sentence (capital letter, number, quote, etc.)
    const sentenceSplits = paragraph.split(
      /(?<=[.!?][\"\'\)\]]?)\s+(?=[A-Z0-9\"\'\(\[]|$)/
    );

    // Process each potential sentence
    sentenceSplits.forEach((sentence) => {
      // Restore original characters
      const processed = sentence
        .replace(/<ELLIPSIS>/g, "...")
        .replace(/<DOT>/g, ".")
        .trim();

      // Filter out very short sentences and empty ones
      // But ensure we're not too restrictive - some valid sentences might be just 10-15 chars
      if (processed.length > 8) {
        allSentences.push(processed);
      }
    });
  });

  // Final check: Merge sentences that were incorrectly split
  // This happens with sentences like "Chapter 1. The beginning" where the number followed by
  // a period isn't actually the end of a sentence
  const mergedSentences: string[] = [];
  let currentSentence = "";

  allSentences.forEach((sentence, index) => {
    // If the current sentence is very short and the next sentence starts with a lowercase letter,
    // they probably belong together
    if (
      index < allSentences.length - 1 &&
      sentence.length < 20 &&
      /^[a-z]/.test(allSentences[index + 1])
    ) {
      currentSentence += sentence + " ";
    } else if (currentSentence) {
      // Add the accumulated sentence and reset
      mergedSentences.push(currentSentence + sentence);
      currentSentence = "";
    } else {
      // Regular case - just add the sentence
      mergedSentences.push(sentence);
    }
  });

  return mergedSentences;
}

/**
 * Redacts sensitive information from a sentence that might give away the answer
 * Modified to collapse multiple consecutive [REDACTED] tags into a single one
 * @param {string} sentence - The sentence to redact
 * @param {Movie} movie - The movie object containing title, director, actors
 * @returns {string} - Redacted sentence
 */
export function redactSensitiveInfo(sentence: string, movie: Movie): string {
  if (!sentence || !movie) return sentence;

  let redactedSentence = sentence;

  // Redact movie title - including partial matches
  if (movie.title) {
    // Split the title into words for more thorough redaction
    const titleWords = movie.title
      .split(/\s+/)
      .filter((word) => word.length > 3);
    titleWords.forEach((word) => {
      // Case insensitive replacement
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      redactedSentence = redactedSentence.replace(regex, "[REDACTED]");
    });

    // Also try to redact the full title
    // Escape special regex characters in the title
    const escapedTitle = movie.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleRegex = new RegExp(escapedTitle, "gi");
    redactedSentence = redactedSentence.replace(titleRegex, "[REDACTED]");
  }

  // Redact director name
  if (movie.director) {
    // Split director name to handle last names
    const directorParts = movie.director.split(/\s+/);
    directorParts.forEach((part) => {
      if (part.length > 3) {
        const regex = new RegExp(`\\b${part}\\b`, "gi");
        redactedSentence = redactedSentence.replace(regex, "[REDACTED]");
      }
    });
  }

  // Redact actor names
  if (movie.actors && Array.isArray(movie.actors)) {
    movie.actors.forEach((actor) => {
      // Split actor name to handle last names
      const actorParts = actor.split(/\s+/);
      actorParts.forEach((part) => {
        if (part.length > 3) {
          const regex = new RegExp(`\\b${part}\\b`, "gi");
          redactedSentence = redactedSentence.replace(regex, "[REDACTED]");
        }
      });
    });
  }

  // Also redact year of the movie if it appears as a specific reference
  if (movie.year) {
    const yearRegex = new RegExp(`\\b${movie.year}\\b`, "g");
    redactedSentence = redactedSentence.replace(yearRegex, "[YEAR]");
  }

  // NEW: Collapse multiple consecutive [REDACTED] tags into a single one
  // This handles cases like "[REDACTED] [REDACTED]" and makes them just "[REDACTED]"
  // Also handles cases with whitespace between them
  redactedSentence = redactedSentence.replace(/(\[REDACTED\]\s*)+/g, "[REDACTED] ");

  return redactedSentence;
}

/**
 * Gets pairs of consecutive sentences that would make good clues
 * @param {string} text - The review text
 * @returns {string[]} - Array of sentence pairs (2 sentences max)
 */
export function getSentencePairs(text: string): string[] {
  const sentences = extractSentences(text);
  const pairs: string[] = [];

  // Generate individual sentences and pairs of two consecutive sentences
  for (let i = 0; i < sentences.length; i++) {
    // Add single sentence if it's substantial enough
    if (sentences[i].length > 20) {
      pairs.push(sentences[i]);
    }

    // Add pair of sentences
    if (i < sentences.length - 1) {
      const pair = `${sentences[i]} ${sentences[i + 1]}`;
      // Only add if combined length is reasonable for a clue
      if (pair.length <= 200) {
        pairs.push(pair);
      }
    }
  }

  return pairs;
}
