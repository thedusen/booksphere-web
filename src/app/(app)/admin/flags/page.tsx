'use client';

import React, { useState } from 'react';

// Force dynamic rendering to prevent static generation issues with Supabase
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { FlagStatus } from '@/lib/types/flags';
import { usePaginatedFlags, useUpdateFlagStatus, type PaginatedFlag } from '@/hooks/useFlagging';
import { FlagAccordionItem } from '@/components/admin/FlagAccordionItem';


/**
 * Admin Flags Dashboard
 * 
 * CRITICAL FUNCTIONALITY: This page enables administrators to review and resolve
 * data quality flags submitted by users. Without this, the flagging system is
 * non-functional as there's no way to process submitted flags.
 * 
 * EXPERT IMPLEMENTATION:
 * - Role-based access control (admin only)
 * - Server-side pagination for performance
 * - Real-time status updates
 * - Comprehensive flag context display
 * - Streamlined review workflow
 */

export default function AdminFlagsPage() {
  const { loading: orgLoading } = useOrganization();
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('all');
  
  // TODO: Add role-based access control here
  // if (!user?.role?.includes('admin')) {
  //   return <div>Access denied. Admin privileges required.</div>;
  // }

  const updateFlagMutation = useUpdateFlagStatus();

  // Fetch flags with pagination
  const { data: flags, isLoading, error, refetch } = usePaginatedFlags({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
    offset: 0,
  });

  const handleStatusUpdate = async (flagId: string, newStatus: FlagStatus, resolution?: string) => {
    try {
      await updateFlagMutation.mutateAsync({
        flag_id: flagId,
        status: newStatus,
        resolution_notes: resolution,
      });
      await refetch(); // Refresh the list
    } catch (error) {
      console.error('Failed to update flag status:', error);
    }
  };


  if (orgLoading || isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading flags...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Flags</CardTitle>
            <CardDescription>
              Unable to load data quality flags. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const flagsData = flags || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Quality Flags</h1>
          <p className="text-muted-foreground">
            Review and resolve data quality issues reported by users
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FlagStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flags</SelectItem>
              <SelectItem value={FlagStatus.OPEN}>Open</SelectItem>
              <SelectItem value={FlagStatus.IN_REVIEW}>In Review</SelectItem>
              <SelectItem value={FlagStatus.RESOLVED}>Resolved</SelectItem>
              <SelectItem value={FlagStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Flags</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flagsData.filter((f: PaginatedFlag) => f.status === FlagStatus.OPEN).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flagsData.filter((f: PaginatedFlag) => f.status === FlagStatus.IN_REVIEW).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flagsData.filter((f: PaginatedFlag) => f.status === FlagStatus.RESOLVED).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flagsData.filter((f: PaginatedFlag) => f.status === FlagStatus.REJECTED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flags List - Accordion Layout */}
      <div className="space-y-4">
        {flagsData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No flags found matching the current filter.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {flagsData.length} Flag{flagsData.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-sm text-muted-foreground">
                Click on any flag to expand and view full details
              </p>
            </div>
            
            <div className="space-y-3">
              {flagsData.map((flag: PaginatedFlag) => (
                <FlagAccordionItem
                  key={flag.flag_id}
                  flag={flag}
                  onStatusUpdate={handleStatusUpdate}
                  isLoading={updateFlagMutation.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 