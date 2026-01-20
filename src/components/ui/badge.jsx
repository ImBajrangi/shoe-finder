import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "bg-white text-black",
      secondary: "bg-neutral-800 text-neutral-300",
      success: "bg-emerald-500/20 text-emerald-400",
      warning: "bg-amber-500/20 text-amber-400",
      destructive: "bg-red-500/20 text-red-400",
      outline: "border border-neutral-700 text-neutral-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
