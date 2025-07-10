import React from 'react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlaggingProvider, useFlaggingContext } from '../FlaggingProvider';
import { FlaggingForm } from '../FlaggingForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/useOrganization';
import { act } from '@testing-library/react';

// Mock FlaggingForm to see if it's rendered
vi.mock('../FlaggingForm', () => ({
  FlaggingForm: vi.fn(() => <div data-testid="flagging-form" />),
}));

// Mock the useOrganization hook
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    organizationId: 'test-org-id',
    loading: false,
    error: null,
  })),
}));

// Mock toast functionality
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const TestComponent = () => {
  const context = useFlaggingContext();
  const triggerData = {
    tableName: 'books' as const,
    recordId: 'test-id',
    fieldLabel: 'Test Field',
    currentValue: 'Test Value',
  };

  return (
    <div>
      <button onClick={() => context.openFlagForm(triggerData)}>Open Form</button>
      <div data-testid="is-open">{context.isOpen.toString()}</div>
      <div data-testid="current-data">{JSON.stringify(context.currentData)}</div>
    </div>
  );
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('FlaggingProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should provide default context values', () => {
      let contextValue: any;
      const Consumer = () => {
        contextValue = useFlaggingContext();
        return null;
      };
      renderWithQueryClient(
        <FlaggingProvider>
          <Consumer />
        </FlaggingProvider>
      );
      expect(contextValue.isOpen).toBe(false);
      expect(contextValue.currentData).toBeNull();
      expect(typeof contextValue.openFlagForm).toBe('function');
      expect(typeof contextValue.registerTrigger).toBe('function');
      expect(typeof contextValue.unregisterTrigger).toBe('function');
    });

    it('should open the form and set context data', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <FlaggingProvider>
          <TestComponent />
        </FlaggingProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
      await user.click(screen.getByRole('button', { name: 'Open Form' }));

      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
      // Fix: Check the actual element content, not using toContain with string
      const currentDataElement = screen.getByTestId('current-data');
      expect(currentDataElement).toHaveTextContent('test-id');
      expect(FlaggingForm).toHaveBeenCalled();
    });

    it('should close the form when onOpenChange is called from FlaggingForm', async () => {
        renderWithQueryClient(
            <FlaggingProvider>
              <TestComponent />
            </FlaggingProvider>
          );
    
          // Open the form first
          fireEvent.click(screen.getByRole('button', { name: 'Open Form' }));
          expect(FlaggingForm).toHaveBeenCalledTimes(1);
          
          // Wait for the form to open
          await waitFor(() => {
            expect(screen.getByTestId('is-open')).toHaveTextContent('true');
          });
    
          // Get the onOpenChange prop and call it
          const formProps = (FlaggingForm as MockedFunction<typeof FlaggingForm>).mock.calls[0][0];
          formProps.onOpenChange(false);
    
          // Wait for state update
          await waitFor(() => {
            expect(screen.getByTestId('is-open')).toHaveTextContent('false');
          });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should open the form with keyboard shortcut if a trigger is focused', async () => {
      const user = userEvent.setup();
      const triggerData = {
        tableName: 'books' as const,
        recordId: 'focused-id',
        fieldLabel: 'Focused Field',
        currentValue: 'Focused Value',
      };

      const FocusableTrigger = () => {
        const context = useFlaggingContext();
        const triggerRef = React.useRef<HTMLButtonElement>(null);

        React.useEffect(() => {
          context.registerTrigger('focused-trigger', triggerData);
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
          return () => context.unregisterTrigger('focused-trigger');
        }, [context]);

        return (
          <button 
            ref={triggerRef}
            data-flagging-trigger="focused-trigger"
          >
            Focused Button
          </button>
        );
      };

      renderWithQueryClient(
        <FlaggingProvider>
          <FocusableTrigger />
          <TestComponent />
        </FlaggingProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Focused Button' })).toHaveFocus();
      });
      
      // Simulate the keydown event on the document
      await act(async () => {
        fireEvent.keyDown(document, { key: 'R', ctrlKey: true, shiftKey: true });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('is-open')).toHaveTextContent('true');
      });
      
      const currentDataElement = screen.getByTestId('current-data');
      expect(currentDataElement).toHaveTextContent('focused-id');
    });

    it('should not open form if no trigger is focused', async () => {
        const user = userEvent.setup();
        renderWithQueryClient(
          <FlaggingProvider>
            <TestComponent />
          </FlaggingProvider>
        );
  
        await user.keyboard('{Control>}{Shift>}R{/Shift}{/Control}');
  
        expect(screen.getByTestId('is-open')).toHaveTextContent('false');
      });
  });

  describe('Focus Management', () => {
    it('should return focus to the trigger element when form is closed', async () => {
        const user = userEvent.setup();
        const triggerData = {
          tableName: 'books' as const,
          recordId: 'focus-return-id',
          fieldLabel: 'Focus Field',
          currentValue: 'Focus Value',
        };
  
        const FocusTest = () => {
          const context = useFlaggingContext();
          return (
            <button
              data-flagging-trigger="true"
              onClick={() => context.openFlagForm(triggerData)}
            >
              Open Form For Focus Test
            </button>
          );
        };
  
        renderWithQueryClient(
          <FlaggingProvider>
            <FocusTest />
          </FlaggingProvider>
        );
  
        const button = screen.getByRole('button');
        await user.click(button);
  
        // Form opens (mocked)
        expect(FlaggingForm).toHaveBeenCalled();
  
        // Close the form
        const formProps = (FlaggingForm as MockedFunction<typeof FlaggingForm>).mock.calls[0][0];
        formProps.onOpenChange(false);
  
        // Wait for focus to return
        await waitFor(() => {
          expect(button).toHaveFocus();
        });
      });
  });
}); 