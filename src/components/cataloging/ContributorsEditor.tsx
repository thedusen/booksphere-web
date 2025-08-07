/**
 * ContributorsEditor Component
 * 
 * Manages book contributors (authors, illustrators, editors, etc.)
 * Based on mobile app patterns for consistent UX
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Plus, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Default author type ID for "Author"
const DEFAULT_AUTHOR_TYPE_ID = '8d3afa07-239b-49bb-afd9-b2dc85348b03';

// Role to author_type_id mapping (from mobile app)
const ROLE_TO_AUTHOR_TYPE_ID: Record<string, string> = {
  'Author': '8d3afa07-239b-49bb-afd9-b2dc85348b03',
  'Editor': 'c3c44423-ff5c-4b0c-a6e1-22c88835fa0c',
  'Foreword': '7a29b4dc-48fa-4426-8b90-b0822d298554',
  'Illustrator': 'd346048d-3917-4eda-a2e2-d3bddfe59c1d',
  'Introduction': '6987cdf7-9283-4c68-8989-eea96e1cf4b6',
  'Photographer': 'dace9ee1-9f62-4901-b3cb-71fc8ef42b2e',
  'Translator': '980a495a-2a3d-4546-8d99-49348cc2aa6a'
};

export interface Contributor {
  name: string;
  author_type_id?: string;
  role?: string;
}

interface ContributorsEditorProps {
  contributors: Contributor[];
  onContributorsChange: (contributors: Contributor[]) => void;
  label?: string;
  maxContributors?: number;
}

export function ContributorsEditor({
  contributors = [],
  onContributorsChange,
  label = 'Contributors',
  maxContributors = 10
}: ContributorsEditorProps) {
  const [newContributorName, setNewContributorName] = useState('');
  const [newContributorRole, setNewContributorRole] = useState('Author');

  const addContributor = useCallback(() => {
    if (!newContributorName.trim()) {
      toast.error('Please enter a contributor name');
      return;
    }

    if (contributors.length >= maxContributors) {
      toast.error(`Maximum ${maxContributors} contributors allowed`);
      return;
    }

    // Check for duplicates
    const exists = contributors.some(c => 
      c.name.toLowerCase() === newContributorName.trim().toLowerCase() &&
      c.role === newContributorRole
    );

    if (exists) {
      toast.error('This contributor already exists with the same role');
      return;
    }

    const newContributor: Contributor = {
      name: newContributorName.trim(),
      author_type_id: ROLE_TO_AUTHOR_TYPE_ID[newContributorRole] || DEFAULT_AUTHOR_TYPE_ID,
      role: newContributorRole
    };

    onContributorsChange([...contributors, newContributor]);
    setNewContributorName('');
    setNewContributorRole('Author');
  }, [contributors, newContributorName, newContributorRole, onContributorsChange, maxContributors]);

  const removeContributor = useCallback((index: number) => {
    const updated = contributors.filter((_, i) => i !== index);
    onContributorsChange(updated);
  }, [contributors, onContributorsChange]);

  const updateContributor = useCallback((index: number, updates: Partial<Contributor>) => {
    const updated = contributors.map((contributor, i) => 
      i === index ? { ...contributor, ...updates } : contributor
    );
    onContributorsChange(updated);
  }, [contributors, onContributorsChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addContributor();
    }
  }, [addContributor]);

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Existing Contributors */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Current Contributors ({contributors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {contributors.map((contributor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contributor.name}</p>
                    <p className="text-sm text-muted-foreground">{contributor.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {contributor.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContributor(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New Contributor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Contributor</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <Label htmlFor="contributor-name" className="text-sm">Name</Label>
              <Input
                id="contributor-name"
                value={newContributorName}
                onChange={(e) => setNewContributorName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter contributor name"
              />
            </div>

            <div>
              <Label htmlFor="contributor-role" className="text-sm">Role</Label>
              <Select value={newContributorRole} onValueChange={setNewContributorRole}>
                <SelectTrigger id="contributor-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ROLE_TO_AUTHOR_TYPE_ID).map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={addContributor}
              disabled={!newContributorName.trim() || contributors.length >= maxContributors}
              className="w-full"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contributor
            </Button>
          </div>
        </CardContent>
      </Card>

      {contributors.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No contributors added yet. Add at least one author.
        </div>
      )}
    </div>
  );
}

// Helper function to convert contributors to the format expected by the backend
export const formatContributorsForBackend = (contributors: Contributor[]) => {
  return contributors
    .filter(contributor => contributor.name.trim())
    .map(contributor => ({
      name: contributor.name.trim(),
      author_type_id: contributor.author_type_id || DEFAULT_AUTHOR_TYPE_ID,
      role: contributor.role || 'Author'
    }));
};

// Helper function to initialize contributors from authors array (for AI job data)
export const initializeContributorsFromAuthors = (authors: string[] = []): Contributor[] => {
  return authors.map(name => ({
    name: name.trim(),
    author_type_id: DEFAULT_AUTHOR_TYPE_ID,
    role: 'Author'
  }));
};