import React from 'react'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { RealtimeStatusIndicator } from '@/components/cataloging/RealtimeStatusIndicator'
import { Toaster } from 'sonner'

/**
 * Enhanced Cataloging Dashboard with Real-time Notifications
 * 
 * This component integrates the real-time notification system with the existing
 * cataloging dashboard, providing:
 * - Live status updates for cataloging jobs
 * - Toast notifications for job completion/failure
 * - Visual connection status indicator
 * - Automatic data refresh on events
 * 
 * Architecture:
 * - Uses the useRealtimeNotifications hook for event handling
 * - Integrates with TanStack Query for cache invalidation
 * - Provides accessible notifications via Sonner toast system
 * - Maintains existing dashboard functionality
 * 
 * Accessibility:
 * - All notifications are screen reader accessible
 * - Status indicators have proper ARIA labels
 * - Keyboard navigation is fully supported
 * - Focus management is maintained during updates
 */
export function CatalogingDashboardWithRealtime({ children }: { children?: React.ReactNode }) {
  // Initialize real-time notifications
  const {
    connectionStatus,
    isConnected,
    lastEventTime,
    eventCount
  } = useRealtimeNotifications()

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Cataloging Jobs</h1>
          <RealtimeStatusIndicator
            connectionStatus={connectionStatus}
            isConnected={isConnected}
            lastEventTime={lastEventTime}
            eventCount={eventCount}
          />
        </div>
      </div>

      {/* Dashboard Content */}
      {children}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          // Styling consistent with shadcn/ui theme
          className: 'font-medium',
          // Ensure sufficient duration for users to read and act
          duration: 5000
        }}
      />
    </div>
  )
}

/**
 * Compact version for use in smaller dashboard sections
 */
export function CatalogingDashboardCompact() {
  const { connectionStatus, isConnected } = useRealtimeNotifications()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Jobs</h2>
        <RealtimeStatusIndicator
          connectionStatus={connectionStatus}
          isConnected={isConnected}
          lastEventTime={null}
          eventCount={0}
          className="text-xs"
        />
      </div>
      
      {/* Compact job list would go here */}
      <div className="text-sm text-muted-foreground">
        Job updates appear automatically
      </div>
    </div>
  )
}

/**
 * Provider component that ensures real-time notifications are available
 * throughout the cataloging section
 */
export function CatalogingRealtimeProvider({ children }: { children: React.ReactNode }) {
  // Initialize the hook at the provider level to ensure consistent connection
  useRealtimeNotifications()
  
  return (
    <>
      {children}
             {/* Global toast container for cataloging notifications */}
       <Toaster
         position="top-right"
         expand={false}
         richColors
         closeButton
         toastOptions={{
           className: 'font-medium',
           duration: 5000
         }}
       />
    </>
  )
} 