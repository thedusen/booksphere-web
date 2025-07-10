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
  return render(
    <FlaggingProvider>
      {component}
    </FlaggingProvider>
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

      const wrapper = screen.getByTestId('wrapper').closest('[data-testid*="flag-trigger"]')
      expect(wrapper).toHaveClass('custom-class')
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
          flagStatus={FlagStatus.IN_REVIEW}
        >
          <span>Content</span>
        </FlaggingTrigger>
      )

      expect(screen.getByText('Under Review')).toBeInTheDocument()

      rerender(
        <FlaggingProvider>
          <FlaggingTrigger 
            {...defaultProps} 
            isFlagged={true} 
            flagStatus={FlagStatus.RESOLVED}
          >
            <span>Content</span>
          </FlaggingTrigger>
        </FlaggingProvider>
      )

      expect(screen.getByText('Resolved')).toBeInTheDocument()
    })

    it('should disable context menu for resolved flags', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        >
          <span data-testid="trigger-content">Resolved content</span>
        </FlaggingTrigger>
      )

      const content = screen.getByTestId('trigger-content')
      await user.pointer({ keys: '[MouseRight]', target: content })

      // Context menu should not appear or should be disabled
      await waitFor(() => {
        const reportButton = screen.queryByText('Report Issue')
        if (reportButton) {
          expect(reportButton).toBeDisabled()
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span data-testid="content">Content</span>
        </FlaggingTrigger>
      )

      const trigger = screen.getByTestId('content').closest('[role="button"]')
      expect(trigger).toHaveAttribute('aria-describedby')
      expect(trigger).toHaveAttribute('data-flagging-trigger', 'true')
    })

    it('should have correct aria-disabled state for terminal flag states', () => {
      renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        >
          <span data-testid="content">Content</span>
        </FlaggingTrigger>
      )

      const trigger = screen.getByTestId('content').closest('[role="button"]')
      expect(trigger).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not be disabled for actionable flag states', () => {
      renderWithProvider(
        <FlaggingTrigger 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.OPEN}
        >
          <span data-testid="content">Content</span>
        </FlaggingTrigger>
      )

      const trigger = screen.getByTestId('content').closest('[role="button"]')
      expect(trigger).toHaveAttribute('aria-disabled', 'false')
    })

    it('should have proper help text', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps}>
          <span>Content</span>
        </FlaggingTrigger>
      )

      const helpText = screen.getByText(/Right-click to report an issue/)
      expect(helpText).toBeInTheDocument()
      expect(helpText).toHaveClass('sr-only')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing optional props', () => {
      const minimalProps = {
        tableName: 'books' as const,
        recordId: 'test-record-id',
        currentValue: 'Test Value',
        fieldLabel: 'Test Field',
      }

      expect(() => {
        renderWithProvider(
          <FlaggingTrigger {...minimalProps}>
            <span>Content</span>
          </FlaggingTrigger>
        )
      }).not.toThrow()
    })

    it('should handle empty contextData', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps} contextData={{}}>
          <span>Content</span>
        </FlaggingTrigger>
      )

      expect(mockFlaggingContext.registerTrigger).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contextData: {},
        })
      )
    })

    it('should handle null contextData', () => {
      renderWithProvider(
        <FlaggingTrigger {...defaultProps} contextData={undefined}>
          <span>Content</span>
        </FlaggingTrigger>
      )

      expect(mockFlaggingContext.registerTrigger).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contextData: undefined,
        })
      )
    })

    it('should handle record-level flagging (no fieldName)', () => {
      const { fieldName, ...recordProps } = defaultProps;

      renderWithProvider(
        <FlaggingTrigger {...recordProps}>
          <span>Record content</span>
        </FlaggingTrigger>
      );

      expect(mockFlaggingContext.registerTrigger).toHaveBeenCalledWith(
        'flag-trigger-test-record-id-record',
        expect.objectContaining({
          fieldName: undefined,
        })
      );
    });
  })
})

describe('FlaggingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render button with correct text', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} showLabel={true} />
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Report Issue')).toBeInTheDocument()
    })

    it('should render icon only when showLabel is false', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} showLabel={false} />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.queryByText('Report Issue')).not.toBeInTheDocument()
    })

    it('should apply size variants correctly', () => {
      const { rerender } = renderWithProvider(
        <FlaggingButton {...defaultProps} size="sm" />
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-8') // sm size class

      rerender(
        <FlaggingProvider>
          <FlaggingButton {...defaultProps} size="lg" />
        </FlaggingProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('h-10') // lg size class
    })

    it('should apply variant styles correctly', () => {
      const { rerender } = renderWithProvider(
        <FlaggingButton {...defaultProps} variant="outline" />
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('border-input')

      rerender(
        <FlaggingProvider>
          <FlaggingButton {...defaultProps} variant="ghost" />
        </FlaggingProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })
  })

  describe('Button Functionality', () => {
    it('should call openFlagForm when clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingButton {...defaultProps} />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockFlaggingContext.openFlagForm).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'books',
          recordId: 'test-record-id',
          fieldName: 'title',
        })
      )
    })

    it('should use custom onOpenFlagForm when provided', async () => {
      const customHandler = vi.fn()
      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingButton {...defaultProps} onOpenFlagForm={customHandler} />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(customHandler).toHaveBeenCalled()
      expect(mockFlaggingContext.openFlagForm).not.toHaveBeenCalled()
    })
  })

  describe('Status-Aware Styling', () => {
    it('should show correct text for different flag states', () => {
      const { rerender } = renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.OPEN}
          showLabel={true}
        />
      )

      expect(screen.getByText('Update Flag')).toBeInTheDocument()

      rerender(
        <FlaggingProvider>
          <FlaggingButton 
            {...defaultProps} 
            isFlagged={true} 
            flagStatus={FlagStatus.IN_REVIEW}
            showLabel={true}
          />
        </FlaggingProvider>
      )

      expect(screen.getByText('Under Review')).toBeInTheDocument()

      rerender(
        <FlaggingProvider>
          <FlaggingButton 
            {...defaultProps} 
            isFlagged={true} 
            flagStatus={FlagStatus.RESOLVED}
            showLabel={true}
          />
        </FlaggingProvider>
      )

      expect(screen.getByText('Resolved')).toBeInTheDocument()
    })

    it('should apply correct styling for actionable states', () => {
      renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.OPEN}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-orange-200', 'text-orange-700')
    })

    it('should apply correct styling for terminal states', () => {
      renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-green-200', 'text-green-700')
    })

    it('should be disabled for terminal states', () => {
      renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.RESOLVED}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should not be disabled for actionable states', () => {
      renderWithProvider(
        <FlaggingButton 
          {...defaultProps} 
          isFlagged={true} 
          flagStatus={FlagStatus.OPEN}
        />
      )

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'false')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby')
      expect(button).toHaveAttribute('data-flagging-trigger', 'true')
    })

    it('should have accessible label when showLabel is false', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} showLabel={false} />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Report Issue')
    })

    it('should have proper help text', () => {
      renderWithProvider(
        <FlaggingButton {...defaultProps} />
      )

      const helpText = screen.getByText(/Click to report an issue/)
      expect(helpText).toBeInTheDocument()
      expect(helpText).toHaveClass('sr-only')
    })
  })

  describe('Error Handling', () => {
    it('should handle click events when context is unavailable', async () => {
      // Mock missing context
      vi.mocked(mockFlaggingContext.openFlagForm).mockImplementation(() => {
        throw new Error('Context unavailable')
      })

      const user = userEvent.setup()
      
      renderWithProvider(
        <FlaggingButton {...defaultProps} />
      )

      const button = screen.getByRole('button')
      
      // Should not throw error
      await expect(user.click(button)).resolves.not.toThrow()
    })
  })
}) 