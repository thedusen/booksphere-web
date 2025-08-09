import * as React from "react"
import { cn } from "@/lib/utils"

interface DateInputProps extends React.ComponentProps<"input"> {
  placeholder?: string;
}

function DateInput({ className, placeholder, ...props }: DateInputProps) {
  return (
    <input
      type="date"
      data-slot="date-input"
      className={cn(
        // Base styling similar to regular input but with date-specific adjustments
        "file:text-foreground placeholder:text-muted-foreground selection:bg-gradient-to-r selection:from-primary selection:to-secondary selection:text-primary-foreground dark:bg-input/30 border-input flex h-touch-target w-full min-w-0 rounded-lg border bg-gradient-to-br from-background to-lavender-50/20 px-sm py-sm text-base shadow-elevation-1 transition-all animate-spring outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:shadow-elevation-2 focus-visible:bg-gradient-to-br focus-visible:from-background focus-visible:to-primary/5",
        "hover:border-secondary hover:shadow-elevation-2",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Date-specific styles - provide space for calendar icon and position it properly
        "pr-10 relative",
        // Calendar icon styling - consolidated Tailwind approach
        "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2",
        "[&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:opacity-70",
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:bg-transparent [&::-webkit-calendar-picker-indicator]:border-0",
        "hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
        // Remove default date input styling
        "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      placeholder={placeholder}
      {...props}
    />
  )
}

export { DateInput }