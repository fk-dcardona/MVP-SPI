import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-md)] border border-[hsl(var(--input))] bg-transparent px-[var(--space-md)] py-[var(--space-xs)] text-[var(--font-body)] shadow-[var(--shadow-sm)] transition-colors file:border-0 file:bg-transparent file:text-[var(--font-detail)] file:font-medium file:text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 md:text-[var(--font-detail)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
