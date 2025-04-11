# letterboxd_scraper.py
import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import os
import random
import re
import langdetect
from urllib.parse import urlparse

def is_english(text):
    """
    Determine if text is English using both character analysis and language detection.
    
    Args:
        text (str): The text to check
        
    Returns:
        bool: True if the text is likely English, False otherwise
    """
    if not text or len(text) < 10:
        return False
    
    try:
        # First apply a simple heuristic as a quick filter
        if sum(ord(c) > 127 for c in text) / len(text) > 0.3:
            return False
            
        # For longer texts that pass the initial check, use language detection
        if len(text) > 50:
            lang = langdetect.detect(text)
            return lang == 'en'
        return True
    except Exception as e:
        print(f"  Language detection error: {str(e)}")
        return False  # If detection fails, skip to be safe

def scrape_letterboxd_list(list_url, limit=None):
    movies = []
    
    print(f"Fetching list page: {list_url}")
    response = requests.get(list_url)
    if response.status_code != 200:
        print(f"Failed to fetch list page: {response.status_code}")
        return movies
        
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Check for pagination
    pagination = soup.select_one('.pagination')
    pages = 1
    
    if pagination:
        last_page_link = pagination.select('li a')[-1]
        if last_page_link.text.isdigit():
            pages = int(last_page_link.text)
        print(f"Found {pages} pages of movies")
    
    total_movies_scraped = 0
    
    # Scrape each page
    for page in range(1, pages + 1):
        page_url = f"{list_url}page/{page}/" if page > 1 else list_url
        
        print(f"Scraping page {page} of {pages}: {page_url}")
        if page > 1:
            response = requests.get(page_url)
            if response.status_code != 200:
                print(f"Failed to fetch page {page}: {response.status_code}")
                continue
            soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all movie entries on current page
        film_posters = soup.select('.poster-container')
        
        print(f"Found {len(film_posters)} movies on page {page}")
        
        if limit and total_movies_scraped + len(film_posters) > limit:
            film_posters = film_posters[:limit - total_movies_scraped]
        
        for i, poster in enumerate(film_posters):
            try:
                film_element = poster.find('div', class_='film-poster')
                if not film_element:
                    print(f"[{total_movies_scraped + i + 1}] Could not find film-poster element")
                    continue
                    
                movie_link = film_element.get('data-target-link')
                if not movie_link:
                    print(f"[{total_movies_scraped + i + 1}] Could not find data-target-link attribute")
                    continue
                    
                movie_url = f"https://letterboxd.com{movie_link}"
                
                print(f"[{total_movies_scraped + i + 1}] Scraping: {movie_url}")
                
                movie_data = scrape_movie_details(movie_url)
                if movie_data:
                    movies.append(movie_data)
                    print(f"Successfully scraped data for: {movie_data['title']}")
                
                # Random delay between 2-4 seconds to avoid rate limiting
                delay = 2 + random.random() * 2
                print(f"Waiting {delay:.1f} seconds before next request...")
                time.sleep(delay)
                
            except Exception as e:
                print(f"Error scraping movie: {str(e)}")
                time.sleep(5)  # Longer delay after an error
        
        total_movies_scraped += len(film_posters)
        
        if limit and total_movies_scraped >= limit:
            print(f"Reached limit of {limit} movies")
            break
        
        # Delay between pages to be extra nice to the server
        if page < pages:
            page_delay = 5 + random.random() * 3
            print(f"Finished page {page}. Waiting {page_delay:.1f} seconds before next page...")
            time.sleep(page_delay)
    
    print(f"Total movies scraped: {len(movies)}")
    return movies

def download_movie_poster(movie_url, movie_title, year):
    """
    Download the movie poster image from the movie page using the structured JSON-LD data.
    
    Args:
        movie_url (str): The URL of the movie page
        movie_title (str): The title of the movie
        year (str): The release year
        
    Returns:
        str: Path to the saved poster or None if download failed
    """
    print(f"  Downloading poster for {movie_title} ({year})")
    try:
        # Add a User-Agent header to make the request more browser-like
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(movie_url, headers=headers)
        if response.status_code != 200:
            print(f"  Failed to fetch movie page for poster: {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Method 1: Using JSON-LD structured data (most reliable)
        img_url = None
        try:
            script_with_data = soup.select_one('script[type="application/ld+json"]')
            if script_with_data:
                # Extract and parse the JSON data
                script_text = script_with_data.text
                # Handle different text patterns in the script
                if '/*' in script_text and '*/' in script_text:
                    json_text = script_text.split('*/')[1].split('/* ]]>')[0].strip()
                else:
                    json_text = script_text.strip()
                    
                json_obj = json.loads(json_text)
                if 'image' in json_obj:
                    img_url = json_obj['image']
                    print(f"  Found image URL in JSON-LD data: {img_url}")
        except Exception as e:
            print(f"  Error extracting image from JSON-LD: {str(e)}")
            
        # Method 2: Traditional HTML parsing (fallback)
        if not img_url:
            print("  Falling back to HTML parsing for image")
            # Based on the exact HTML structure you provided
            poster_img = soup.select_one('.film-poster img, .poster img, img.image')
            
            # If that didn't work, look for any img with the specific Letterboxd URL patterns
            if not poster_img:
                all_images = soup.select('img[src*="ltrbxd.com/resized/sm/upload"], img[src*="ltrbxd.com/resized/alternative-poster"]')
                if all_images:
                    poster_img = all_images[0]  # Take the first matching image
                    
            # Last resort: any image with the movie title in alt text
            if not poster_img:
                # Using a case-insensitive search for the movie title in alt attribute
                movie_title_lower = movie_title.lower()
                all_imgs = soup.select('img[alt]')
                for img in all_imgs:
                    if movie_title_lower in img.get('alt', '').lower():
                        poster_img = img
                        break
                
            if not poster_img:
                print(f"  Could not find poster image for {movie_title}")
                return None
                
            # Get the image URL
            img_url = poster_img.get('src')
            
            # Check if there's a higher resolution in srcset
            srcset = poster_img.get('srcset')
            if srcset:
                # Extract the 2x URL if available - this handles both comma-separated
                # and space-separated srcset formats
                srcset_parts = srcset.replace(',', ' ').split()
                for i, part in enumerate(srcset_parts):
                    if i < len(srcset_parts) - 1 and '2x' in srcset_parts[i+1]:
                        potential_url = part
                        if potential_url and not potential_url.endswith('2x'):
                            img_url = potential_url
                            print(f"  Found 2x resolution image: {img_url}")
                            break
        
        if not img_url:
            print(f"  No image URL found for {movie_title}")
            return None
            
        # Create a valid filename
        # Remove special characters and spaces, keep alphanumeric, hyphens and underscores
        safe_title = re.sub(r'[^\w\-]', '_', movie_title)
        filename = f"{safe_title}_{year}.jpg"
        
        # Create images directory if it doesn't exist
        images_dir = os.path.join('static', 'images')
        if not os.path.exists(images_dir):
            os.makedirs(images_dir)
            
        file_path = os.path.join(images_dir, filename)
        
        # Download the image
        print(f"  Downloading poster from {img_url}")
        img_response = requests.get(img_url, stream=True, headers=headers)
        if img_response.status_code == 200:
            with open(file_path, 'wb') as f:
                for chunk in img_response.iter_content(1024):
                    f.write(chunk)
            print(f"  Poster saved to {file_path}")
            return file_path
        else:
            print(f"  Failed to download poster: {img_response.status_code}")
            return None
            
    except Exception as e:
        print(f"  Error downloading poster: {str(e)}")
        return None

def process_review_items(review_items, unique_reviews, review_limit=100):
    """
    Process a list of review elements and add them to the unique_reviews dictionary.
    
    Args:
        review_items: List of review elements from BeautifulSoup
        unique_reviews: Dictionary of reviews keyed by URL or text
        review_limit: Maximum number of reviews to collect
    """
    for item in review_items:
        # Get review text
        review_text = item.select_one('.js-review-body')
        text = ""
        if review_text:
            paragraphs = review_text.select('p')
            if paragraphs:
                text = " ".join([p.text.strip() for p in paragraphs])
            else:
                text = review_text.text.strip()
        
        # Skip non-English reviews
        if not is_english(text):
            continue
        
        # Skip empty reviews
        if not text.strip():
            continue
        
        # Get review URL - we'll use this as a unique identifier
        review_url = ""
        review_link = item.select_one('a.context')
        if review_link:
            review_url = "https://letterboxd.com" + review_link.get('href')
            
        # If no URL, use text as key (fallback)
        key = review_url if review_url else text[:100]
        
        # Skip if we already have this review
        if key in unique_reviews:
            continue
            
        # Get rating information
        rating_elem = item.select_one('.rating')
        review_rating = ""
        has_rating = False
        if rating_elem:
            has_rating = True
            rating_class = rating_elem.get('class', [])
            for cls in rating_class:
                if cls.startswith('rated-'):
                    review_rating = cls.replace('rated-', '')
                    break
        
        # Check if reviewer liked the movie
        is_review_liked = False
        liked_icon = item.select_one('.has-icon.icon-liked')
        if liked_icon:
            is_review_liked = True
            
        # Get like count for the review
        like_count_elem = item.select_one('.like-count')
        likes = 0
        if like_count_elem:
            likes_text = like_count_elem.text.strip()
            # Extract numbers from text like "123 likes"
            likes = int(re.search(r'\d+', likes_text).group(0)) if re.search(r'\d+', likes_text) else 0
        
        # Add to unique reviews dictionary
        unique_reviews[key] = {
            "text": text,
            "rating": review_rating,
            "has_rating": has_rating,
            "is_liked": is_review_liked,
            "likes": likes,
            "url": review_url
        }
        
        if len(unique_reviews) >= review_limit:
            print(f"  Reached review limit of {review_limit}")
            break

def scrape_movie_details(movie_url):
    print(f"  Fetching movie page: {movie_url}")
    try:
        # Add a User-Agent header to make the request more browser-like
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(movie_url, headers=headers)
        if response.status_code != 200:
            print(f"  Failed to fetch movie page: {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Title
        title_elem = soup.select_one('h1.headline-1')
        if not title_elem:
            title_elem = soup.select_one('h1.film-title')
        title = title_elem.text.strip() if title_elem else "Unknown"
        print(f"  Title: {title}")
        
        # Year
        year_elem = soup.select_one('a[href^="/films/year/"]')
        year = year_elem.text.strip() if year_elem else "Unknown"
        print(f"  Year: {year}")
        
        # Rating
        rating_elem = soup.select_one('meta[name="twitter:data2"]')
        rating = rating_elem['content'].split(' ')[0] if rating_elem else "Not rated"
        print(f"  Rating: {rating}")
        
        # Genres - specific to genre links
        genres = []
        genre_links = soup.select('a[href^="/films/genre/"]')
        for link in genre_links:
            genres.append(link.text.strip())
        print(f"  Genres: {genres}")
        
        # Director - try multiple approaches
        director = "Unknown"
        # First try .contributor with director in href
        director_elem = soup.select_one('a.contributor[href*="/director/"]')
        if director_elem:
            prettify_span = director_elem.select_one('.prettify')
            if prettify_span:
                director = prettify_span.text.strip()
            else:
                director = director_elem.text.strip()
        else:
            # Fallback to previous method
            director_elem = soup.select_one('.film-header-lockup .directors a')
            if director_elem:
                director = director_elem.text.strip()
        
        print(f"  Director: {director}")
        
        # Top billed actors - get 5
        actors = []
        cast_container = soup.select_one('.cast-list')
        if cast_container:
            actor_links = cast_container.select('a.text-slug')
            for i, actor in enumerate(actor_links):
                if i < 5:  # Get top 5 actors
                    # Get character name from tooltip
                    character = actor.get('data-original-title', '').strip()
                    actor_name = actor.text.strip()
                    actor_info = actor_name
                    if character and character != "(uncredited)":
                        actor_info += f" as {character}"
                    actors.append(actor_info)
                else:
                    break
        print(f"  Actors: {actors}")
        
        # Check if the movie is liked by looking for the icon-liked class
        is_liked = False
        liked_icon = soup.select_one('.has-icon.icon-liked')
        if liked_icon:
            is_liked = True
        print(f"  Movie Liked: {is_liked}")
        
        # Download movie poster
        poster_path = download_movie_poster(movie_url, title, year)
        
        # Use a dictionary to track unique reviews by URL
        unique_reviews = {}
        review_limit = 100      # Increased from 40 to 100
        min_reviews = 50        # Increased from 20 to 50
        max_pages_to_try = 20   # Increased from 10 to 20
        
        # Process reviews from main movie page
        review_items = soup.select('li.film-detail')
        print(f"  Found {len(review_items)} reviews on movie page")
        
        # Process reviews from the initial movie page
        process_review_items(review_items, unique_reviews, review_limit)
        
        # If we need more reviews, try different sorting methods
        sort_methods = [
            ('activity', 'by/activity/'),  # Popular reviews
            ('added', 'by/added/'),        # Recent reviews
            ('rating-highest', 'by/rating-highest/'),  # Highest rated reviews
            ('rating-lowest', 'by/rating-lowest/')     # Lowest rated reviews
        ]
        
        # Try each sort method if we need more reviews
        for sort_name, sort_path in sort_methods:
            if len(unique_reviews) >= min_reviews:
                print(f"  Already have {len(unique_reviews)} reviews, skipping {sort_name} sort")
                continue
                
            reviews_url = f"{movie_url}/reviews/{sort_path}"
            print(f"  Trying to get more reviews from {sort_name} sort: {reviews_url}")
            
            try:
                # Process first page of reviews
                response = requests.get(reviews_url, headers=headers)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    page_reviews = soup.select('li.film-detail')
                    print(f"  Found {len(page_reviews)} reviews on {sort_name} reviews page")
                    
                    process_review_items(page_reviews, unique_reviews, review_limit)
                    
                    # Follow pagination with the Next link if needed
                    current_page = 1
                    max_pages = max_pages_to_try
                    
                    while len(unique_reviews) < review_limit and current_page < max_pages:
                        # Look for the Next button
                        next_link = soup.select_one('a.next')
                        if not next_link:
                            print(f"  No more Next links found for {sort_name} sort")
                            break
                            
                        # Found a Next link, follow it
                        next_url = "https://letterboxd.com" + next_link['href']
                        current_page += 1
                        print(f"  Following Next link to page {current_page} for {sort_name} sort: {next_url}")
                        
                        page_response = requests.get(next_url, headers=headers)
                        if page_response.status_code != 200:
                            print(f"  Failed to fetch reviews page {current_page}: {page_response.status_code}")
                            break
                            
                        soup = BeautifulSoup(page_response.text, 'html.parser')
                        page_reviews = soup.select('li.film-detail')
                        print(f"  Found {len(page_reviews)} reviews on {sort_name} sort page {current_page}")
                        
                        process_review_items(page_reviews, unique_reviews, review_limit)
                        
                        # Delay between pages
                        delay = 2 + random.random() * 2
                        print(f"  Waiting {delay:.1f} seconds before next page...")
                        time.sleep(delay)
                        
                        if len(unique_reviews) >= review_limit:
                            print(f"  Reached review limit of {review_limit} reviews on {sort_name} sort page {current_page}")
                            break
            except Exception as e:
                print(f"  Error fetching paginated reviews for {sort_name} sort: {str(e)}")
                time.sleep(3)  # Wait a bit before trying the next sort method
        
        # Convert dictionary to list and sort by likes
        reviews_list = list(unique_reviews.values())
        reviews_list.sort(key=lambda x: x.get("likes", 0), reverse=True)
        
        print(f"  Total unique reviews collected: {len(reviews_list)}")
        
        return {
            "title": title,
            "year": year,
            "rating": rating,
            "genres": genres,
            "director": director,
            "actors": actors,
            "poster_path": poster_path,
            "is_liked": is_liked,
            "reviews": reviews_list[:review_limit]
        }
    except Exception as e:
        print(f"Error processing movie: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python letterboxd_scraper.py <list_url> [limit]")
        sys.exit(1)
        
    list_url = sys.argv[1]
    limit = None  # Default to no limit
    
    if len(sys.argv) > 2:
        try:
            limit = int(sys.argv[2])
            print(f"Will scrape up to {limit} movies")
        except ValueError:
            print(f"Invalid limit: {sys.argv[2]}. Will scrape all movies.")
    
    # Create static directory if it doesn't exist
    static_dir = 'static'
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)
    
    print(f"Starting scrape of {list_url}")
    start_time = time.time()
    
    movies = scrape_letterboxd_list(list_url, limit)
    
    end_time = time.time()
    duration = end_time - start_time
    
    output_file = os.path.join(static_dir, 'letterboxd_movies.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    
    print(f"Scraped {len(movies)} movies in {duration:.1f} seconds")
    print(f"Data saved to {output_file}")
    print(f"Movie posters saved to {os.path.join(static_dir, 'images')}")