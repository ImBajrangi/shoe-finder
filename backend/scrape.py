from playwright.sync_api import sync_playwright
import time
import json
import re


def scrape_goat_search(page, query, all_products, target_count, max_pages=3):
    """Scrape GOAT search results for a query with pagination."""

    for page_num in range(1, max_pages + 1):
        if len(all_products) >= target_count:
            break

        url = f"https://www.goat.com/search?query={query}&pageNumber={page_num}"
        print(f"\nSearching: {query} (page {page_num})")

        page.goto(url, wait_until='domcontentloaded', timeout=30000)
        time.sleep(5)  # Wait for dynamic content

        # Scroll more to load all products
        for _ in range(8):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(0.8)

        links = page.query_selector_all('a[href*="/sneakers/"]')
        initial_count = len(all_products)

        for link in links:
            try:
                href = link.get_attribute('href')
                if not href or '/sneakers/' not in href:
                    continue

                if 'category' in href or 'brand' in href or href == '/sneakers':
                    continue

                product_url = f"https://www.goat.com{href}" if not href.startswith('http') else href

                if any(p['product_url'] == product_url for p in all_products):
                    continue

                text_content = link.inner_text()
                lines = [l.strip() for l in text_content.split('\n') if l.strip()]

                product_name = None
                price = None

                for line in lines:
                    if '$' in line:
                        price_match = re.search(r'\$[\d,]+', line)
                        if price_match:
                            price = price_match.group(0)
                    elif re.match(r'^(19|20)\d{2}$', line) or re.match(r'^[A-Z][a-z]{2}\s+\d+$', line):
                        continue
                    elif len(line) > 5 and not line.isdigit():
                        product_name = line

                img = link.query_selector('img')
                image_url = None
                if img:
                    image_url = img.get_attribute('src')

                if product_name and image_url and 'data:image' not in image_url:
                    # Detect brand from title
                    title_lower = product_name.lower()
                    if 'new balance' in title_lower or title_lower.startswith('nb '):
                        brand = 'New Balance'
                    elif 'jordan' in title_lower or 'nike' in title_lower or 'dunk' in title_lower or 'air max' in title_lower or 'air force' in title_lower:
                        brand = 'Nike'
                    else:
                        brand = 'Other'

                    all_products.append({
                        'title': product_name,
                        'price': price,
                        'image_url': image_url,
                        'product_url': product_url,
                        'brand': brand,
                    })

            except Exception:
                continue

        new_count = len(all_products) - initial_count
        print(f"  Added {new_count} products (total: {len(all_products)})")


def scrape_goat_products(target_count=100):
    """Scrape from multiple GOAT searches."""
    all_products = []

    # Nike and New Balance
    searches = [
        "nike dunk",
        "air jordan",
        "new balance",
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()

        for query in searches:
            if len(all_products) >= target_count:
                break
            scrape_goat_search(page, query, all_products, target_count)
            time.sleep(2)

        browser.close()

    return all_products[:target_count]


if __name__ == "__main__":
    products = scrape_goat_products(target_count=72)

    print(f"\n{'='*50}")
    print(f"Total products scraped: {len(products)}")
    print(f"{'='*50}\n")

    if products:
        print("Sample products:")
        for i, p in enumerate(products[:5], 1):
            print(f"\n{i}. {p['title']}")
            print(f"   Price: {p['price']}")
            print(f"   Image: {p['image_url'][:60]}..." if p['image_url'] else "   Image: N/A")

        with open("shoes.json", "w") as f:
            json.dump(products, f, indent=2)
        print(f"\nSaved {len(products)} products to shoes.json")
