import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Enhanced touch targets and design tokens with quirky colors
        "file:text-foreground placeholder:text-muted-foreground selection:bg-gradient-to-r selection:from-primary selection:to-secondary selection:text-primary-foreground dark:bg-input/30 border-input flex h-touch-target w-full min-w-0 rounded-lg border bg-gradient-to-br from-background to-lavender-50/20 px-sm py-sm text-base shadow-elevation-1 transition-all animate-spring outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-elevation-2 focus-visible:bg-gradient-to-br focus-visible:from-background focus-visible:to-primary/5",
        "hover:border-secondary hover:shadow-elevation-2",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
