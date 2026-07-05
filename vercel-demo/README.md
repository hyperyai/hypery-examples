# Vercel AI SDK Demo

Demo app showcasing the Vercel AI SDK with Hypery authentication, built on the [`@hyperyai/sdk`](https://github.com/hyperyai/hypery-sdk) package (authentication, checkout, and error handling).

## Features

- ✅ **OAuth 2.0 Authentication** - Secure login with Hypery
- ✅ **Lazy Authentication** - Users can start typing and are prompted to sign in when needed
- ✅ **Vercel AI SDK Integration** - Uses `@ai-sdk/react` for chat interface
- ✅ **Error Handling** - Shows modals for insufficient credits, spending limits, etc.
- ✅ **Multiple Models** - Switch between GPT-4o, Deepseek R1, and more
- ✅ **Streaming Responses** - Real-time message streaming
- ✅ **Web Search** - Optional web search capability

## Setup

### 1. Register Your App

1. Go to [Hypery](http://localhost:3001) (or your production URL)
2. Navigate to Settings → Apps → Create New App
3. Fill in:
   - **Name**: Vercel AI SDK Demo
   - **Redirect URI**: `http://localhost:3005/callback`
   - **Scopes**: `ai:chat`, `ai:models`
4. Save and copy your **Client ID**

### 2. Configure Environment

Create a `.env.local` file:

```bash
# OAuth App Credentials (from Hypery)
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3005/callback

# Hypery API URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
```

### 3. Install Dependencies

From the root of the project:

```bash
npm install
```

### 4. Run Dev Server

```bash
cd vercel-demo
npm run dev
# Open http://localhost:3005
```

## How It Works

### Authentication Flow

1. **Initial State**: Users see the chat interface immediately (no auth wall)
2. **User Types**: They can start typing in the chat input
3. **Submit Attempt**: When they press Enter:
   - If authenticated → Message is sent
   - If not authenticated → `AuthModal` appears prompting them to sign in
4. **OAuth Flow**: User signs in via Hypery OAuth
5. **Token Storage**: Access token is stored in localStorage by `@hyperyai/sdk`
6. **Authenticated Requests**: API route automatically includes token from cookies

### API Route

The `/api/chat/route.ts` endpoint:
- Extracts OAuth token from cookies or Authorization header
- Proxies requests to Hypery's `/api/v1/chat/completions`
- Returns streaming text responses using Vercel AI SDK's `streamText()`

```typescript
const aiGateway = createOpenAI({
  apiKey: accessToken,  // OAuth token
  baseURL: `${AI_GATEWAY_URL}/api/v1`,
});

const result = streamText({
  model: aiGateway('openai/gpt-4o'),
  messages: body.messages,
});
```

### Error Handling

The app uses `@hyperyai/sdk` to display structured error modals:

- **Insufficient Credits**: Shows current balance and link to add credits
- **Spending Limit Exceeded**: Shows app's spending limits and usage
- **Authentication Required**: Shows sign-in modal

## Packages Used

### `@hyperyai/sdk`

Provides OAuth 2.0 authentication with Hypery:

```typescript
import { HyperyProvider, useHyperyAuth, AuthModal } from '@hyperyai/sdk';

const { isAuthenticated, getAccessToken, user } = useHyperyAuth();
```

### Error handling

Handles structured errors from Hypery:

```typescript
import { RestrictionModal, type RestrictionError } from '@hyperyai/sdk';

<RestrictionModal
  error={restrictionError}
  appId={clientId}
  gatewayUrl={gatewayUrl}
  getAccessToken={getAccessToken}
  onClose={() => setRestrictionError(null)}
/>
```

[Learn more →](https://github.com/hyperyai/hypery-sdk)

## Architecture

```
┌─────────────────────┐
│   User Interface    │
│   (Next.js App)     │
└──────────┬──────────┘
           │
           │ 1. User types & submits
           ↓
┌─────────────────────┐
│  @hyperyai/sdk    │
│  Check if authed    │
└──────────┬──────────┘
           │
           │ 2. If not authed → Show AuthModal
           │ 3. If authed → Send message
           ↓
┌─────────────────────┐
│   /api/chat         │
│   Next.js API       │
└──────────┬──────────┘
           │
           │ 4. Extract token from cookie
           │ 5. Proxy to Hypery
           ↓
┌─────────────────────┐
│  Hypery     │
│  /api/v1/chat       │
└──────────┬──────────┘
           │
           │ 6. Validate token & permissions
           │ 7. Check credits & limits
           │ 8. Call AI provider
           ↓
┌─────────────────────┐
│   AI Provider       │
│   (OpenRouter, etc) │
└──────────┬──────────┘
           │
           │ 9. Stream response back
           └────────────────────→
```

## Development Tips

### Testing Without Auth

To test the auth flow, clear your browser's localStorage:

```javascript
localStorage.clear()
```

Then try sending a message - you should see the AuthModal.

### Debugging

Enable debug logs in the auth package:

```typescript
// In layout.tsx
<HyperyProvider
  config={{
    // ...
    debug: true  // Enable console logs
  }}
>
```

### Custom Error Handling

You can customize error handling in the `useChat` hook:

```typescript
const { messages, sendMessage, status } = useChat({
  onError: (error) => {
    // Custom error logic
    const errorData = JSON.parse(error.message);
    if (errorData.error?.requiresAuth) {
      setShowAuthModal(true);
    }
  },
});
```

## Production Deployment

### Environment Variables

Update `.env.production`:

```bash
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_production_client_id
NEXT_PUBLIC_REDIRECT_URI=https://your-app.com/callback
NEXT_PUBLIC_AUTH_URL=https://api.hypery.ai
```

### Register Production App

Create a separate OAuth app in Hypery for production with your production redirect URI.

## Support

For issues or questions:
- [Hypery Documentation](https://docs.hypery.ai)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [GitHub Issues](https://github.com/your-org/hypery/issues)
