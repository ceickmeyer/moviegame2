<!-- routes\game\components\ReviewCard.svelte -->
<script lang="ts">
    import { fly } from 'svelte/transition';
    
    // Define TypeScript interface for the clue prop
    interface ClueProps {
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
    
    export let clue: ClueProps;
    export let index: number;

    function getLetterboxdRating(rating: number | undefined): string | null {
      if (rating === null || rating === undefined) return null;
      
      // Convert to number if it's not already
      const numRating = typeof rating === 'number' ? rating : Number(rating);
      
      // Check if the conversion resulted in a valid number
      if (isNaN(numRating)) return null;
      
      // This is a user review rating (0-10 scale), so we need to halve it
      return (numRating / 2).toFixed(1);
    }
    
    // Extract the reviewer username from the review URL or use provided reviewer field
    function getReviewer(): string | null {
      if (clue.reviewer) return clue.reviewer;
      
      if (clue.reviewUrl) {
        // Extract username from URL format: https://letterboxd.com/username/film/movie-slug/
        const match = clue.reviewUrl.match(/letterboxd\.com\/([^\/]+)/);
        if (match && match[1]) return match[1];
      }
      
      return null;
    }
    
    // Generate the user profile URL instead of review URL
    function getReviewUrl(): string | null {
      if (clue.reviewUrl) {
        // Extract the username from the review URL
        const match = clue.reviewUrl.match(/letterboxd\.com\/([^\/]+)/);
        if (match && match[1]) {
          return `https://letterboxd.com/${match[1]}/`;
        }
        return clue.reviewUrl;
      }
      
      // If we have the reviewer, we can construct a URL to their profile
      const reviewer = getReviewer();
      if (reviewer) {
        return `https://letterboxd.com/${reviewer}/`;
      }
      
      return null;
    }
    
    const reviewer = getReviewer();
    const reviewUrl = getReviewUrl();
    const hasLink = !!reviewUrl;
</script>

<div class="review-card" in:fly={{ y: 20, duration: 300, delay: index * 100 }}>
    <div class="review-text">{clue.clueText}</div>
    
    <div class="review-metadata">
        {#if reviewer && hasLink}
            <div class="review-author">
                <span class="author-icon">👤</span>
                <a href={reviewUrl} target="_blank" rel="noopener noreferrer" class="author-name">
                    @{reviewer}
                </a>
            </div>
        {:else if reviewer}
            <div class="review-author">
                <span class="author-icon">👤</span>
                <span class="author-name">@{reviewer}</span>
            </div>
        {/if}
        
        {#if clue.rating}
            <div class="review-rating">
                <span class="rating-value">{getLetterboxdRating(clue.rating)}</span>
                <span class="rating-star">★</span>
            </div>
        {/if}
        
        {#if clue.is_liked}
            <div class="review-liked">
                <span class="liked-heart">♥</span>
            </div>
        {/if}
    </div>
</div>

<style>
    .review-card {
        display: block;
        background-color: rgba(44, 52, 64, 0.8);
        backdrop-filter: blur(5px);
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        margin-bottom: 1rem;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        color: inherit;
    }
    
    .review-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        background-color: rgba(50, 58, 70, 0.9);
    }
    
    .review-text {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #fff;
        padding-top: 0.5rem; /* Add top padding to avoid overlap with metadata */
        max-width: calc(100% - 200px); /* Leave space for metadata on right */
    }
    
    .review-metadata {
        display: flex;
        gap: 8px;
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        max-width: 250px; /* Limit width to prevent oversized metadata */
        flex-wrap: wrap; /* Allow items to wrap if needed */
        justify-content: flex-end; /* Align items to the right */
    }
    
    .review-author {
        background-color: rgba(33, 150, 243, 0.15);
        border-radius: 4px;
        padding: 0.3rem 0.5rem;
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }
    
    .author-icon {
        margin-right: 0.25rem;
        font-size: 0.8rem;
        flex-shrink: 0;
    }
    
    .author-name {
        color: #64B5F6;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;
    }
    
    a.author-name {
        text-decoration: underline;
        cursor: pointer;
    }
    
    a.author-name:hover {
        color: #90CAF9;
    }
    
    .review-rating {
        background-color: rgba(0, 192, 48, 0.15);
        border-radius: 4px;
        padding: 0.3rem 0.5rem;
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        flex-shrink: 0;
    }
    
    .rating-value {
        font-weight: 500;
        margin-right: 0.25rem;
    }
    
    .rating-star {
        color: #00c030;
    }
    
    .review-liked {
        background-color: rgba(255, 144, 16, 0.15);
        border-radius: 4px;
        padding: 0.3rem 0.5rem;
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        flex-shrink: 0;
    }
    
    .liked-heart {
        color: #ff9010;
    }

    /* Mobile responsiveness */
    @media (max-width: 480px) {
        .review-text {
            max-width: 100%;
            padding-top: 2.5rem; /* More space for metadata on top */
        }
        
        .review-metadata {
            max-width: 100%;
            width: calc(100% - 1.5rem);
            top: 0.5rem;
            right: 0.75rem;
            justify-content: flex-end;
        }
    }
</style>