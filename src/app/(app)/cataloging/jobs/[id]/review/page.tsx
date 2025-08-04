/**
 * Cataloging Job Review Page
 * 
 * This page provides the review wizard interface for finalizing cataloging jobs.
 * It loads the job data and provides the ReviewWizard component for user interaction.
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewWizard } from '@/components/cataloging/ReviewWizard';
import { useCatalogingJob } from '@/hooks/useCatalogJobs';
import { getCatalogingJobDisplayStatus } from '@/lib/types/jobs';
import Link from 'next/link';

export default function CatalogingJobReviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // Data fetching
  const { data: job, isLoading, isError, error } = useCatalogingJob(jobId);

  // Navigation handlers
  const handleReviewComplete = () => {
    router.push('/cataloging');
  };

  const handleReviewCancel = () => {
    router.push(`/cataloging/jobs/${jobId}`);
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
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
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
            Error Loading Job for Review
          </h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Job not found or you do not have permission to review it.'}
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/cataloging">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cataloging
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/cataloging/jobs/${jobId}`}>
                View Job Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if job is ready for review
  if (job.status !== 'completed') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                Job Not Ready for Review
                <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'}>
                  {getCatalogingJobDisplayStatus(job.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This cataloging job is not ready for review. 
                {job.status === 'pending' && ' It is currently waiting to be processed.'}
                {job.status === 'processing' && ' It is currently being processed.'}
                {job.status === 'failed' && ' It failed during processing and needs to be retried.'}
              </p>
              {job.error_message && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{job.error_message}</p>
                </div>
              )}
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link href={`/cataloging/jobs/${jobId}`}>
                    View Job Details
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cataloging">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Cataloging
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/cataloging/jobs/${jobId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job Details
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Review & Finalize
              </h1>
              <p className="text-muted-foreground">
                {job.extracted_data?.title || 'Cataloging Job'} • Job ID: {job.job_id}
              </p>
            </div>
          </div>
        </div>

        {/* Review Wizard */}
        <div data-testid="review-wizard">
          <ReviewWizard
            job={job}
            onComplete={handleReviewComplete}
            onCancel={handleReviewCancel}
          />
        </div>
      </div>
    </div>
  );
} 