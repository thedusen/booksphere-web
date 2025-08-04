import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Add missing DOM API polyfills for jsdom
if (typeof Element !== 'undefined') {
  // Polyfill for Radix UI hasPointerCapture compatibility
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false)
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn()
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn()
  }
  // Polyfill for scrollIntoView
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn()
  }
}

// Mock useOrganization hook
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    organizationId: 'test-org-id',
    loading: false,
    error: null,
    user: { id: 'test-user-id' },
  })),
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
})

// Mock Supabase client globally for tests
vi.mock('@/lib/supabase', () => {
  const rpcMock = vi.fn(async (_fn: string, _params?: any) => ({
    data: null,
    error: null,
    status: 200,
    statusText: 'OK',
    count: null,
  }));

  const selectMock = vi.fn(() => Promise.resolve({ data: [], error: null, status: 200, statusText: 'OK', count: null }));

  const createQueryBuilder = () => {
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      or: vi.fn(() => builder),
      range: vi.fn(() => builder),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => builder),
      then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
    };
    return builder;
  };

  const fromMock = vi.fn(() => createQueryBuilder());

  const mockChannel = {
    subscribe: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };

  const channelMock = vi.fn(() => mockChannel);

  return {
    supabase: {
      rpc: rpcMock,
      from: fromMock,
      channel: channelMock,
      removeChannel: vi.fn(),
      auth: {
        getUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        })),
      },
    },
  };
});

// Ensure Supabase env vars are set for modules that do not use the mocked client
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test_anon_key'; 