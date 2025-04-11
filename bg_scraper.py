import requests
from bs4 import BeautifulSoup
import re
import time
import os
import json
import random
import sys

def get_backdrop_image(movie_url):
    """
    Extract the backdrop image URL from a Letterboxd movie page.
    
    Args:
        movie_url (str): The URL of the movie page
        
    Returns:
        tuple: (title, backdrop_url) or (title, None) if not found
    """
    print(f"  Fetching movie page: {movie_url}")
    
    # Add a User-Agent header to make the request more browser-like
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(movie_url, headers=headers)
        if response.status_code != 200:
            print(f"  Failed to fetch movie page: {response.status_code}")
            return "Unknown", None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get movie title for reference
        title_elem = soup.select_one('h1.headline-1')
        if not title_elem:
            title_elem = soup.select_one('h1.film-title')
        title = title_elem.text.strip() if title_elem else "Unknown"
        
        # METHOD 1: Find backdrop div with data-backdrop attribute
        backdrop_div = soup.select_one('div#backdrop')
        if backdrop_div and backdrop_div.get('data-backdrop'):
            backdrop_url = backdrop_div['data-backdrop']
            print(f"  Found backdrop for '{title}': {backdrop_url}")
            return title, backdrop_url
            
        # METHOD 2: Extract from backdropimage div's style attribute
        backdrop_image = soup.select_one('div.backdropimage')
        if backdrop_image and backdrop_image.get('style'):
            style = backdrop_image['style']
            match = re.search(r'background-image: url\(["\']?(.*?)["\']?\)', style)
            if match:
                backdrop_url = match.group(1)
                # Remove quotes if present
                backdrop_url = backdrop_url.strip('"\'')
                print(f"  Found backdrop for '{title}' from style: {backdrop_url}")
                return title, backdrop_url
                
        # METHOD 3: Try to find the mobile version in data-backdrop-mobile
        if backdrop_div and backdrop_div.get('data-backdrop-mobile'):
            backdrop_url = backdrop_div['data-backdrop-mobile']
            print(f"  Found mobile backdrop for '{title}': {backdrop_url}")
            return title, backdrop_url
            
        print(f"  No backdrop found for '{title}'")
        return title, None
        
    except Exception as e:
        print(f"  Error extracting backdrop: {str(e)}")
        return "Error", None

def get_movie_links_from_list(list_url, count):
    """
    Get the first N movie links from a Letterboxd list
    
    Args:
        list_url (str): URL of the Letterboxd list
        count (int): Number of movie links to extract
        
    Returns:
        list: List of movie URLs
    """
    movie_links = []
    current_page = 1
    
    # Normalize the URL
    if not list_url.endswith('/'):
        list_url = list_url + '/'
        
    print(f"Fetching list page: {list_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    while len(movie_links) < count:
        # Construct page URL
        page_url = f"{list_url}page/{current_page}/" if current_page > 1 else list_url
        
        try:
            print(f"Fetching page {current_page}: {page_url}")
            response = requests.get(page_url, headers=headers)
            
            if response.status_code != 200:
                print(f"Error fetching page {current_page}: {response.status_code}")
                break
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # DIRECT METHOD - Get film links directly (most reliable)
            film_links = []
            
            # Try to find links with data-target-link attribute first (most common in Letterboxd)
            poster_containers = soup.select('.poster-container')
            for container in poster_containers:
                film_poster = container.select_one('.film-poster')
                if film_poster:
                    target_link = film_poster.get('data-target-link')
                    if target_link and '/film/' in target_link:
                        film_links.append(target_link)
            
            # If no links found yet, try another common pattern
            if not film_links:
                film_posters = soup.select('div.film-poster')
                for poster in film_posters:
                    a_tag = poster.select_one('a')
                    if a_tag and a_tag.get('href') and '/film/' in a_tag.get('href'):
                        film_links.append(a_tag.get('href'))
            
            # Try other methods if still no links
            if not film_links:
                # Look for any link that points to a film
                film_a_tags = soup.select('a[href*="/film/"]')
                for a_tag in film_a_tags:
                    if '/film/' in a_tag.get('href'):
                        film_links.append(a_tag.get('href'))
            
            if not film_links:
                print(f"No film links found on page {current_page}")
                break
                
            print(f"Found {len(film_links)} film links on page {current_page}")
            
            # Process found links
            for link in film_links:
                if len(movie_links) >= count:
                    break
                    
                # Normalize link
                if not link.startswith('http'):
                    link = f"https://letterboxd.com{link}"
                
                # Only add if it's a film link and not already in our list
                if '/film/' in link and link not in movie_links:
                    movie_links.append(link)
            
            # Debug output
            print(f"Total movie links collected so far: {len(movie_links)}")
            
            # If we don't have enough links and there might be more pages
            if len(movie_links) < count and len(film_links) > 0:
                current_page += 1
                # Small delay between pages
                delay = 1 + random.random() * 2
                print(f"Waiting {delay:.1f} seconds before fetching next page...")
                time.sleep(delay)
            else:
                break
                
        except Exception as e:
            print(f"Error fetching page {current_page}: {str(e)}")
            break
    
    return movie_links[:count]  # Ensure we only return the requested count

def save_backdrop_image(url, title, output_dir):
    """
    Download and save a backdrop image
    
    Args:
        url (str): URL of the backdrop image
        title (str): Movie title to use in filename
        output_dir (str): Directory to save image
        
    Returns:
        str: Path to saved file or None if failed
    """
    if not url:
        return None
        
    try:
        # Create a safe filename from title
        safe_title = re.sub(r'[^\w\-]', '_', title)
        filename = f"{safe_title}_backdrop.jpg"
        filepath = os.path.join(output_dir, filename)
        
        # Download the image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        print(f"  Downloading backdrop for '{title}'")
        response = requests.get(url, headers=headers, stream=True)
        
        if response.status_code != 200:
            print(f"  Failed to download backdrop: {response.status_code}")
            return None
            
        # Check if it's actually an image
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            print(f"  Not an image: {content_type}")
            return None
            
        # Check if image is mostly black (common issue with some backdrop images)
        # Simplified check - just ensure file size is reasonable
        content_length = int(response.headers.get('Content-Length', 0))
        if content_length < 10000:  # Less than 10KB is suspicious
            print(f"  Suspiciously small image: {content_length} bytes")
            return None
            
        # Save the image
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(8192):
                f.write(chunk)
                
        print(f"  Saved backdrop to: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"  Error saving backdrop: {str(e)}")
        return None

def main():
    # Clear screen
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print("=== Letterboxd Backdrop Image Scraper ===\n")
    
    # Handle command line arguments
    if len(sys.argv) >= 3:
        list_url = sys.argv[1]
        try:
            count = int(sys.argv[2])
        except ValueError:
            count = 5
            print(f"Invalid count. Using default: {count}")
    else:
        # Prompt for inputs if not provided as arguments
        list_url = input("Enter Letterboxd list URL: ").strip()
        
        try:
            count = int(input("How many films to process from the beginning of the list? "))
            if count < 1:
                count = 5
                print(f"Invalid count. Using default: {count}")
        except ValueError:
            count = 5
            print(f"Invalid count. Using default: {count}")
    
    # Create output directory
    output_dir = "letterboxd_backdrops"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\nGetting backdrop images for the first {count} films from:\n{list_url}\n")
    
    # Step 1: Get movie links from the list
    movie_links = get_movie_links_from_list(list_url, count)
    print(f"\nFound {len(movie_links)} movie links")
    
    if not movie_links:
        print("No movies found. Check the list URL and try again.")
        input("Press Enter to exit...")
        return
    
    # Step 2: Get backdrop images for each movie
    results = []
    
    for i, movie_url in enumerate(movie_links, 1):
        print(f"\n[{i}/{len(movie_links)}] Processing: {movie_url}")
        
        # Get backdrop URL
        title, backdrop_url = get_backdrop_image(movie_url)
        
        if backdrop_url:
            # Save the image
            saved_path = save_backdrop_image(backdrop_url, title, output_dir)
            
            # Store result
            results.append({
                "title": title,
                "movie_url": movie_url,
                "backdrop_url": backdrop_url,
                "saved_path": saved_path
            })
        else:
            results.append({
                "title": title,
                "movie_url": movie_url,
                "backdrop_url": None,
                "saved_path": None
            })
        
        # Add delay to avoid rate limiting
        if i < len(movie_links):
            delay = 2 + random.random() * 2
            print(f"Waiting {delay:.1f} seconds before next request...")
            time.sleep(delay)
    
    # Step 3: Save summary to JSON file
    summary_file = os.path.join(output_dir, "backdrop_summary.json")
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n=== SUMMARY ===")
    print(f"Processed {len(movie_links)} movies")
    success_count = sum(1 for r in results if r["backdrop_url"])
    print(f"Successfully found {success_count} backdrop images")
    saved_count = sum(1 for r in results if r["saved_path"])
    print(f"Successfully saved {saved_count} backdrop images")
    print(f"\nImages saved to: {os.path.abspath(output_dir)}")
    print(f"Summary saved to: {summary_file}")
    
    # Keep console open
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()