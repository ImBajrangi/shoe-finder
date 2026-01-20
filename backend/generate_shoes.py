import json
import random

# Hyped/cool shoe models only
SHOES = [
    # Nike Dunks & Jordans - the hypebeast staples
    {"brand": "Nike", "model": "Dunk Low", "price_range": (110, 220), "category": "lifestyle"},
    {"brand": "Nike", "model": "Dunk High", "price_range": (120, 240), "category": "lifestyle"},
    {"brand": "Jordan", "model": "Air Jordan 1 Retro High OG", "price_range": (180, 400), "category": "lifestyle"},
    {"brand": "Jordan", "model": "Air Jordan 1 Low", "price_range": (120, 200), "category": "lifestyle"},
    {"brand": "Jordan", "model": "Air Jordan 4 Retro", "price_range": (220, 380), "category": "lifestyle"},
    {"brand": "Jordan", "model": "Air Jordan 3 Retro", "price_range": (200, 320), "category": "lifestyle"},
    {"brand": "Jordan", "model": "Air Jordan 11 Retro", "price_range": (230, 400), "category": "lifestyle"},

    # New Balance - currently very trendy
    {"brand": "New Balance", "model": "550", "price_range": (110, 180), "category": "lifestyle"},
    {"brand": "New Balance", "model": "990v6", "price_range": (200, 260), "category": "lifestyle"},
    {"brand": "New Balance", "model": "2002R", "price_range": (150, 200), "category": "lifestyle"},
    {"brand": "New Balance", "model": "1906R", "price_range": (160, 210), "category": "lifestyle"},

    # Adidas hype
    {"brand": "Adidas", "model": "Samba OG", "price_range": (100, 150), "category": "lifestyle"},
    {"brand": "Adidas", "model": "Gazelle", "price_range": (100, 140), "category": "lifestyle"},
    {"brand": "Adidas", "model": "Campus 00s", "price_range": (110, 150), "category": "lifestyle"},
    {"brand": "Adidas", "model": "Yeezy Boost 350 V2", "price_range": (250, 450), "category": "lifestyle"},

    # Asics runners - very in right now
    {"brand": "Asics", "model": "Gel-Kayano 14", "price_range": (160, 220), "category": "running"},
    {"brand": "Asics", "model": "Gel-1130", "price_range": (130, 180), "category": "running"},
    {"brand": "Asics", "model": "Gel-NYC", "price_range": (150, 200), "category": "running"},

    # Salomon trail - gorpcore
    {"brand": "Salomon", "model": "XT-6", "price_range": (190, 260), "category": "trail"},
    {"brand": "Salomon", "model": "ACS Pro", "price_range": (210, 280), "category": "trail"},
    {"brand": "Salomon", "model": "XT-4 OG", "price_range": (180, 240), "category": "trail"},

    # Nike tech/dad shoes
    {"brand": "Nike", "model": "Air Max 1", "price_range": (140, 200), "category": "lifestyle"},
    {"brand": "Nike", "model": "Air Max 90", "price_range": (130, 190), "category": "lifestyle"},
    {"brand": "Nike", "model": "Air Max 97", "price_range": (180, 240), "category": "lifestyle"},
    {"brand": "Nike", "model": "Vomero 5", "price_range": (170, 220), "category": "running"},

    # Collabs & special editions vibe
    {"brand": "Nike", "model": "Air Force 1 Low", "price_range": (100, 160), "category": "lifestyle"},
    {"brand": "Nike", "model": "Blazer Mid '77", "price_range": (110, 160), "category": "lifestyle"},
]

# Trendy/specific colorways
COLORWAYS = [
    "Panda", "Chicago", "Bred", "Royal Blue", "Shadow", "University Blue",
    "Black/White", "White/Black", "Triple White", "Triple Black",
    "Grey Fog", "Sail/Cream", "Off-White", "Bone", "Sea Salt",
    "Vintage Navy", "Forest Green", "Burgundy Crush", "Light Olive",
    "Pink Foam", "Atmosphere Grey", "Cool Grey", "Wolf Grey",
    "Phantom", "Coconut Milk", "Sanddrift", "Light Bone",
    "Core Black/Gum", "Cloud White", "Onyx", "Slate Grey",
    "Rain Cloud", "Nimbus Cloud", "Silver/White", "Metallic Silver"
]

# High quality sneaker images from Unsplash
SHOE_IMAGES = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
    "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800&q=80",
    "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&q=80",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
    "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80",
    "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80",
    "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
    "https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=800&q=80",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
    "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&q=80",
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&q=80",
    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80",
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
    "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800&q=80",
    "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=80",
    "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80",
    "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
    "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055uj?w=800&q=80",
]


def generate_shoes(count=100):
    products = []
    used_combos = set()

    while len(products) < count:
        shoe = random.choice(SHOES)
        colorway = random.choice(COLORWAYS)

        # Avoid duplicate shoe+colorway combos
        combo = f"{shoe['brand']}-{shoe['model']}-{colorway}"
        if combo in used_combos:
            continue
        used_combos.add(combo)

        price = random.randint(shoe["price_range"][0], shoe["price_range"][1])
        image = random.choice(SHOE_IMAGES)

        product = {
            "id": len(products) + 1,
            "title": f"{shoe['brand']} {shoe['model']}",
            "colorway": colorway,
            "brand": shoe["brand"],
            "model": shoe["model"],
            "category": shoe["category"],
            "price": price,
            "image_url": image
        }
        products.append(product)

    return products


if __name__ == "__main__":
    products = generate_shoes(100)

    with open("shoes.json", "w") as f:
        json.dump(products, f, indent=2)

    print(f"Generated {len(products)} shoes to shoes.json")
    print("\nSample:")
    for p in products[:5]:
        print(f"  {p['title']} ({p['colorway']}) - ${p['price']}")
