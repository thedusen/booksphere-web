/**
 * Enhanced Skeumorphic Tabs Component
 * 
 * A beautiful tabs component with skeumorphic design principles:
 * - Clear visual distinction between active and inactive states
 * - Raised appearance for active tabs, recessed for inactive
 * - Consistent with the overall design system
 * - Maintains full accessibility and keyboard navigation
 */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-lavender-50/60 p-1.5 text-muted-foreground shadow-elevation-2 backdrop-blur-sm border border-neutral-200/40 animate-spring",
      "dark:from-neutral-800 dark:to-neutral-900/60 dark:border-neutral-700/40",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles for all states
      "flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 animate-spring ring-offset-background",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
      // Disabled states
      "disabled:pointer-events-none disabled:opacity-50",
      // Inactive tab styles (recessed appearance)
      "text-muted-foreground bg-gradient-to-br from-neutral-50 to-transparent border border-neutral-200/30 shadow-inner",
      "hover:text-foreground hover:bg-gradient-to-br hover:from-background hover:to-lavender-50/30 hover:border-neutral-200/50 hover:shadow-elevation-1",
      // Active tab styles (raised appearance)
      "data-[state=active]:text-foreground data-[state=active]:bg-gradient-to-br data-[state=active]:from-background data-[state=active]:to-lavender-50/40 data-[state=active]:shadow-elevation-3 data-[state=active]:border-primary/30 data-[state=active]:font-semibold data-[state=active]:scale-105",
      // Dark mode support
      "dark:from-neutral-900 dark:to-transparent dark:border-neutral-700/30",
      "dark:hover:from-neutral-800 dark:hover:to-neutral-900/30 dark:hover:border-neutral-600/50",
      "dark:data-[state=active]:from-neutral-800 dark:data-[state=active]:to-neutral-900/40 dark:data-[state=active]:border-primary/40",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent } 