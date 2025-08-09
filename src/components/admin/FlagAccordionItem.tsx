// components/admin/FlagAccordionItem.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { FlagStatus } from '@/lib/types/flags';
import { FlagContextDetails } from './FlagContextDetails';
import type { PaginatedFlag } from '@/hooks/useFlagging';

interface FlagAccordionItemProps {
  flag: PaginatedFlag;
  onStatusUpdate: (flagId: string, status: FlagStatus, notes?: string) => void;
  isLoading?: boolean;
}

// Helper function to render unknown values safely
const renderValue = (value: unknown): React.ReactNode => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

// Helper function to render details as formatted JSON
const renderDetails = (details: unknown): React.ReactNode => {
  if (!details) return 'N/A';
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

export function FlagAccordionItem({ flag, onStatusUpdate, isLoading = false }: FlagAccordionItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case FlagStatus.OPEN:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case FlagStatus.IN_REVIEW:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case FlagStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case FlagStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case FlagStatus.OPEN:
        return "destructive" as const;
      case FlagStatus.IN_REVIEW:
        return "default" as const;
      case FlagStatus.RESOLVED:
        return "secondary" as const;
      case FlagStatus.REJECTED:
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return "destructive" as const;
      case 'high':
        return "default" as const;
      case 'medium':
        return "secondary" as const;
      case 'low':
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  // Determine what actions are available based on current status
  const getAvailableActions = (status: string) => {
    switch (status) {
      case FlagStatus.OPEN:
        return [
          { label: 'Start Review', status: FlagStatus.IN_REVIEW, variant: 'default' as const },
          { label: 'Quick Resolve', status: FlagStatus.RESOLVED, variant: 'default' as const },
          { label: 'Quick Reject', status: FlagStatus.REJECTED, variant: 'outline' as const },
        ];
      case FlagStatus.IN_REVIEW:
        return [
          { label: 'Resolve', status: FlagStatus.RESOLVED, variant: 'default' as const },
          { label: 'Reject', status: FlagStatus.REJECTED, variant: 'outline' as const },
          { label: 'Back to Open', status: FlagStatus.OPEN, variant: 'outline' as const },
        ];
      case FlagStatus.RESOLVED:
        return [
          { label: 'Reopen', status: FlagStatus.OPEN, variant: 'outline' as const },
        ];
      case FlagStatus.REJECTED:
        // NEW: Allow reversing rejected flags
        return [
          { label: 'Reverse to Open', status: FlagStatus.OPEN, variant: 'outline' as const },
          { label: 'Reverse to Review', status: FlagStatus.IN_REVIEW, variant: 'outline' as const },
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions(flag.status);

  return (
    <Card className="w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={flag.flag_id} className="border-none">
          <AccordionTrigger className="hover:no-underline px-6 py-4">
            <div className="flex items-center justify-between w-full pr-4">
              {/* Left side - Status and basic info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status */}
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusIcon(flag.status)}
                  <Badge variant={getStatusBadgeVariant(flag.status)} className="text-xs">
                    {flag.status}
                  </Badge>
                </div>

                {/* Severity */}
                <Badge variant={getSeverityBadgeVariant(flag.severity)} className="text-xs shrink-0">
                  {flag.severity}
                </Badge>

                {/* Table.Field */}
                <div className="font-mono text-sm text-muted-foreground shrink-0">
                  {flag.table_name}.{flag.field_name || 'record'}
                </div>

                {/* Description */}
                <div className="truncate text-sm min-w-0 flex-1">
                  {flag.description || 'No description'}
                </div>
              </div>

              {/* Right side - Date and actions */}
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground">
                  {new Date(flag.created_at).toLocaleDateString()}
                </span>

                {/* Quick actions (without expanding) */}
                <div className="flex items-center gap-1">
                  {availableActions.slice(0, 2).map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={action.variant}
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent accordion toggle
                        onStatusUpdate(flag.flag_id, action.status);
                      }}
                      disabled={isLoading}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Flag Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold">Flag Details</h4>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Full Description */}
                    <div>
                      <h5 className="font-medium text-sm mb-2">Description</h5>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                        {flag.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Suggested Value */}
                    {flag.suggested_value !== null && flag.suggested_value !== undefined && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Suggested Value</h5>
                        <pre className="text-sm bg-muted/30 p-3 rounded overflow-x-auto font-mono">
                          {renderValue(flag.suggested_value)}
                        </pre>
                      </div>
                    )}

                    {/* Additional Details */}
                    {flag.details !== null && flag.details !== undefined && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Additional Details</h5>
                        <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto font-mono">
                          {renderDetails(flag.details)}
                        </pre>
                      </div>
                    )}

                    {/* Resolution Notes (if any) */}
                    {flag.resolution_notes && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Resolution Notes</h5>
                        <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
                          {flag.resolution_notes}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Flag ID:</span>
                          <code className="font-mono">{flag.flag_id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Record ID:</span>
                          <code className="font-mono">{flag.record_id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Flagged By:</span>
                          <code className="font-mono">{flag.flagged_by}</code>
                        </div>
                        {flag.reviewed_by && (
                          <div className="flex justify-between">
                            <span>Reviewed By:</span>
                            <code className="font-mono">{flag.reviewed_by}</code>
                          </div>
                        )}
                        {flag.resolved_at && (
                          <div className="flex justify-between">
                            <span>Resolved At:</span>
                            <span>{new Date(flag.resolved_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Available Actions */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold">Actions</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {availableActions.map((action) => (
                        <Button
                          key={action.status}
                          variant={action.variant}
                          onClick={() => onStatusUpdate(flag.flag_id, action.status)}
                          disabled={isLoading}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Record Context */}
              <div>
                <FlagContextDetails
                  tableName={flag.table_name}
                  recordId={flag.record_id}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}