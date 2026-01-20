const fs = require("fs");
const path = require("path");

// We'll use node-vibrant for color extraction
// First need to install: npm install node-vibrant

async function analyzeColors() {
  const { Vibrant } = await import("node-vibrant/node");

  const shoesPath = path.join(__dirname, "../backend/shoes.json");
  const shoes = JSON.parse(fs.readFileSync(shoesPath, "utf8"));

  const results = [];

  for (let i = 0; i < shoes.length; i++) {
    const shoe = shoes[i];
    console.log(`Processing ${i + 1}/${shoes.length}: ${shoe.title}`);

    try {
      const palette = await Vibrant.from(shoe.image_url).getPalette();

      // Get the dominant swatch (usually Vibrant or Muted)
      const swatches = [
        { name: "Vibrant", swatch: palette.Vibrant },
        { name: "Muted", swatch: palette.Muted },
        { name: "DarkVibrant", swatch: palette.DarkVibrant },
        { name: "DarkMuted", swatch: palette.DarkMuted },
        { name: "LightVibrant", swatch: palette.LightVibrant },
        { name: "LightMuted", swatch: palette.LightMuted },
      ].filter((s) => s.swatch);

      // Sort by population (most dominant)
      swatches.sort((a, b) => (b.swatch?.population || 0) - (a.swatch?.population || 0));

      const dominant = swatches[0]?.swatch;

      if (dominant) {
        const [r, g, b] = dominant.rgb;
        const hex = dominant.hex;
        const colorName = getColorName(r, g, b);

        results.push({
          ...shoe,
          primary_color: colorName,
          primary_color_hex: hex,
        });

        console.log(`  -> ${colorName} (${hex})`);
      } else {
        results.push({ ...shoe, primary_color: "unknown", primary_color_hex: null });
        console.log(`  -> Could not determine color`);
      }
    } catch (err) {
      console.error(`  -> Error: ${err.message}`);
      results.push({ ...shoe, primary_color: "unknown", primary_color_hex: null });
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  // Write results
  const outputPath = path.join(__dirname, "../backend/shoes.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDone! Updated ${outputPath}`);
}

// Convert RGB to a simple color name
function getColorName(r, g, b) {
  // Convert to HSL for better color naming
  const [h, s, l] = rgbToHsl(r, g, b);

  // Check for grayscale first
  if (s < 0.1) {
    if (l < 0.2) return "black";
    if (l < 0.4) return "dark_gray";
    if (l < 0.6) return "gray";
    if (l < 0.8) return "light_gray";
    return "white";
  }

  // Check for very light (pastel) or very dark colors
  if (l > 0.85) return "white";
  if (l < 0.15) return "black";

  // Map hue to color name
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 65) return "yellow";
  if (h < 150) return "green";
  if (h < 195) return "teal";
  if (h < 255) return "blue";
  if (h < 285) return "purple";
  if (h < 345) return "pink";

  return "unknown";
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

analyzeColors().catch(console.error);
