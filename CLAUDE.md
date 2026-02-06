# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier (sorts Tailwind classes)
```

## Architecture

Next.js 16 app using Pages Router with a custom shadcn-style component library.

### Stack
- **React 19** with Next.js Pages Router (`src/pages/`)
- **Tailwind CSS v4** with PostCSS (config in `globals.css` using `@theme`)
- **Radix UI** primitives for accessible components
- **Motion** (Framer Motion) for animations
- **React Three Fiber + Drei** for 3D
- **glslify** for GLSL shader imports (requires webpack mode)
- **Sonner** for toasts

### Component Library (`src/components/ui/`)

All components follow shadcn patterns: Radix primitives + Tailwind + `cva` for variants.

**Barrel export:** Import from `@/components/ui` (see `index.js`)

**Key components:** Accordion, AlertDialog, Avatar, Badge, Button, Checkbox, Chip, Drawer, Separator, Sidebar, Spinner, Tooltip, Toaster

### Shaders (`src/shaders/`)

GLSL shaders use glslify for modular imports. Import noise functions with:
```glsl
#pragma glslify: snoise = require('glsl-noise/simplex/2d')
```

### Utilities

`src/lib/utils.js` exports `cn()` - merges Tailwind classes using `clsx` + `tailwind-merge`.

## Code Style

### Tailwind Classes

For long class strings, use array syntax with `cn()` for readability:

```jsx
className={cn(
  "base classes here",
  "hover and focus states",
  "responsive modifiers",
  className
)}
```

### Component Variants

Use `cva` from `class-variance-authority` for variant-based styling:

```jsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { default: "...", sm: "...", lg: "..." }
  },
  defaultVariants: { variant: "default", size: "default" }
});
```

### Voice AI (`src/hooks/useRealtimeVoice.js`)

OpenAI Realtime API via WebRTC. Key architecture:
- **Tools:** 5 tools (switch_collection, filter_shoes, set_zoom, go_back, select_shoe)
- **filter_shoes** accepts arrays for types and colors (OR logic for multi-color queries like "blue and green shoes")
- **Context-aware results:** `handleVoiceCommand` in ShoeGrid returns `{ message }` with shoe counts, notable names, and prices. These flow back to the AI as tool results so it can reference what's on screen.
- **Proactive greeting:** On session connect, a `response.create` fires to trigger an AI greeting before the user speaks.
- **Transcript display:** `VoiceTranscript` (in VoiceModeUI.jsx) is a pure presentational component. ShoeGrid manages the auto-hide timer (4s) and passes `text` prop.

## Notes

- Don't run the dev server to verify changes - use lint instead
- Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`
- Custom animations defined in `globals.css` under `@theme` block
- Uses webpack mode (not Turbopack) for glslify-loader compatibility
