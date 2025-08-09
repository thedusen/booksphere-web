/**
 * Cataloging Card List Component
 * 
 * Mobile card list for cataloging jobs with touch-friendly interactions.
 * Implements the UX design specifications for mobile devices.
 * 
 * Features:
 * - Touch-friendly card layout
 * - Multi-select with checkboxes
 * - Swipe actions (future enhancement)
 * - Accessibility support
 * - Responsive design
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw, 
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { TypedCatalogingJob } from '@/lib/types/jobs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CatalogingCardListProps {
  jobs: TypedCatalogingJob[];
  selectedJobIds: string[];
  onSelectJob: (jobId: string, selected: boolean) => void;
  onDeleteJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
}

export function CatalogingCardList({
  jobs,
  selectedJobIds,
  onSelectJob,
  onDeleteJob,
  onRetryJob,
}: CatalogingCardListProps) {
  // Smart routing function to determine correct link destination
  const getJobLink = (job: TypedCatalogingJob): string => {
    if (job.status === 'completed') {
      // Route ALL completed jobs directly to review (matching mobile app behavior)
      // This bypasses the problematic job details validation
      return `/cataloging/jobs/${job.job_id}/review`;
    }
    // All other jobs (pending, processing, failed) → Job details page
    return `/cataloging/jobs/${job.job_id}`;
  };

  // Use the skeumorphic StatusBadge component instead of inline implementation

  // Render source type badge - using extraction_source from metadata
  const SourceTypeBadge = ({ extractionSource }: { extractionSource: string | null }) => {
    if (!extractionSource) return <span className="text-muted-foreground text-xs">—</span>;
    
    const getSourceLabel = (type: string) => {
      switch (type) {
        case 'ai_analysis':
          return 'AI Analysis';
        case 'isbn_lookup':
          return 'ISBN Lookup';
        case 'manual_entry':
          return 'Manual Entry';
        default:
          return type;
      }
    };

    return (
      <Badge variant="outline" className="text-xs">
        {getSourceLabel(extractionSource)}
      </Badge>
    );
  };

  // Render job actions
  const JobActions = ({ job }: { job: TypedCatalogingJob }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open job actions menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={getJobLink(job)}>
            <Eye className="h-4 w-4 mr-2" />
            {job.status === 'completed' ? 'Review & Finalize' : 'View Details'}
          </Link>
        </DropdownMenuItem>
        {job.status === 'failed' && onRetryJob && (
          <DropdownMenuItem onClick={() => onRetryJob(job.job_id)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Processing
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDeleteJob && (
          <DeleteConfirmationDialog
            trigger={
              <DropdownMenuItem 
                className="text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job
              </DropdownMenuItem>
            }
            title="Delete Cataloging Job"
            description={`Are you sure you want to delete the cataloging job "${job.extracted_data?.title || 'Untitled'}"? This action cannot be undone.`}
            deleteButtonText="Delete Job"
            onConfirm={() => onDeleteJob(job.job_id)}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No cataloging jobs found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card 
          key={job.job_id}
          className={cn(
            "transition-colors",
            selectedJobIds.includes(job.job_id) && "ring-2 ring-primary"
          )}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header Row - Checkbox, Status, Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedJobIds.includes(job.job_id)}
                    onCheckedChange={(checked) => 
                      onSelectJob(job.job_id, checked === true)
                    }
                    aria-label={`Select job ${job.extracted_data?.title || job.job_id}`}
                  />
                  <StatusBadge status={job.status} className="text-xs" />
                </div>
                <JobActions job={job} />
              </div>

              {/* Main Content */}
              <Link 
                href={getJobLink(job)}
                className="block space-y-2"
              >
                <div className="space-y-1">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {job.extracted_data?.title || 'Processing...'}
                  </h3>
                  {job.extracted_data?.primary_author && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      by {job.extracted_data.primary_author}
                    </p>
                  )}
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <SourceTypeBadge extractionSource={job.extracted_data?.extraction_source || 'image_capture'} />
                    {job.extracted_data?.isbn13 && (
                      <span className="font-mono">
                        ISBN: {job.extracted_data.isbn13}
                      </span>
                    )}
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                </div>
              </Link>

              {/* Error Message (if any) */}
              {job.error_message && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive font-medium">
                    Error: {job.error_message}
                  </p>
                </div>
              )}

              {/* Mobile Review Button for Completed Jobs */}
              {job.status === 'completed' && job.extracted_data && (
                <div className="pt-2 border-t border-border/50">
                  <Button 
                    asChild
                    className="w-full h-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-sm"
                  >
                    <Link href={`/cataloging/review/${job.extracted_data.isbn13 || job.job_id}`}>
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">Review & Add to Inventory</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 