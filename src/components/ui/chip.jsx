import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white border border-white/20",
        secondary: "bg-neutral-800 text-neutral-300 border border-neutral-700",
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
        outline: "bg-transparent text-neutral-300 border border-neutral-600",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Chip = React.forwardRef(
  ({ className, variant, size, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 rounded-full p-0.5 hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
