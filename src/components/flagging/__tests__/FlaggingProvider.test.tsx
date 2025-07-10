import React from 'react';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlaggingProvider, useFlaggingContext } from '../FlaggingProvider';
import { FlaggingForm } from '../FlaggingForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrganization } from '@/hooks/useOrganization';

// Mock FlaggingForm to see if it's rendered
vi.mock('../FlaggingForm', () => ({
  FlaggingForm: vi.fn(() => <div data-testid="flagging-form" />),
}));

// Mock the useOrganization hook
vi.mock('@/hooks/useOrganization');

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
      render(
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
      render(
        <FlaggingProvider>
          <TestComponent />
        </FlaggingProvider>
      );

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
      await user.click(screen.getByRole('button', { name: 'Open Form' }));

      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
      expect(screen.getByTestId('current-data')).toContain('test-id');
      expect(FlaggingForm).toHaveBeenCalled();
    });

    it('should close the form when onOpenChange is called from FlaggingForm', () => {
        render(
            <FlaggingProvider>
              <TestComponent />
            </FlaggingProvider>
          );
    
          // Open the form first
          fireEvent.click(screen.getByRole('button', { name: 'Open Form' }));
          expect(FlaggingForm).toHaveBeenCalledTimes(1);
    
          // Get the onOpenChange prop and call it
          const formProps = (FlaggingForm as MockedFunction<typeof FlaggingForm>).mock.calls[0][0];
          formProps.onOpenChange(false);
    
          expect(screen.getByTestId('is-open')).toHaveTextContent('false');
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
          triggerRef.current?.focus();
          return () => context.unregisterTrigger('focused-trigger');
        }, [context]);

        return <button ref={triggerRef}>Focused Button</button>;
      };

      render(
        <FlaggingProvider>
          <FocusableTrigger />
          <TestComponent />
        </FlaggingProvider>
      );
      
      await user.keyboard('{Control>}{Shift>}R{/Shift}{/Control}');
      
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
      expect(screen.getByTestId('current-data')).toContain('focused-id');
    });

    it('should not open form if no trigger is focused', async () => {
        const user = userEvent.setup();
        render(
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
  
        render(
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
  
        // Check if focus returned to the button
        expect(button).toHaveFocus();
      });
  });
}); 