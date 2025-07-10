# Flagging System Documentation

## Overview

The Flagging System is a comprehensive data quality management solution for Booksphere that allows users to report issues with book data without allowing direct edits to core book information. This system implements a context-menu pattern for seamless integration with existing UI components.

## Architecture

### Core Components

1. **FlaggingProvider** - Global state management and centralized keyboard handling
2. **FlaggingTrigger** - Context menu wrapper for any UI element
3. **FlaggingButton** - Explicit button component for flagging actions
4. **FlaggingForm** - Modal form for creating flags with validation
5. **useFlagging** - Hook for server-side flag operations

### Key Features

- **Context Menu Pattern**: Right-click any data field to flag it
- **Keyboard Shortcuts**: Ctrl+Shift+R to open flag form
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels
- **Type Safety**: Full TypeScript support with Zod validation
- **Performance**: Centralized event handling and optimized re-renders
- **Multi-tenancy**: Proper organization_id scoping for all operations

## Code Review Feedback Addressed

### 1. Toast Implementation
**Issue**: Concatenating title and description with newlines instead of using proper sonner API
**Solution**: Updated `useToast` to pass description as options object to sonner

```typescript
// Before (incorrect)
const message = description ? `${title}\n${description}` : title;
sonnerToast.error(message);

// After (correct)
const options = description ? { description } : {};
sonnerToast.error(title, options);
```

### 2. Dynamic Context Preview
**Issue**: Hardcoded context keys (bookTitle, author, isbn) limiting flexibility
**Solution**: Dynamic iteration over all contextData properties with safe string conversion

```typescript
// Before (hardcoded)
if (contextData?.bookTitle) {
  contextItems.push({ label: 'Book', value: contextData.bookTitle });
}

// After (dynamic)
return Object.entries(contextData)
  .filter(([_, value]) => value != null && value !== '')
  .map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
    value: String(value),
  }));
```

### 3. Performance Optimization
**Issue**: Multiple keyboard event listeners causing performance concerns
**Solution**: Centralized keyboard handling in FlaggingProvider with trigger registration

```typescript
// Centralized keyboard handling
useEffect(() => {
  const handleGlobalKeyboard = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      const triggerElement = document.activeElement?.closest('[data-flagging-trigger]');
      // Handle keyboard shortcut centrally
    }
  };
  
  document.addEventListener('keydown', handleGlobalKeyboard);
  return () => document.removeEventListener('keydown', handleGlobalKeyboard);
}, [registeredTriggers]);
```

### 4. Memory Optimization
**Issue**: Object recreations causing unnecessary re-renders
**Solution**: Memoized trigger data objects to prevent unnecessary effect re-runs

```typescript
const triggerData = React.useMemo(() => ({
  tableName,
  recordId,
  fieldName,
  currentValue,
  fieldLabel,
  contextData,
}), [tableName, recordId, fieldName, currentValue, fieldLabel, contextData]);
```

### 5. Type Safety Improvements
**Issue**: Unsafe type assertions and potential React node errors
**Solution**: Safe string conversions and proper null handling

```typescript
// Before
value={field.value as string || ''}

// After
value={String(field.value ?? '')}
```

## Usage Examples

### Basic Context Menu Integration

```tsx
import { FlaggingTrigger } from '@/components/flagging';

function BookTitle({ book }) {
  return (
    <FlaggingTrigger
      tableName="books"
      recordId={book.id}
      fieldName="title"
      currentValue={book.title}
      fieldLabel="Book Title"
      contextData={{
        bookTitle: book.title,
        author: book.author,
        isbn: book.isbn,
      }}
    >
      <span className="font-medium">{book.title}</span>
    </FlaggingTrigger>
  );
}
```

### Button-Based Flagging

```tsx
import { FlaggingButton } from '@/components/flagging';

function BookActions({ book }) {
  return (
    <FlaggingButton
      tableName="books"
      recordId={book.id}
      currentValue={`${book.title} by ${book.author}`}
      fieldLabel="Complete Book Record"
      contextData={{
        bookTitle: book.title,
        author: book.author,
        isbn: book.isbn,
      }}
      size="sm"
      variant="outline"
      showLabel={true}
    />
  );
}
```

### Application Setup

```tsx
import { FlaggingProvider } from '@/components/flagging';

function App() {
  return (
    <FlaggingProvider>
      {/* Your app components */}
    </FlaggingProvider>
  );
}
```

## API Reference

### FlaggingTrigger Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableName` | `'books' \| 'editions' \| 'stock_items'` | Yes | Database table name |
| `recordId` | `string` | Yes | UUID of the record |
| `fieldName` | `string` | No | Specific field being flagged |
| `currentValue` | `string` | Yes | Current value of the field |
| `fieldLabel` | `string` | Yes | Human-readable field label |
| `contextData` | `Record<string, unknown>` | No | Additional context. **Important:** To prevent performance issues, this object should be memoized (e.g., with `useMemo`) in the parent component. |
| `isFlagged` | `boolean` | No | Whether the field is already flagged |
| `flagStatus` | `FlagStatus` | No | Current flag status |
| `onOpenFlagForm` | `Function` | No | Custom flag form handler |
| `children` | `ReactNode` | Yes | Content to wrap |
| `className` | `string` | No | Additional CSS classes |

### FlaggingButton Props

Similar to FlaggingTrigger but with additional button-specific props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Button size |
| `variant` | `'ghost' \| 'outline' \| 'default'` | `'ghost'` | Button variant |
| `showLabel` | `boolean` | `false` | Whether to show "Flag" text |

### useFlagging Hook

```tsx
const {
  createFlag,
  updateFlagStatus,
  getFlags,
  // ... other methods
} = useFlagging();
```

## Database Schema

The flagging system uses the following database structure:

```sql
CREATE TABLE data_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT,
  flag_type flag_type_enum NOT NULL,
  severity flag_severity_enum NOT NULL,
  status flag_status_enum NOT NULL DEFAULT 'open',
  description TEXT,
  suggested_value TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ
);
```

## Security Considerations

1. **Multi-tenancy**: All operations are scoped by `organization_id`
2. **RLS Policies**: Row-level security ensures users can only access their organization's flags
3. **Input Validation**: All inputs are validated using Zod schemas
4. **SQL Injection Prevention**: All database operations use parameterized queries via Supabase RPCs

## Performance Optimizations

1. **Centralized Event Handling**: Single global keyboard listener instead of per-component listeners
2. **Memoized Objects**: Prevent unnecessary re-renders with React.useMemo
3. **Lazy Loading**: Form components only render when needed
4. **Debounced Queries**: Search operations are debounced to prevent excessive API calls

## Accessibility Features

1. **WCAG 2.1 AA Compliance**: All components meet accessibility standards
2. **Keyboard Navigation**: Full keyboard support with logical tab order
3. **Screen Reader Support**: Proper ARIA labels and descriptions
4. **High Contrast**: Visual indicators work in high contrast mode
5. **Touch Targets**: Minimum 44px touch targets for mobile devices

## Testing Strategy

1. **Unit Tests**: Component behavior and hook functionality
2. **Integration Tests**: End-to-end flag creation and management
3. **Accessibility Tests**: Automated a11y testing with jest-axe
4. **Performance Tests**: Memory usage and event listener efficiency
5. **Security Tests**: Multi-tenancy and input validation

## Migration Guide

To integrate the flagging system into existing components:

1. **Wrap existing elements** with `FlaggingTrigger`
2. **Add FlaggingProvider** to your app root
3. **Update imports** to use the new flagging components
4. **Test keyboard shortcuts** (Ctrl+Shift+R) on all flaggable elements

## Troubleshooting

### Common Issues

1. **Keyboard shortcuts not working**: Ensure elements have `data-flagging-trigger` attribute
2. **Context menu not appearing**: Check that ContextMenuTrigger is properly wrapped
3. **Form validation errors**: Verify Zod schemas match your data structure
4. **Performance issues**: Check for unnecessary re-renders with React DevTools

### Debug Mode

Enable debug logging by setting:
```typescript
const DEBUG_FLAGGING = process.env.NODE_ENV === 'development';
```

## Future Enhancements

1. **Bulk Operations**: Flag multiple records simultaneously
2. **Advanced Filtering**: Filter flags by date range, severity, etc.
3. **Notification System**: Real-time notifications for flag updates
4. **Analytics Dashboard**: Metrics on flag resolution rates
5. **AI-Powered Suggestions**: Automatic flag detection and suggestions

## Contributing

When contributing to the flagging system:

1. Follow the existing code patterns and TypeScript conventions
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure accessibility compliance for new components
5. Test multi-tenancy scenarios thoroughly

## License

This flagging system is part of the Booksphere project and follows the same licensing terms. 