# Shoe Finder

A 3D shoe browsing experience built with React Three Fiber. Explore collections of sneakers in an interactive grid with smooth animations, filtering, and zoom controls.

## Stack

- **Next.js 16** (Pages Router)
- **React 19**
- **React Three Fiber + Drei** — 3D rendering and helpers
- **Framer Motion** — UI animations (Dynamic Island control bar)
- **Tailwind CSS v4**
- **Leva** — debug controls

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Project Structure

```
src/
├── components/
│   ├── grid/              # 3D grid internals
│   │   ├── ShoeGrid.jsx   # Main orchestrator
│   │   ├── ShoeTile.jsx   # Individual 3D shoe tile
│   │   ├── GridCanvas.jsx # Grid layout + time-sliced mounting
│   │   ├── Rig.jsx        # Camera controls (drag/zoom)
│   │   ├── gridState.js   # Shared state + helpers
│   │   └── gridConfig.js  # Grid configuration
│   ├── GridUI.jsx         # Dynamic Island control bar
│   ├── MiniMap.jsx        # Navigation minimap
│   ├── Header.jsx         # Top header
│   └── CloseButton.jsx    # 3D close button overlay
├── pages/
│   └── index.js           # Entry point
└── styles/                # Global CSS
```
