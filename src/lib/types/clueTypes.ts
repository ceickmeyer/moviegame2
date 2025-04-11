// lib\types\clueTypes.ts
import type { Movie } from "$lib/utils/sentenceExtractor";

// Update in lib\types\clueTypes.ts

export interface ClueBase {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear: string | number;
  clueText: string;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string; // Username of the reviewer
  reviewUrl?: string; // URL to the original review
}

export interface ApprovedClue extends ClueBase {
  approvedAt: string;
}

export interface RejectedClue extends ClueBase {
  rejectedAt: string;
}

export type ClueStatus = "approved" | "rejected" | "unreviewed";

export interface SentenceClue {
  text: string;
  redactedText: string;
  movieId: string;
  movieTitle: string;
  movieYear: string | number;
  sentenceHash: string;
  status: ClueStatus;
  rating?: number;
  is_liked?: boolean;
  reviewer?: string;
  reviewUrl?: string;
}

export interface PageData {
  movies: Movie[];
  approvedCount: number;
  rejectedCount: number;
  error?: string;
}

export interface SubmitResult {
  success: boolean;
  message?: string;
  approvedCount?: number;
  rejectedCount?: number;
  error?: string;
}
