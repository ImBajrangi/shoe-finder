import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(
  ({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded border",
        "cursor-pointer transition-colors",
        "border-neutral-600 bg-transparent",
        "hover:border-neutral-400",
        "focus-visible:ring-2 focus-visible:outline-none",
        "focus-visible:ring-white focus-visible:ring-offset-2",
        "focus-visible:ring-offset-neutral-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-white",
        "data-[state=checked]:bg-white",
        "data-[state=checked]:text-black",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check
          className="h-4 w-4"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName =
  CheckboxPrimitive.Root.displayName;

export { Checkbox };
