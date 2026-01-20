# Next.js Component Library Boilerplate

A modern Next.js starter with a custom shadcn-style component library, 3D capabilities, and animations.

## Stack

- **Next.js 16** (Pages Router)
- **React 19**
- **Tailwind CSS v4**
- **Radix UI** primitives
- **Motion** (Framer Motion)
- **React Three Fiber + Drei**
- **Sonner** (toasts)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the component showcase.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier (auto-sorts Tailwind) |

## Component Library

All components live in `src/components/ui/` and follow shadcn patterns.

```jsx
import { Button, Badge, Tooltip } from "@/components/ui";
```

### Available Components

- **Layout:** Sidebar, Separator
- **Feedback:** Spinner, Toaster (Sonner), AlertDialog
- **Inputs:** Button, Checkbox
- **Display:** Avatar, Badge, Chip, Accordion, Tooltip
- **Overlay:** Drawer

### Creating Components

Use `cn()` for class merging and `cva` for variants:

```jsx
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const variants = cva("base-classes", {
  variants: {
    size: { sm: "text-sm", lg: "text-lg" }
  }
});

export function MyComponent({ size, className }) {
  return <div className={cn(variants({ size }), className)} />;
}
```

## Project Structure

```
src/
├── components/ui/    # Component library
├── lib/utils.js      # cn() utility
├── pages/            # Next.js pages
└── styles/           # Global CSS + Tailwind theme
```
