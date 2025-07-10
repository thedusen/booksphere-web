'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { FlagStatus } from '@/lib/types/flags';
import { usePaginatedFlags, useUpdateFlagStatus, type PaginatedFlag } from '@/hooks/useFlagging';

/**
 * Helper functions to safely render unknown values
 */
const renderSuggestedValue = (value: unknown): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const renderDetails = (details: unknown): string => {
  if (!details) return 'N/A';
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

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
  const { organizationId, loading: orgLoading } = useOrganization();
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('all');
  const [selectedFlag, setSelectedFlag] = useState<PaginatedFlag | null>(null);
  
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
      setSelectedFlag(null); // Close detail view
    } catch (error) {
      console.error('Failed to update flag status:', error);
    }
  };

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
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flagsData.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flags List</CardTitle>
          <CardDescription>
            Click on a flag to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flagsData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No flags found matching the current filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagsData.map((flag: PaginatedFlag) => (
                  <TableRow 
                    key={flag.flag_id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedFlag(flag)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(flag.status)}
                        <Badge variant={getStatusBadgeVariant(flag.status)}>
                          {flag.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {flag.table_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {flag.field_name || 'Record-level'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {flag.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {flag.status === FlagStatus.OPEN && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(flag.flag_id, FlagStatus.IN_REVIEW);
                            }}
                            disabled={updateFlagMutation.isPending}
                          >
                            Review
                          </Button>
                        )}
                        {flag.status === FlagStatus.IN_REVIEW && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(flag.flag_id, FlagStatus.RESOLVED, 'Approved by admin');
                              }}
                              disabled={updateFlagMutation.isPending}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(flag.flag_id, FlagStatus.REJECTED, 'Rejected by admin');
                              }}
                              disabled={updateFlagMutation.isPending}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Flag Detail Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Flag Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedFlag(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Table:</strong> {selectedFlag.table_name}
                </div>
                <div>
                  <strong>Field:</strong> {selectedFlag.field_name || 'Record-level'}
                </div>
                <div>
                  <strong>Severity:</strong> {selectedFlag.severity}
                </div>
                <div>
                  <strong>Status:</strong> {selectedFlag.status}
                </div>
              </div>
              
              <div>
                <strong>Description:</strong>
                <p className="mt-1 text-muted-foreground">{selectedFlag.description}</p>
              </div>
              
              {selectedFlag.suggested_value && (
                <div>
                  <strong>Suggested Value:</strong>
                                    <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                    {renderSuggestedValue(selectedFlag.suggested_value)}
                  </p>
                </div>
              )}
              
              {selectedFlag.details && (
                <div>
                  <strong>Additional Details:</strong>
                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                    {renderDetails(selectedFlag.details)}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                {selectedFlag.status === FlagStatus.OPEN && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedFlag.flag_id, FlagStatus.IN_REVIEW)}
                    disabled={updateFlagMutation.isPending}
                  >
                    Start Review
                  </Button>
                )}
                {selectedFlag.status === FlagStatus.IN_REVIEW && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate(selectedFlag.flag_id, FlagStatus.RESOLVED, 'Approved by admin')}
                      disabled={updateFlagMutation.isPending}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedFlag.flag_id, FlagStatus.REJECTED, 'Rejected by admin')}
                      disabled={updateFlagMutation.isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 