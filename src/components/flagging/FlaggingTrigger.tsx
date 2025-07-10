'use client';

import React from 'react';
import { Flag, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFlaggingContext } from './FlaggingProvider';
import type { FlagStatus } from '@/lib/types/flags';

interface FlaggingTriggerProps {
  /** The table this record belongs to */
  tableName: 'books' | 'editions' | 'stock_items';
  /** UUID of the record being flagged */
  recordId: string;
  /** Specific field being flagged (optional - if not provided, flags entire record) */
  fieldName?: string;
  /** Current value being displayed/flagged */
  currentValue: string;
  /** Human-readable label for the field */
  fieldLabel: string;
  /** Additional context data for the modal */
  contextData?: Record<string, unknown>;
  /** Whether this field is already flagged */
  isFlagged?: boolean;
  /** Flag status if already flagged */
  flagStatus?: FlagStatus;
  /** Callback when flag form should be opened (optional - uses context if not provided) */
  onOpenFlagForm?: (data: Omit<FlaggingTriggerProps, 'children'>) => void;
  /** Child content to wrap with flagging functionality */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FlaggingTrigger - A context menu wrapper that allows users to flag data
 */
export function FlaggingTrigger({
  tableName,
  recordId,
  fieldName,
  currentValue,
  fieldLabel,
  contextData,
  isFlagged = false,
  flagStatus,
  onOpenFlagForm,
  children,
  className,
}: FlaggingTriggerProps) {
  const flaggingContext = useFlaggingContext();
  const helpId = `flag-help-${recordId}-${fieldName || 'record'}`;
  const triggerId = `flag-trigger-${recordId}-${fieldName || 'record'}`;
  
  const triggerData = React.useMemo(() => ({
    tableName,
    recordId,
    fieldName,
    currentValue,
    fieldLabel,
    contextData,
  }), [tableName, recordId, fieldName, currentValue, fieldLabel, contextData]);

  // Register/unregister trigger for centralized keyboard handling
  React.useEffect(() => {
    flaggingContext.registerTrigger(triggerId, triggerData);
    return () => flaggingContext.unregisterTrigger(triggerId);
  }, [triggerId, triggerData, flaggingContext]);

  const handleOpenFlagForm = () => {
    if (onOpenFlagForm) {
      onOpenFlagForm(triggerData);
    } else {
      flaggingContext.openFlagForm(triggerData);
    }
  };

  const getFlagStatusBadge = () => {
    if (!isFlagged || !flagStatus) return null;

    const statusConfig = {
      open: { 
        label: 'Flagged', 
        variant: 'destructive' as const, 
        icon: AlertTriangle,
        description: 'This field has an open flag'
      },
      in_review: { 
        label: 'Under Review', 
        variant: 'secondary' as const, 
        icon: Flag,
        description: 'This field is being reviewed'
      },
      resolved: { 
        label: 'Resolved', 
        variant: 'outline' as const, 
        icon: CheckCircle,
        description: 'This field\'s flag has been resolved'
      },
      rejected: { 
        label: 'Rejected', 
        variant: 'outline' as const, 
        icon: XCircle,
        description: 'This field\'s flag was rejected'
      },
    };

    const config = statusConfig[flagStatus];
    const IconComponent = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className="ml-2 text-xs"
        aria-label={config.description}
        title={config.description}
      >
        <IconComponent className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // REVIEWER FIX: The isDisabled logic was flawed. It should only be disabled
  // for terminal states where no further action is possible. A user should be
  // able to update an 'open' or 'in_review' flag.
  const isTerminalState = flagStatus === 'resolved' || flagStatus === 'rejected';
  const isDisabled = isFlagged && isTerminalState;

  const interactionClasses = cn(
    "relative inline-flex items-center transition-all duration-200",
    "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    !isDisabled && "cursor-context-menu hover:bg-muted/50 hover:rounded-sm hover:shadow-sm",
    isDisabled && "opacity-60 cursor-not-allowed",
    className
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          id={triggerId}
          data-flagging-trigger={triggerId}
          className={interactionClasses}
          tabIndex={0}
          role="button"
          aria-label={`Report issue with ${fieldLabel}. Right-click or press Ctrl+Shift+R to flag.`}
          aria-describedby={helpId}
          aria-disabled={isDisabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isDisabled) {
                handleOpenFlagForm();
              }
            }
          }}
        >
          {children}
          {isFlagged && getFlagStatusBadge()}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onSelect={handleOpenFlagForm}
          className="flex items-center gap-2 cursor-pointer"
          disabled={isDisabled}
        >
          <Flag className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">
              {isFlagged ? 'Update Flag' : 'Report Issue'}
            </span>
            <span className="text-xs text-muted-foreground">
              {fieldName 
                ? `Flag this ${fieldLabel.toLowerCase()}` 
                : `Flag this ${tableName.slice(0, -1)}`
              }
            </span>
          </div>
        </ContextMenuItem>
        
        {currentValue && currentValue !== "N/A" && (
          <ContextMenuItem disabled className="text-xs text-muted-foreground">
            Current: {currentValue.length > 30 ? `${currentValue.slice(0, 30)}...` : currentValue}
          </ContextMenuItem>
        )}
      </ContextMenuContent>

      <div id={helpId} className="sr-only">
        Current value: {currentValue}. 
        {isFlagged 
          ? `This field has been flagged with status: ${flagStatus}.` 
          : "Right-click or press Ctrl+Shift+R to report an issue."
        }
      </div>
    </ContextMenu>
  );
}

/**
 * Alternative Button-based trigger for cases where context menu isn't suitable
 */
interface FlaggingButtonProps extends Omit<FlaggingTriggerProps, 'children'> {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'secondary';
  showLabel?: boolean;
}

export function FlaggingButton({
  tableName,
  recordId,
  fieldName,
  currentValue,
  fieldLabel,
  contextData,
  isFlagged = false,
  flagStatus,
  onOpenFlagForm,
  size = 'sm',
  variant = 'ghost',
  showLabel = false,
  className,
}: FlaggingButtonProps) {
  const flaggingContext = useFlaggingContext();
  const helpId = `flag-help-${recordId}-${fieldName || 'record'}`;
  const triggerId = `flag-button-${recordId}-${fieldName || 'record'}`;
  
  const triggerData = React.useMemo(() => ({
    tableName,
    recordId,
    fieldName,
    currentValue,
    fieldLabel,
    contextData,
  }), [tableName, recordId, fieldName, currentValue, fieldLabel, contextData]);

  React.useEffect(() => {
    flaggingContext.registerTrigger(triggerId, triggerData);
    return () => flaggingContext.unregisterTrigger(triggerId);
  }, [triggerId, triggerData, flaggingContext]);
  
  const handleClick = () => {
    if (onOpenFlagForm) {
      onOpenFlagForm(triggerData);
    } else {
      flaggingContext.openFlagForm(triggerData);
    }
  };

  // REVIEWER FIX: This was the same flawed logic as above.
  const isTerminalState = flagStatus === 'resolved' || flagStatus === 'rejected';
  const isDisabled = isFlagged && isTerminalState;

  const getButtonText = () => {
    if (isFlagged) {
      switch (flagStatus) {
        case 'in_review': return 'Under Review';
        case 'resolved': return 'Resolved';
        case 'rejected': return 'Rejected';
        default: return 'Update Flag';
      }
    }
    return 'Report Issue';
  };

  // REVIEWER FIX: Implement correct status-aware styling logic.
  const isActionable = isFlagged && (flagStatus === 'open' || flagStatus === 'in_review');
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        data-flagging-trigger={triggerId}
        className={cn(
          "min-h-[44px] min-w-[44px]",
          "transition-all duration-200",
          isActionable && "border-orange-400 bg-orange-50 text-orange-800 hover:bg-orange-100",
          // The `isTerminalState` variable is defined above with the `isDisabled` logic
          isTerminalState && "border-muted bg-muted/30 text-muted-foreground",
          className
        )}
        aria-label={`${
          isFlagged ? 'Update flag for' : 'Report issue with'
        } ${fieldLabel}`}
        aria-describedby={helpId}
        title={`${getButtonText()} - ${fieldLabel}`}
      >
        <Flag className={cn(
          "h-4 w-4",
          isActionable && "text-orange-600",
          isTerminalState && "text-muted-foreground"
        )} />
        {showLabel && (
          <span className="ml-2">
            {getButtonText()}
          </span>
        )}
      </Button>

      <div id={helpId} className="sr-only">
        Current value: {currentValue}.
        {isFlagged 
          ? `This field has been flagged with status: ${flagStatus}.` 
          : "Click to report an issue with this field."
        }
      </div>
    </>
  );
} 