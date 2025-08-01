import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Sparkles, AlertCircle } from 'lucide-react'

/**
 * Real-time notification event structure from the Edge Function
 */
interface RealtimeNotificationEvent {
  id: string
  event_type: string
  job_id?: string
  entity_id?: string
  entity_type?: string
  created_at: string
}

/**
 * Aggregated notification state for debouncing
 */
interface NotificationQueue {
  successful: RealtimeNotificationEvent[]
  failed: RealtimeNotificationEvent[]
  startTime: number
}

/**
 * Connection status for the real-time indicator
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'syncing' | 'synced' | 'error'

/**
 * Hook return type
 */
interface UseRealtimeNotificationsReturn {
  connectionStatus: ConnectionStatus
  isConnected: boolean
  lastEventTime: Date | null
  eventCount: number
}

/**
 * Real-time Notifications Hook
 * 
 * Implements the complete real-time notification system with:
 * - Organization-specific Supabase Realtime channel subscription
 * - Debounced notification aggregation to prevent notification fatigue
 * - Accessible toast notifications with proper ARIA labels
 * - TanStack Query cache invalidation for data synchronization
 * - Connection status tracking for UI indicators
 * - Proper cleanup on component unmount
 * 
 * Architecture Decisions:
 * - Uses organization context for multi-tenant isolation
 * - Implements 2-second debouncing for bulk operations
 * - Separates success/failure notifications for better UX
 * - Provides connection status for real-time indicators
 * 
 * Accessibility Features:
 * - Uses aria-live regions via toast system
 * - Provides descriptive toast titles and actions
 * - Ensures keyboard navigation support
 * - Maintains focus management during notifications
 */
export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const queryClient = useQueryClient()
  const { organizationId } = useOrganization()
  
  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)
  
  // Refs for cleanup and debouncing
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const notificationQueueRef = useRef<NotificationQueue | null>(null)
  const isMountedRef = useRef(true)
  
  /**
   * Shows individual notification toast with accessibility features
   */
  const showIndividualNotification = (event: RealtimeNotificationEvent) => {
    const eventType = event.event_type || ''
    const isSuccess = eventType.includes('completed') || eventType.includes('success')
    const isFailure = eventType.includes('failed') || eventType.includes('error')
    
    if (isSuccess) {
      toast.success('Job Completed', {
        description: 'Cataloging job was processed successfully.',
        icon: <CheckCircle className="h-4 w-4" />,
        action: event.job_id ? {
          label: 'View Job',
          onClick: () => {
            // Navigate to job details
            window.location.href = `/cataloging/jobs/${event.job_id}`
          }
        } : undefined,
        duration: 5000
      })
    } else if (isFailure) {
      toast.error('Job Failed', {
        description: 'Cataloging job failed during processing.',
        icon: <XCircle className="h-4 w-4" />,
        action: event.job_id ? {
          label: 'Review Error',
          onClick: () => {
            // Navigate to job details with error focus
            window.location.href = `/cataloging/jobs/${event.job_id}?focus=error`
          }
        } : undefined,
        duration: 8000 // Longer duration for errors
      })
    } else {
      // Generic notification for other event types
      toast.info('Job Updated', {
        description: 'Cataloging job status has been updated.',
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 4000
      })
    }
  }
  
  /**
   * Shows aggregated notification toasts for bulk operations
   */
  const showAggregatedNotifications = (queue: NotificationQueue) => {
    const { successful, failed } = queue
    
    // Show success toast if there are multiple successful events
    if (successful.length >= 2) {
      toast.success('Multiple Jobs Updated', {
        description: `${successful.length} cataloging jobs have been processed successfully.`,
        icon: <Sparkles className="h-4 w-4" />,
        duration: 5000
      })
    } else if (successful.length === 1) {
      // Show individual notification for single success
      showIndividualNotification(successful[0])
    }
    
    // Always show failure notifications, even if aggregated
    if (failed.length >= 2) {
      toast.error('Multiple Jobs Failed', {
        description: `${failed.length} cataloging jobs failed during processing.`,
        icon: <XCircle className="h-4 w-4" />,
        action: {
          label: 'Review Errors',
          onClick: () => {
            // Navigate to jobs list with error filter
            window.location.href = '/cataloging?status=failed'
          }
        },
        duration: 10000 // Longer duration for multiple failures
      })
    } else if (failed.length === 1) {
      // Show individual notification for single failure
      showIndividualNotification(failed[0])
    }
  }
  
  /**
   * Processes the notification queue after debounce period
   */
  const processNotificationQueue = () => {
    if (!notificationQueueRef.current) return
    
    const queue = notificationQueueRef.current
    const totalEvents = queue.successful.length + queue.failed.length
    
    if (totalEvents === 0) {
      notificationQueueRef.current = null
      return
    }
    
    // Show appropriate notifications based on queue contents
    if (totalEvents === 1) {
      // Single event - show individual notification
      const singleEvent = queue.successful[0] || queue.failed[0]
      showIndividualNotification(singleEvent)
    } else {
      // Multiple events - show aggregated notifications
      showAggregatedNotifications(queue)
    }
    
    // Invalidate queries once after processing all events
    queryClient.invalidateQueries({ queryKey: ['cataloging-jobs'] })
    
    // Update connection status to show sync completion
    if (isMountedRef.current) {
      setConnectionStatus('synced')
      setTimeout(() => {
        if (isMountedRef.current) {
          setConnectionStatus('connected')
        }
      }, 2000)
    }
    
    // Clear the queue
    notificationQueueRef.current = null
  }
  
  /**
   * Handles incoming real-time events with debouncing
   */
  const handleRealtimeEvent = (event: RealtimeNotificationEvent) => {
    if (!isMountedRef.current) return

    console.log('Received real-time event:', event)
    
    // Update event tracking
    setLastEventTime(new Date())
    setEventCount(prev => prev + 1)
    setConnectionStatus('syncing')
    
    // Initialize queue if this is the first event
    if (!notificationQueueRef.current) {
      notificationQueueRef.current = {
        successful: [],
        failed: [],
        startTime: Date.now()
      }
    }
    
    // Add event to appropriate queue
    const eventType = event?.event_type || ''
    const isFailure = eventType.includes('failed') || eventType.includes('error')
    if (isFailure) {
      notificationQueueRef.current.failed.push(event)
    } else {
      notificationQueueRef.current.successful.push(event)
    }
    
    // Clear existing timer and start new one (debouncing)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Process queue after 2-second delay
    debounceTimerRef.current = setTimeout(processNotificationQueue, 2000)
  }
  
  // Effect for managing real-time subscription lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (!organizationId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionStatus('connecting'); // Reset status if org is lost
      return;
    }
    
    const channelName = `notifications:${organizationId}`
    const channel = supabase.channel(channelName);

    const handleBroadcast = ({ payload }: { payload: RealtimeNotificationEvent }) => {
      handleRealtimeEvent(payload);
    };
    
    const handleSubscriptionChange = (status: `${`${"SUBSCRIBED" | "TIMED_OUT" | "CHANNEL_ERROR" | "CLOSED"}`}`) => {
      if (!isMountedRef.current) return;
      
      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus('connected')
          break
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          setConnectionStatus('error')
          // Optionally, you might want to attempt a reconnect here
          break
        default:
          // Do not change status for intermediate states while already connecting
      }
    };

    channel
      .on('broadcast', { event: 'cataloging_event' }, handleBroadcast)
      .subscribe(handleSubscriptionChange);
    
    channelRef.current = channel
    
    // Cleanup on unmount or organization change
    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [organizationId, queryClient])
  
  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected' || connectionStatus === 'syncing' || connectionStatus === 'synced',
    lastEventTime,
    eventCount
  }
} 