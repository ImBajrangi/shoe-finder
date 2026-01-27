# ShoeGrid Math Explained

A simple breakdown of how the shoe grid positions and animates items.

## 1. The Grid Layout

Think of the grid like a spreadsheet with rows and columns.

### Basic Setup
```
CONFIG.gridCols = 6      (6 items per row)
CONFIG.itemSize = 3      (each tile is 3 units wide/tall)
CONFIG.gap = 0.3         (0.3 units between tiles)
spacing = 3 + 0.3 = 3.3  (total space each tile needs)
```

### Finding Row and Column

For any item at index `i`:

```
Column = i % 6          (remainder when dividing by 6)
Row = floor(i / 6)      (how many complete rows before this item)
```

**Example with 15 items:**
```
Index:  0  1  2  3  4  5
        6  7  8  9 10 11
       12 13 14

Item 8: Column = 8 % 6 = 2, Row = floor(8/6) = 1
        → 3rd column (0-indexed), 2nd row
```

### Calculating Pixel Position

The grid is **centered at (0, 0)**, so we offset everything:

```
Total width  = 6 columns × 3.3 spacing = 19.8
Total height = 3 rows × 3.3 spacing = 9.9

X position = (column × spacing) - (width / 2) + (spacing / 2)
Y position = -(row × spacing) + (height / 2) - (spacing / 2)
```

**Why the offsets?**
- `- width/2` shifts left so center column is at x=0
- `+ spacing/2` centers each tile in its cell
- Y is negative because rows go DOWN (row 0 at top, row 2 at bottom)

**Visual:**
```
        ← width/2 →
        [-9.9]  [0]  [+9.9]
           ↑
    Row 0  ●  ●  ●  ●  ●  ●   y = +3.3
    Row 1  ●  ●  ●  ●  ●  ●   y = 0
    Row 2  ●  ●  ●           y = -3.3
           ↓
```

## 2. The Curved Surface Effect

When zoomed out, the grid curves like a bowl. Items near the edges push back in Z (into the screen).

### Distance from Center
```
distSq = x² + y²     (squared distance - no sqrt needed)
```

### Curvature Calculation
```
curveZ = -distSq × curvatureStrength × zoomRatio
```

- **Negative** because we push items BACK (negative Z = further away)
- **Squared distance** means edges curve more dramatically than middle
- **zoomRatio** fades the effect when zoomed in (no curve when close up)

**Visual (side view):**
```
Zoomed out:        Zoomed in:
    ____               ______
   /    \             |      |
  /      \            |      |
 /        \           |______|
(curved)              (flat)
```

## 3. Tile Rotation (Following the Curve)

Tiles don't just move back - they also tilt to "face" the camera, like they're painted on the curved surface.

```
rotationX = y × curvatureStrength × rotationStrength
rotationY = -x × curvatureStrength × rotationStrength
```

- Tiles above center tilt forward (positive rotX)
- Tiles below center tilt backward (negative rotX)
- Tiles on the left tilt right (negative rotY)
- Tiles on the right tilt left (positive rotY)

## 4. Zoom Levels

```
zoomIn = 8      (close up, see ~4 tiles)
zoomOut = 31    (far away, see entire grid)
```

The camera's Z position determines zoom. Higher Z = further away = more tiles visible.

### Zoom Ratio (for effects)
```
zoomRatio = (currentZoom - zoomIn) / (zoomOut - zoomIn)
```

This gives a value from 0 to 1:
- `0` = fully zoomed in
- `1` = fully zoomed out
- `0.5` = halfway

Used to fade effects (curvature, rotation) based on zoom level.

## 5. Culling (Performance)

Items far off-screen aren't rendered to save performance:

```
cullDistance = base × (zoom / 8)
visible = |x| < cullDistance AND |y| < cullDistance
```

The cull distance grows with zoom - when zoomed out, more tiles are potentially visible.

## 6. Filter Animations

When filtering (e.g., "only Jordans"), matching items flow to new positions:

1. Calculate new grid positions for **only matching items**
2. Non-matching items animate to opacity 0 and scale down
3. Matching items smoothly animate (x, y) to their new spots
4. Grid shrinks because fewer items = fewer rows

```
filteredCount = items.filter(matches).length
newRows = ceil(filteredCount / 6)
newHeight = newRows × spacing
```

## 7. Enter/Exit Animations

### Entering (grid appears)
- Start: Far back (z = -30), spread vertically, invisible
- End: Normal position, opacity 1
- Staggered: Random delay per tile (0-400ms)

### Exiting (grid disappears)
- Start: Normal position
- End: Push forward (z = +20), spread vertically, invisible
- Also staggered for organic feel

```
normalizedY = tile.y / (gridHeight / 2)   // -1 to +1
spreadY = normalizedY × spreadAmount       // top goes up, bottom goes down
```

This creates a "fan out" effect where top tiles go up and bottom tiles go down.

## Summary

| Concept | Formula | Purpose |
|---------|---------|---------|
| Column | `i % cols` | Which column (0-5) |
| Row | `floor(i / cols)` | Which row (0, 1, 2...) |
| X pos | `col × spacing - width/2` | Horizontal position (centered) |
| Y pos | `-row × spacing + height/2` | Vertical position (top-down) |
| Curve Z | `-distSq × strength` | Bowl effect when zoomed out |
| Rotation | `position × strength` | Tiles face camera on curve |
| Cull | `abs(pos) < threshold` | Skip off-screen tiles |
