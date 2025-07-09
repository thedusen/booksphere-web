# FlaggingProvider Usage Examples

## Basic Usage

The FlaggingProvider is now mounted globally in `apps/mobile/app/_layout.tsx` and provides access to flagging functionality throughout the app.

### Using the Context Hook

```tsx
import { useFlaggingContext } from '@/context/FlaggingContext';

function MyComponent() {
  const { 
    mutateFlag, 
    pendingFlags, 
    userMetadata, 
    isCreatingFlag 
  } = useFlaggingContext();

  const handleFlag = async () => {
    await mutateFlag({
      table_name: 'books',
      record_id: 'book-123',
      column_name: 'title',
      title: 'Incorrect book title',
      description: 'The title should be "Corrected Title"',
      suggested_correction: 'Corrected Title',
      flag_type: 'incorrect_data',
      flag_category: 'content_accuracy',
      priority: 'medium'
    });
  };

  return (
    <View>
      <Button 
        onPress={handleFlag} 
        disabled={isCreatingFlag}
        title={isCreatingFlag ? 'Submitting...' : 'Flag This'}
      />
      
      {/* Show pending flags count */}
      {pendingFlags.length > 0 && (
        <Text>{pendingFlags.length} flags pending</Text>
      )}
    </View>
  );
}
```

### Using with Existing Components

Update existing flagging components to use the context instead of the hook directly:

```tsx
// Before
import { useFlagging } from '@/hooks/useFlagging';

// After
import { useFlaggingContext } from '@/context/FlaggingContext';

function FlagButton() {
  // const { createFlag } = useFlagging(); // Old way
  const { mutateFlag } = useFlaggingContext(); // New way
  
  // The mutateFlag function handles pending state automatically
}
```

### Global Toast Notifications

Include the FlaggingStatusToast component in your main layout to show global flag status:

```tsx
import { FlaggingStatusToast } from '@/components/flagging';

function AppLayout() {
  return (
    <View>
      <FlaggingStatusToast />
      {/* Your app content */}
    </View>
  );
}
```

## Features Provided

### 1. Enhanced mutateFlag Function
- Automatically manages pending state
- Shows immediate feedback to users
- Handles retries for failed flags
- Auto-cleanup of successful flags

### 2. Pending Flags Cache
- Tracks all flag operations in progress
- Persists across component re-renders
- Provides retry functionality for failed flags
- Auto-cleanup of old flags

### 3. User/Org Metadata
- Centralized access to user information
- Organization context for multi-tenant features
- Authentication status checking

### 4. Global State Management
- Shared state across all app components
- No need to prop-drill flagging state
- Consistent API throughout the app

## Migration from Direct Hook Usage

Replace direct `useFlagging` hook usage with `useFlaggingContext`:

```tsx
// Old pattern
import { useFlagging } from '@/hooks/useFlagging';

function Component() {
  const { createFlag, isLoading } = useFlagging();
  
  const handleFlag = async () => {
    const result = await createFlag({...});
    if (result) {
      // Manual success handling
    }
  };
}

// New pattern
import { useFlaggingContext } from '@/context/FlaggingContext';

function Component() {
  const { mutateFlag, isCreatingFlag } = useFlaggingContext();
  
  const handleFlag = async () => {
    await mutateFlag({...}); // Automatic success/error handling
  };
}
```
