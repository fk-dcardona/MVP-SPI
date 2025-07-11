import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-md)] border border-[hsl(var(--border))] px-[var(--space-lg)] py-[var(--space-md)] text-[var(--font-body)] shadow-[var(--shadow-md)] [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-[var(--space-lg)] [&>svg]:top-[var(--space-lg)] [&>svg]:text-[hsl(var(--foreground))] [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
        destructive:
          "border-[hsl(var(--destructive))]/50 text-[hsl(var(--destructive))] dark:border-[hsl(var(--destructive))] [&>svg]:text-[hsl(var(--destructive))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight text-[var(--font-section)]", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[var(--font-body)] [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
