/**
 * Cataloging Job Details Page
 * 
 * Displays detailed information about a specific cataloging job.
 * Includes job status, extracted metadata, images, and actions.
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeft, 
  RotateCcw, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useCatalogingJob, useDeleteCatalogingJobs, useRetryCatalogingJobs } from '@/hooks/useCatalogJobs';
import { getCatalogingJobDisplayStatus } from '@/lib/types/jobs';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function CatalogingJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // Data fetching
  const { data: job, isLoading, isError, error } = useCatalogingJob(jobId);

  // Mutations
  const deleteMutation = useDeleteCatalogingJobs();
  const retryMutation = useRetryCatalogingJobs();

  // Action handlers
  const handleDelete = async () => {
    if (!job) return;
    
    try {
      await deleteMutation.mutateAsync([job.job_id]);
      router.push('/cataloging');
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleRetry = async () => {
    if (!job) return;
    
    try {
      await retryMutation.mutateAsync([job.job_id]);
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  // Render status badge with icon
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'pending':
          return <Clock className="h-3 w-3" />;
        case 'processing':
          return <AlertCircle className="h-3 w-3" />;
        case 'completed':
          return <CheckCircle className="h-3 w-3" />;
        case 'failed':
          return <XCircle className="h-3 w-3" />;
        default:
          return null;
      }
    };

    return (
      <Badge 
        variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
        className="flex items-center gap-1"
      >
        {getStatusIcon()}
        {getCatalogingJobDisplayStatus(status as any)}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !job) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-destructive">
            Error Loading Job Details
          </h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Job not found or you do not have permission to view it.'}
          </p>
          <Button asChild>
            <Link href="/cataloging">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cataloging
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cataloging">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cataloging
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {job.extracted_data?.title || 'Cataloging Job'}
            </h1>
            <p className="text-muted-foreground">
              Job ID: {job.job_id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          {job.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retryMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {retryMutation.isPending ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          <DeleteConfirmationDialog
            trigger={
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            }
            title="Delete Cataloging Job"
            description="Are you sure you want to delete this cataloging job? This action cannot be undone. All extracted metadata and associated data will be permanently removed."
            deleteButtonText="Delete Job"
            onConfirm={handleDelete}
            isLoading={deleteMutation.isPending}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={job.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="mt-1 text-sm">
                    {job.extracted_data?.extraction_source || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {job.error_message && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <h4 className="text-sm font-medium text-destructive mb-1">Error Message</h4>
                  <p className="text-sm text-destructive">{job.error_message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Metadata */}
          {job.extracted_data && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Book Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="mt-1">{job.extracted_data.title}</p>
                  </div>
                  
                  {job.extracted_data.subtitle && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Subtitle</label>
                      <p className="mt-1">{job.extracted_data.subtitle}</p>
                    </div>
                  )}
                  
                  {job.extracted_data.primary_author && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Author</label>
                      <p className="mt-1">{job.extracted_data.primary_author}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {job.extracted_data.publisher_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Publisher</label>
                        <p className="mt-1 text-sm">{job.extracted_data.publisher_name}</p>
                      </div>
                    )}
                    
                    {job.extracted_data.publication_year && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Publication Year</label>
                        <p className="mt-1 text-sm">{job.extracted_data.publication_year}</p>
                      </div>
                    )}
                    
                    {job.extracted_data.isbn13 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ISBN-13</label>
                        <p className="mt-1 text-sm font-mono">{job.extracted_data.isbn13}</p>
                      </div>
                    )}
                    
                    {job.extracted_data.page_count && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Pages</label>
                        <p className="mt-1 text-sm">{job.extracted_data.page_count}</p>
                      </div>
                    )}
                  </div>
                  
                  {job.extracted_data.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1 text-sm leading-relaxed">{job.extracted_data.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Images */}
          {job.image_urls && (
            <Card>
              <CardHeader>
                <CardTitle>Captured Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.image_urls.cover_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Cover</label>
                    <div className="relative aspect-[3/4] w-full max-w-48 mx-auto">
                      <Image
                        src={job.image_urls.cover_url}
                        alt="Book cover"
                        fill
                        className="object-cover rounded-md border"
                      />
                    </div>
                  </div>
                )}
                
                {job.image_urls.title_page_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Title Page</label>
                    <div className="relative aspect-[3/4] w-full max-w-48 mx-auto">
                      <Image
                        src={job.image_urls.title_page_url}
                        alt="Title page"
                        fill
                        className="object-cover rounded-md border"
                      />
                    </div>
                  </div>
                )}
                
                {job.image_urls.additional_images && job.image_urls.additional_images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Additional Images ({job.image_urls.additional_images.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {job.image_urls.additional_images.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image
                            src={url}
                            alt={`Additional image ${index + 1}`}
                            fill
                            className="object-cover rounded-md border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {job.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This job has been successfully processed. You can now review and finalize the book details.
                </p>
                <Button className="w-full" asChild>
                  <Link href={`/cataloging/jobs/${job.job_id}/review`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Review & Finalize
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 