/**
 * Unit tests for FlaggingTrigger component
 * 
 * Tests cover:
 * 1. Happy path scenarios (context menu, button functionality)
 * 2. Edge cases (missing props, null values)
 * 3. UI states (loading, disabled, flagged states)
 * 4. Accessibility (ARIA attributes, keyboard navigation)
 * 5. Error handling
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlaggingTrigger, FlaggingButton } from '../FlaggingTrigger'
import { FlaggingProvider } from '../FlaggingProvider'
import { FlagStatus } from '@/lib/types/flags'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the flagging context
const mockFlaggingContext = {
  registerTrigger: vi.fn(),
  unregisterTrigger: vi.fn(),
  openFlagForm: vi.fn(),
  isOpen: false,
  currentData: null,
}

vi.mock('../FlaggingProvider', () => ({
  FlaggingProvider: ({ children }: { children: React.ReactNode }) => children,
  useFlaggingContext: () => mockFlaggingContext,
}))

// Mock toast functionality
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

const defaultProps = {
  tableName: 'books' as const,
  recordId: 'test-record-id',
  fieldName: 'title',
  currentValue: 'Test Book Title',
  fieldLabel: 'Book Title',
  contextData: {
    bookTitle: 'Test Book Title',
    author: 'Test Author',
    isbn: '978-0-123456-78-9',
  },
}

const renderWithProvider = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <FlaggingProvider>
        {component}
      </FlaggingProvider>
    </QueryClientProvider>
  )
}

describe('FlaggingTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span data-testid="child-content">Book Title Content</span>
        </FlaggingTrigger>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Book Title Content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps} className="custom-class">
          <div data-testid="wrapper">Content</div>
        </FlaggingTrigger>
      )

      // Fix: Look for the ContextMenuTrigger wrapper, not the child element
      const contextMenuTrigger = screen.getByTestId('wrapper').closest('[class*="custom-class"]')
      expect(contextMenuTrigger).toBeInTheDocument()
      expect(contextMenuTrigger).toHaveClass('custom-class')
    })

    it('should register trigger on mount and unregister on unmount', () => {
      const { unmount } = renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span>Content</span>
        </FlaggingTrigger>
      )

      expect(mockFlaggingContext.registerTrigger).toHaveBeenCalledWith(
        'flag-trigger-test-record-id-title',
        expect.objectContaining({
          tableName: 'books',
          recordId: 'test-record-id',
          fieldName: 'title',
          currentValue: 'Test Book Title',
          fieldLabel: 'Book Title',
          contextData: defaultProps.contextData,
        })
      )

      unmount()

      expect(mockFlaggingContext.unregisterTrigger).toHaveBeenCalledWith(
        'flag-trigger-test-record-id-title'
      )
    })
  })

  describe('Context Menu Functionality', () => {
    it('should show context menu on right-click', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span data-testid="trigger-content">Right-click me</span>
        </FlaggingTrigger>
      )

      const content = screen.getByTestId('trigger-content')
      await user.pointer({ keys: '[MouseRight]', target: content })

      await waitFor(() => {
        expect(screen.getByText('Report Issue')).toBeInTheDocument()
      })
    })

    it('should call openFlagForm when context menu item is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span data-testid="trigger-content">Content</span>
        </FlaggingTrigger>
      )

      const content = screen.getByTestId('trigger-content')
      await user.pointer({ keys: '[MouseRight]', target: content })

      const flagMenuItem = await screen.findByText('Report Issue')
      await user.click(flagMenuItem)

      expect(mockFlaggingContext.openFlagForm).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'books',
          recordId: 'test-record-id',
          fieldName: 'title',
          currentValue: 'Test Book Title',
          fieldLabel: 'Book Title',
        })
      )
    })

    it('should use custom onOpenFlagForm when provided', async () => {
      const customHandler = vi.fn()
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingTrigger {...defaultProps} onOpenFlagForm={customHandler}>
          <span data-testid="trigger-content">Content</span>
        </FlaggingTrigger>
      )

      const content = screen.getByTestId('trigger-content')
      await user.pointer({ keys: '[MouseRight]', target: content })

      const flagMenuItem = await screen.findByText('Report Issue')
      await user.click(flagMenuItem)

      expect(customHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'books',
          recordId: 'test-record-id',
          fieldName: 'title',
        })
      )
      expect(mockFlaggingContext.openFlagForm).not.toHaveBeenCalled()
    })
  })

  describe('Flagged States', () => {
    it('should show correct status badge for flagged content', () => {
      renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.OPEN}
        >
          <span>Flagged content</span>
        </FlaggingTrigger>
      )

      expect(screen.getByText('Flagged')).toBeInTheDocument()
    })

    it('should show different status for different flag states', () => {
      const { rerender } = renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        >
          <span>Content</span>
        </FlaggingTrigger>
      )

      expect(screen.getByText('Resolved')).toBeInTheDocument()

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <FlaggingProvider>
            <FlaggingTrigger 
              {...defaultProps} 
              isFlagged={true} 
              flagStatus={FlagStatus.REJECTED}
            >
              <span>Content</span>
            </FlaggingTrigger>
          </FlaggingProvider>
        </QueryClientProvider>
      )

      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    it('should disable context menu for resolved flags', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        >
          <span data-testid="resolved-content">Resolved content</span>
        </FlaggingTrigger>
      )

      const content = screen.getByTestId('resolved-content')
      await user.pointer({ keys: '[MouseRight]', target: content })

      // Should not show context menu for resolved flags
      await waitFor(() => {
        expect(screen.queryByText('Report Issue')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span>Accessible Content</span>
        </FlaggingTrigger>
      )
      
      const content = screen.getByText('Accessible Content')
      const triggerContainer = content.closest('[data-flagging-trigger]')
      expect(triggerContainer).toHaveAttribute('data-flagging-trigger', 'flag-trigger-test-record-id-title')
      expect(triggerContainer).toHaveAttribute('aria-label', `Report issue with ${defaultProps.fieldLabel}. Right-click or press Ctrl+Shift+R to flag.`)
      expect(triggerContainer).toHaveAttribute('role', 'button')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <button data-testid="keyboard-target">Keyboard accessible</button>
        </FlaggingTrigger>
      )
      
      const button = screen.getByTestId('keyboard-target')
      await user.keyboard('{Tab}')
      
      expect(button.parentElement).toHaveFocus()
    })

    it('should have proper role attributes for screen readers', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span data-testid="screen-reader-content">Content</span>
        </FlaggingTrigger>
      );

      const triggerContainer = screen.getByRole('button');
      expect(triggerContainer).toBeInTheDocument();
    });
  })

  describe('Error Handling', () => {
    it('should handle missing contextData gracefully', () => {
      const propsWithoutContext = {
        ...defaultProps,
        contextData: undefined,
      }

      expect(() => {
        renderWithProvider(
          <FlaggingTrigger {...propsWithoutContext}>
            <span>Content without context</span>
          </FlaggingTrigger>
        )
      }).not.toThrow()
    })

    it('should handle empty currentValue', () => {
      const propsWithEmptyValue = {
        ...defaultProps,
        currentValue: '',
      }

      expect(() => {
        renderWithProvider(
          <FlaggingTrigger {...propsWithEmptyValue}>
            <span>Content with empty value</span>
          </FlaggingTrigger>
        )
      }).not.toThrow()
    })

    it('should handle null fieldName', () => {
      const propsWithNullField = {
        ...defaultProps,
        fieldName: undefined,
      }

      expect(() => {
        renderWithProvider(
          <FlaggingTrigger {...propsWithNullField}>
            <span>Content with null field</span>
          </FlaggingTrigger>
        )
      }).not.toThrow()
    })
  })
})

describe('FlaggingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render button with correct text', () => {
      renderWithProvider(<FlaggingButton {...defaultProps} />);
      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
    });

    it('should call openFlagForm when clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingButton {...defaultProps} />
      )

      const button = screen.getByRole('button')
      await user.click(button)
      expect(mockFlaggingContext.openFlagForm).toHaveBeenCalledTimes(1)
    })

    it('should apply custom variant and size', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} variant="outline" size="lg" />
      )

      const button = screen.getByRole('button')
      // Note: Class names depend on the UI library (shadcn/ui), so this is an approximation
      expect(button.className).toContain('border') 
      expect(button.className).toContain('h-10')
    })

    it('should show only icon when showLabel is false', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} showLabel={false} />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.queryByText('Report Issue')).not.toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should be disabled for resolved flags', () => {
      renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true}
          flagStatus={FlagStatus.RESOLVED}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show different text for flagged items', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} isFlagged={true} flagStatus={FlagStatus.OPEN} />
      );

      expect(screen.getByRole('button', { name: /update flag/i })).toBeInTheDocument();
    });
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      renderWithProvider(<FlaggingButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', `Report issue with ${defaultProps.fieldLabel}`);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithProvider(<FlaggingButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });
  });
}); 