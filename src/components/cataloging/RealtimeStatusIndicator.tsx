import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ConnectionStatus } from '@/hooks/useRealtimeNotifications'

interface RealtimeStatusIndicatorProps {
  connectionStatus: ConnectionStatus
  isConnected: boolean
  lastEventTime: Date | null
  eventCount: number
  className?: string
}

/**
 * Real-time Status Indicator Component
 * 
 * Displays the current connection status of the real-time notification system
 * with accessibility features and visual feedback.
 * 
 * UX Features:
 * - Visual status indicators with color coding
 * - Hover tooltip with detailed information
 * - Subtle animations for status changes
 * - Non-intrusive placement
 * 
 * Accessibility Features:
 * - Screen reader friendly with proper aria-labels
 * - Keyboard navigation support via tooltip
 * - Color is not the only indicator (text changes too)
 * - Proper contrast ratios
 */
export function RealtimeStatusIndicator({
  connectionStatus,
  isConnected,
  lastEventTime,
  eventCount,
  className
}: RealtimeStatusIndicatorProps) {
  
  /**
   * Gets the appropriate badge variant and text based on connection status
   */
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          variant: 'secondary' as const,
          text: '● Real-time',
          ariaLabel: 'Status: Real-time connection active'
        }
      case 'syncing':
        return {
          variant: 'default' as const,
          text: '● Syncing...',
          ariaLabel: 'Status: Syncing data updates'
        }
      case 'synced':
        return {
          variant: 'default' as const,
          text: '● Synced',
          ariaLabel: 'Status: Data synchronized'
        }
      case 'connecting':
        return {
          variant: 'outline' as const,
          text: '● Connecting...',
          ariaLabel: 'Status: Connecting to real-time service'
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          text: '● Error',
          ariaLabel: 'Status: Connection error - data may not be up to date'
        }
      default:
        return {
          variant: 'outline' as const,
          text: '● Unknown',
          ariaLabel: 'Status: Unknown connection state'
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  
  /**
   * Generates tooltip content with detailed status information
   */
  const getTooltipContent = () => {
    const baseMessage = "Job statuses update automatically. No need to refresh."
    
    if (connectionStatus === 'error') {
      return "Connection error. Please refresh the page to restore real-time updates."
    }
    
    if (connectionStatus === 'connecting') {
      return "Connecting to real-time updates..."
    }
    
    if (lastEventTime && eventCount > 0) {
      const secondsAgo = Math.round((Date.now() - lastEventTime.getTime()) / 1000);
      let timeAgoString = `${secondsAgo}s ago`;
      if (secondsAgo >= 60) {
        timeAgoString = `${Math.round(secondsAgo / 60)}m ago`;
      }
      return `${baseMessage} Last update: ${timeAgoString} (${eventCount} events received)`
    }
    
    return baseMessage
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={statusDisplay.variant}
            className={cn(
              'transition-all duration-200 ease-in-out',
              // Subtle pulse animation for syncing state
              connectionStatus === 'syncing' && 'animate-pulse',
              // Ensure proper spacing and sizing
              'text-xs font-medium px-2 py-1',
              className
            )}
            aria-label={statusDisplay.ariaLabel}
            role="status"
            aria-live="polite"
          >
            {statusDisplay.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">
            {getTooltipContent()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Compact version for use in smaller spaces
 */
export function RealtimeStatusIndicatorCompact({
  connectionStatus,
  isConnected,
  className
}: Pick<RealtimeStatusIndicatorProps, 'connectionStatus' | 'isConnected' | 'className'>) {
  const statusDisplay = (() => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'text-green-500', ariaLabel: 'Real-time active' }
      case 'syncing':
        return { color: 'text-blue-500 animate-pulse', ariaLabel: 'Syncing' }
      case 'synced':
        return { color: 'text-green-500', ariaLabel: 'Synced' }
      case 'connecting':
        return { color: 'text-gray-500', ariaLabel: 'Connecting' }
      case 'error':
        return { color: 'text-red-500', ariaLabel: 'Connection error' }
      default:
        return { color: 'text-gray-400', ariaLabel: 'Unknown status' }
    }
  })()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center text-xs font-medium',
              statusDisplay.color,
              className
            )}
            aria-label={statusDisplay.ariaLabel}
            role="status"
            aria-live="polite"
          >
            ●
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Real-time status: {statusDisplay.ariaLabel}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 