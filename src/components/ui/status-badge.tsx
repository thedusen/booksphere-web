/**
 * Status Badge Component with Color Dots
 * 
 * A specialized badge component for displaying status with color-coded dots:
 * - Green dot: "Ready" (completed)
 * - Yellow dot: "Processing" (with pulse animation)
 * - Gray dot: "Pending" 
 * - Red dot: "Failed"
 * 
 * Follows the skeumorphic design system with subtle gradients and shadows.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CatalogingJobStatus } from "@/lib/types/jobs"

// Status dot configuration with colors and animations
const statusDotConfig = {
  pending: {
    dotColor: "bg-neutral-400",
    glowColor: "shadow-neutral-400/20",
    animation: "",
    label: "Pending"
  },
  processing: {
    dotColor: "bg-amber-400",
    glowColor: "shadow-amber-400/30",
    animation: "animate-pulse",
    label: "Processing"
  },
  completed: {
    dotColor: "bg-green-500",
    glowColor: "shadow-green-500/30",
    animation: "",
    label: "Ready"
  },
  failed: {
    dotColor: "bg-red-500",
    glowColor: "shadow-red-500/30",
    animation: "",
    label: "Failed"
  }
} as const

const statusBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 animate-spring",
  {
    variants: {
      variant: {
        pending: "border-neutral-200/60 bg-gradient-to-br from-neutral-50 to-neutral-100/50 text-neutral-700 shadow-elevation-1 hover:shadow-elevation-2",
        processing: "border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-800 shadow-elevation-1 hover:shadow-elevation-2",
        completed: "border-green-200/60 bg-gradient-to-br from-green-50 to-green-100/50 text-green-800 shadow-elevation-1 hover:shadow-elevation-2",
        failed: "border-red-200/60 bg-gradient-to-br from-red-50 to-red-100/50 text-red-800 shadow-elevation-1 hover:shadow-elevation-2",
      }
    },
    defaultVariants: {
      variant: "pending"
    }
  }
)

export interface StatusBadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: CatalogingJobStatus
  showDot?: boolean
}

function StatusBadge({ 
  className, 
  status, 
  showDot = true,
  ...props 
}: StatusBadgeProps) {
  const config = statusDotConfig[status]
  const variant = status as keyof typeof statusDotConfig
  
  return (
    <div 
      className={cn(statusBadgeVariants({ variant }), className)} 
      {...props}
    >
      {showDot && (
        <div 
          className={cn(
            "h-2 w-2 rounded-full shadow-sm",
            config.dotColor,
            config.glowColor,
            config.animation
          )}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </div>
  )
}

// Status dot only component for compact displays
export function StatusDot({ 
  status, 
  className,
  ...props 
}: { 
  status: CatalogingJobStatus
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const config = statusDotConfig[status]
  
  return (
    <div 
      className={cn("flex items-center justify-center", className)}
      title={config.label}
      {...props}
    >
      <div 
        className={cn(
          "h-2 w-2 rounded-full shadow-sm",
          config.dotColor,
          config.glowColor,
          config.animation
        )}
        aria-label={`Status: ${config.label}`}
      />
    </div>
  )
}

export { StatusBadge, statusBadgeVariants, statusDotConfig }