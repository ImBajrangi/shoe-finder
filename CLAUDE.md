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

### Shaders (`src/shaders/`)

GLSL shaders use glslify for modular imports. Import noise functions with:
```glsl
#pragma glslify: snoise = require('glsl-noise/simplex/2d')
```

## Notes

- Don't run the dev server to verify changes - use lint instead
- Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`
- Custom animations defined in `globals.css` under `@theme` block
- Uses webpack mode (not Turbopack) for glslify-loader compatibility
