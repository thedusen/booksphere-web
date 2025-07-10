import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FlaggingProvider } from '@/components/flagging/FlaggingProvider'
import { FlagType, FlagSeverity } from '@/lib/types/flags'

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <FlaggingProvider>
        {children}
      </FlaggingProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockBook = (overrides = {}) => ({
  id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  isbn: '978-0-123456-78-9',
  publication_year: 2023,
  ...overrides,
})

export const createMockFlag = (overrides = {}) => ({
  flag_id: 'test-flag-id',
  table_name: 'books',
  record_id: 'test-record-id',
  field_name: 'title',
  flag_type: 'incorrect_data',
  severity: 'medium',
  status: 'open',
  description: 'Test flag description',
  suggested_value: 'Corrected value',
  details: null,
  flagged_by: 'test-user-id',
  organization_id: 'test-org-id',
  created_at: '2024-01-01T00:00:00Z',
  reviewed_by: null,
  resolution_notes: null,
  resolved_at: null,
  item_title: 'Test Book',
  ...overrides,
})

export const createMockFlagFormData = (overrides = {}) => ({
  table_name: 'books',
  record_id: 'test-record-id',
  field_name: 'title',
  flag_type: FlagType.INCORRECT_DATA,
  severity: FlagSeverity.MEDIUM,
  description: 'Test description',
  suggested_value: 'Corrected value',
  details: { source: 'test' },
  ...overrides,
}); 