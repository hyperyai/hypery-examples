# Hypery Auth Demo

A minimal demo app showcasing the `@hyperyai/sdk` authentication library.

## Features Demonstrated

### 🔐 Authentication Components
- `<HyperyProvider>` - Main auth provider wrapping the app
- `<SignIn />` - Pre-built sign-in button
- `<UserButton />` - Avatar with dropdown menu
- `<SignedIn />` - Conditional rendering for authenticated users
- `<SignedOut />` - Conditional rendering for unauthenticated users
- `<Protect />` - Route protection wrapper

### 🪝 Hooks
- `useUser()` - Access current user data
- `useHyperyAuth()` - Full auth context with methods
- `getAccessToken()` - Get valid access token for API requests

### 📄 Pages
- **Home** (`/`) - Landing page with sign-in
- **Protected** (`/protected`) - Demo of protected route
- **API Demo** (`/api-demo`) - Interactive API request demo
- **Modals** (`/modals`) - **Runnable source:** `app/modals/page.tsx` — real `fetch` to `/api/v1/chat/completions`, `RestrictionModal` on structured errors, `AuthModal` trigger
- **Examples** (`/examples`) - Component gallery (`AuthModal`, forms, hooks)
- **Callback** (`/callback`) - OAuth callback handler

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/callback
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
```

**Get your Client ID:**
1. Go to http://localhost:3001/settings/your-team/apps
2. Create a new app or use an existing one
3. Copy the Client ID
4. Add `http://localhost:3003/callback` to the redirect URIs

### 3. Run the App

```bash
npm run dev
```

Visit http://localhost:3003

## Testing the Demo

### Test Authentication Flow
1. Click "Sign in with Hypery"
2. You'll be redirected to http://localhost:3001
3. Authorize the application
4. You'll be redirected back and authenticated

### Test Protected Routes
1. While signed in, visit http://localhost:3003/protected
2. You'll see protected content
3. Sign out, then try visiting the same URL
4. You'll be automatically redirected to sign in

### Test API Requests
1. Navigate to http://localhost:3003/api-demo
2. Click "Get Access Token" to see your token
3. Click "Make Authenticated Request" to call the API
4. See the response from the Hypery API

### Test restriction / billing modals (real API)
1. Sign in, then open http://localhost:3003/modals
2. Click **Call /api/v1/chat/completions** — on success you’ll see the assistant text and raw JSON
3. If the hub returns a structured billing/limit error, **`RestrictionModal`** opens (same pattern as JustMakeIt)
4. Use **Open AuthModal** to exercise the sign-in dialog component
5. Source to copy from: `auth-demo/app/modals/page.tsx`

## Package Features Showcased

### Automatic Token Management
- Tokens are automatically refreshed before expiration
- No manual token handling required
- Secure storage in localStorage

### Seamless OAuth Flow
- PKCE (Proof Key for Code Exchange) for security
- State parameter for CSRF protection
- Automatic callback handling

### Developer-Friendly API
- React hooks for easy integration
- Pre-built components for rapid development
- TypeScript support out of the box

## Code Examples

### Basic Setup

```tsx
// app/layout.tsx
import { HyperyProvider } from '@hyperyai/sdk';

export default function RootLayout({ children }) {
  return (
    <HyperyProvider config={{
      clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      gatewayUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
      scopes: ['read', 'write', 'ai:chat'],
    }}>
      {children}
    </HyperyProvider>
  );
}
```

### Conditional Rendering

```tsx
import { SignedIn, SignedOut, SignIn, UserButton } from '@hyperyai/sdk';

function Header() {
  return (
    <>
      <SignedIn>
        <UserButton showUserInfo />
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  );
}
```

### Protected Routes

```tsx
import { Protect } from '@hyperyai/sdk';

export default function ProtectedPage() {
  return (
    <Protect>
      <YourProtectedContent />
    </Protect>
  );
}
```

### API Requests

```tsx
import { useHyperyAuth } from '@hyperyai/sdk';

function MyComponent() {
  const { getAccessToken } = useHyperyAuth();

  const fetchData = async () => {
    const token = await getAccessToken();
    
    const response = await fetch('/api/endpoint', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.json();
  };
}
```

## Project Structure

```
auth-demo/
├── app/
│   ├── api-demo/
│   │   └── page.tsx       # API demo page
│   ├── callback/
│   │   └── page.tsx       # OAuth callback handler
│   ├── protected/
│   │   └── page.tsx       # Protected route example
│   ├── layout.tsx         # Root layout with provider
│   ├── page.tsx           # Home page
│   └── globals.css
├── package.json
├── ENV.md                 # Environment setup guide
└── README.md
```

## Learn More

- **Package Documentation:** `/packages/hypery-sdk/README.md`
- **More Examples:** `/packages/hypery-sdk/EXAMPLES.md`
- **Hypery Docs:** http://localhost:3001/docs

## License

MIT
