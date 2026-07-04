# Restriction Modal Integration - JustMakeIt.AI

## Overview

Integrated structured error handling with a universal modal component that displays Hypery restrictions (spending limits, insufficient credits, and future restriction types) with actionable solutions.

## Problem

Previously, when restrictions were hit:
- Generic "Failed to get AI response" error shown
- No clear indication of what went wrong
- No actionable options for users
- Error code (429) alone wasn't enough for client-side detection
- Future restriction types couldn't be easily added

## Solution

### 1. Universal Restriction Modal

Created `RestrictionModal` component (`src/components/modals/RestrictionModal.tsx`) that:
- **Detects error type** based on structured error code
- **Renders appropriate UI** for each restriction type
- **Provides actionable buttons** specific to the error:
  - Spending limits → "Increase Limits" + reset timer
  - Insufficient credits → "Add Credits"
  - All errors → "Try Again" / "Close"
- **Extensible design** for future restriction types

### 2. Structured Error Detection

Updated `Chat.tsx` to:
- Parse error responses for structured `error` object
- Check for `errorData.error` presence (Hypery format)
- Extract error details (code, message, metadata)
- Display `RestrictionModal` instead of generic error message

### 3. Error Response Format

The API returns structured errors in this format:

```json
{
  "error": {
    "code": "SPENDING_LIMIT_EXCEEDED",
    "message": "Daily spending limit exceeded. Your limit will reset at 12:00 AM.",
    "type": "spending_limit_error",
    "limitType": "daily",
    "limit": 11,
    "current": 11,
    "requested": 5,
    "resetsAt": "2025-11-03T00:00:00.000Z"
  }
}
```

Or for insufficient credits:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits",
    "type": "insufficient_credits_error",
    "available": 0,
    "required": 5
  }
}
```

## Implementation Details

### RestrictionModal Component

**Location:** `src/components/modals/RestrictionModal.tsx`

**Props:**
```typescript
interface RestrictionModalProps {
  error: RestrictionError | null;
  onClose: () => void;
  onAddCredits?: () => void;
  onUpgradeLimits?: () => void;
  onRetry?: () => void;
}
```

**Features:**
- Detects error type via `error.code`
- Dynamic icon and color scheme (orange for limits, red for credits, blue for generic)
- Shows relevant details (current/limit, reset time, etc.)
- Formats reset time as human-readable ("in 2h 30m")
- Opens billing/settings pages in new tabs
- Fully styled with IDE theme variables

### Chat Component Updates

**Location:** `src/components/chat/Chat.tsx`

**Changes:**

1. **Added state:**
```typescript
const [restrictionError, setRestrictionError] = useState<RestrictionError | null>(null);
```

2. **Error detection (initial request):**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  
  if (errorData.error) {
    console.log('📛 Hypery restriction error:', errorData.error);
    setRestrictionError(errorData.error as RestrictionError);
    return; // Exit early, modal handles it
  }
  
  throw new Error('Failed to get AI response');
}
```

3. **Error detection (follow-up requests):**
```typescript
if (!followUpResponse.ok) {
  const errorData = await followUpResponse.json().catch(() => ({}));
  
  if (errorData.error) {
    console.log('📛 Hypery restriction error (follow-up):', errorData.error);
    setRestrictionError(errorData.error as RestrictionError);
    break;
  }
  // ...
}
```

4. **Modal integration:**
```tsx
<RestrictionModal
  error={restrictionError}
  onClose={() => setRestrictionError(null)}
  onAddCredits={() => {
    window.open('/settings/billing', '_blank');
  }}
  onUpgradeLimits={() => {
    window.open('/settings/authorized-apps', '_blank');
  }}
  onRetry={() => {
    setRestrictionError(null);
    // Could implement retry logic here
  }}
/>
```

## User Experience

### Spending Limit Exceeded

1. User makes AI request
2. API pre-check detects limit would be exceeded
3. Returns 429 with structured error
4. Modal appears with:
   - Orange theme
   - "Spending Limit Reached" title
   - Daily/Monthly usage bar (e.g., "11 / 11 credits")
   - Reset timer ("Resets in 3h 15m")
   - "Increase Limits" button → opens authorized apps settings
   - "Try Again" and "Close" buttons

### Insufficient Credits

1. User makes AI request
2. Account has 0 credits
3. Returns 402 with structured error
4. Modal appears with:
   - Red theme
   - "Insufficient Credits" title
   - Available vs. required breakdown
   - "Add Credits" button → opens billing page
   - "Close" button

### Generic Errors

1. Any other error with structured format
2. Modal appears with:
   - Blue theme
   - "Request Restricted" title
   - Error message
   - "Try Again" and "Close" buttons

## Future Restriction Types

The modal is designed to be extensible. To add a new restriction type:

1. **API returns new error code:**
```json
{
  "error": {
    "code": "MODEL_RESTRICTED",
    "message": "This app is not authorized to use this model",
    "type": "model_restriction_error",
    "model": "gpt-4",
    "allowedModels": ["gpt-3.5-turbo", "gpt-4o-mini"]
  }
}
```

2. **Modal automatically handles it:**
- Shows generic blue theme (no special case needed)
- Displays the error message
- Provides "Try Again" / "Close" options

3. **Optionally enhance UI:**
Add specific handling in `RestrictionModal.tsx`:
```typescript
const isModelRestricted = error.code === 'MODEL_RESTRICTED';

{isModelRestricted && (
  <div className="bg-[var(--bg-secondary)] p-4 mb-4">
    <p>Allowed models:</p>
    <ul>
      {error.allowedModels?.map(m => <li>{m}</li>)}
    </ul>
  </div>
)}
```

## Example: Complete Flow

```
User: "Generate an image of a sunset"
  ↓
Chat.tsx: handleSend() → POST /api/chat
  ↓
API: Pre-check spending limits
  ↓
❌ Daily limit exceeded (11/11 credits used)
  ↓
API: Return 429 with structured error:
{
  "error": {
    "code": "SPENDING_LIMIT_EXCEEDED",
    "limitType": "daily",
    "limit": 11,
    "current": 11,
    "requested": 5,
    "resetsAt": "2025-11-03T00:00:00.000Z"
  }
}
  ↓
Chat.tsx: Detect errorData.error
  ↓
Chat.tsx: setRestrictionError(errorData.error)
  ↓
RestrictionModal: Renders with orange theme
  ↓
User sees modal:
  - "Spending Limit Reached"
  - "Daily Limit: 11 / 11 credits"
  - "Resets in 3h 45m"
  - [Increase Limits] [Try Again] [Close]
  ↓
User clicks "Increase Limits"
  ↓
Opens /settings/authorized-apps in new tab
  ↓
User increases daily limit to 50
  ↓
Returns to IDE, clicks "Try Again"
  ↓
✅ Request succeeds!
```

## Testing

To test the modal:

1. **Spending Limit:**
   - Set daily limit to 11 credits in authorized apps
   - Make requests until limit is reached
   - Try another request
   - Verify modal shows with correct data

2. **Insufficient Credits:**
   - Reduce account balance to 0
   - Try to make a request
   - Verify modal shows with "Add Credits" button

3. **Generic Error:**
   - Force any other API error
   - Verify modal shows with generic theme

## Related Files

### Implementation
- `src/components/modals/RestrictionModal.tsx` - Modal component
- `src/components/chat/Chat.tsx` - Error detection and modal integration

### Backend
- `src/lib/errors/spending-limit-error.ts` - Error classes
- `src/lib/services/payments/credits.ts` - Pre-check logic
- `src/lib/services/proxy/index.ts` - Pre-check enforcement
- `src/app/api/v1/chat/completions/route.ts` - Error response formatting

### Documentation
- `/SPENDING_LIMIT_ERROR_HANDLING.md` - Structured error system
- `/SPENDING_LIMITS_TWO_PHASE_CHECK.md` - Two-phase enforcement
- `/EDIT_CREDIT_LIMITS_BUTTON_FIX.md` - Spending limits UI

## Benefits

1. **Clear User Communication**: Users know exactly what went wrong
2. **Actionable Solutions**: Direct links to fix the problem
3. **Programmatic Detection**: Client can definitively identify error types
4. **Extensible Design**: Future restrictions work automatically
5. **Consistent UX**: Same pattern across all restriction types
6. **No Ambiguity**: Structured errors vs. generic messages
7. **Better DX**: Easy to add new restriction types without modal changes

## Future Enhancements

- [ ] Implement retry logic that resends the last message
- [ ] Add "Retry with cheaper model" option when limits are hit
- [ ] Show usage trends in modal ("You've used 80% more this week")
- [ ] Predictive warnings at 80% of limit (before hitting it)
- [ ] Allow inline limit increases (without leaving IDE)
- [ ] Add "Remind me later" for limits with reset timer
- [ ] Show recent spending breakdown in modal

