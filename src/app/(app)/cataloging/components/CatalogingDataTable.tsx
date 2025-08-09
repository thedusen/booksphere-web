/**
 * Cataloging Data Table Component
 * 
 * Desktop data table for cataloging jobs with sorting, selection, and actions.
 * Implements the UX design specifications with full accessibility support.
 * 
 * Features:
 * - Multi-select with bulk actions
 * - Sortable columns
 * - Row actions (view, retry, delete)
 * - Keyboard navigation
 * - Screen reader support
 * - Responsive design
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw, 
  Trash2, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
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
import { TypedCatalogingJob, getCatalogingJobDisplayStatus } from '@/lib/types/jobs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CatalogingDataTableProps {
  jobs: TypedCatalogingJob[];
  selectedJobIds: string[];
  onSelectJob: (jobId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDeleteJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

type SortField = 'created_at' | 'status' | 'updated_at';

export function CatalogingDataTable({
  jobs,
  selectedJobIds,
  onSelectJob,
  onSelectAll,
  onDeleteJob,
  onRetryJob,
  sortBy,
  sortOrder,
  onSortChange,
}: CatalogingDataTableProps) {
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (!onSortChange) return;
    
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  };

  // Selection state
  const isAllSelected = jobs.length > 0 && selectedJobIds.length === jobs.length;
  const isPartiallySelected = selectedJobIds.length > 0 && selectedJobIds.length < jobs.length;

  // Handle select all
  const handleSelectAll = () => {
    onSelectAll(!isAllSelected);
  };

  // Render sort button
  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === field && (
          sortOrder === 'asc' ? 
            <ChevronUp className="h-3 w-3" /> : 
            <ChevronDown className="h-3 w-3" />
        )}
      </span>
    </Button>
  );

  // Use the skeumorphic StatusBadge component instead of inline implementation

  // Render source type badge - using extraction_source from metadata
  const SourceTypeBadge = ({ extractionSource }: { extractionSource: string | null }) => {
    if (!extractionSource) return <span className="text-muted-foreground">—</span>;
    
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
          <Link href={`/cataloging/jobs/${job.job_id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
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
      <div className="border border-neutral-200/60 rounded-xl bg-gradient-to-br from-background/98 to-lavender-50/30 shadow-elevation-2">
        <div className="p-8 text-center text-muted-foreground">
          <p>No cataloging jobs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) (el as HTMLInputElement).indeterminate = isPartiallySelected;
                }}
                onCheckedChange={handleSelectAll}
                aria-label="Select all jobs"
              />
            </TableHead>
            <TableHead>
              Job
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              Source
            </TableHead>
            <TableHead>
              <SortButton field="created_at">Created</SortButton>
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow 
              key={job.job_id}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                selectedJobIds.includes(job.job_id) && "bg-muted/50"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedJobIds.includes(job.job_id)}
                  onCheckedChange={(checked) => 
                    onSelectJob(job.job_id, checked === true)
                  }
                  aria-label={`Select job ${job.extracted_data?.title || job.job_id}`}
                />
              </TableCell>
              <TableCell>
                <Link 
                  href={`/cataloging/jobs/${job.job_id}`}
                  className="block hover:underline"
                >
                  <div className="space-y-1">
                    <div className="font-medium line-clamp-1">
                      {job.extracted_data?.title || 'Processing...'}
                    </div>
                    {job.extracted_data?.primary_author && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        by {job.extracted_data.primary_author}
                      </div>
                    )}
                    {job.extracted_data?.isbn13 && (
                      <div className="text-xs text-muted-foreground font-mono">
                        ISBN: {job.extracted_data.isbn13}
                      </div>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={job.status} className="text-xs" />
              </TableCell>
                             <TableCell>
                 <SourceTypeBadge extractionSource={job.extracted_data?.extraction_source || 'image_capture'} />
               </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <JobActions job={job} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 