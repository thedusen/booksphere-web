import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium animate-spring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-elevation-2 hover:shadow-elevation-3 hover:from-primary/90 hover:to-accent/90 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-white/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-white shadow-elevation-2 hover:shadow-elevation-3 hover:from-destructive/90 hover:to-destructive/70 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 bg-background shadow-elevation-1 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 hover:border-primary hover:text-primary hover:shadow-elevation-2 dark:bg-background/50 dark:border-border dark:hover:border-primary gradient-border",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-elevation-2 hover:shadow-elevation-3 hover:from-secondary/90 hover:to-secondary/70",
        ghost:
          "hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-primary glass-hover",
        link: "text-primary underline-offset-4 hover:underline hover:text-secondary",
        primary:
          "bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground shadow-elevation-2 hover:shadow-elevation-3 hover:shadow-primary/20 glow-purple",
      },
      size: {
        // Enhanced with proper touch targets (44px minimum)
        default: "h-touch-target px-md py-sm has-[>svg]:px-sm", // 44px height
        sm: "h-10 rounded-md gap-xs px-sm has-[>svg]:px-xs", // 40px height (still acceptable)
        lg: "h-12 rounded-lg px-lg has-[>svg]:px-md", // 48px height (better for touch)
        icon: "size-touch-target", // 44px x 44px
        "icon-sm": "size-10", // 40px x 40px
        "icon-lg": "size-12", // 48px x 48px
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
