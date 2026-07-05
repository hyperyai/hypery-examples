# Environment Variables

Copy `.env.example` to `.env.local` in this directory and fill in your values.

## Required Variables

```bash
# Hypery gateway URL (API endpoint + dashboard)
NEXT_PUBLIC_AI_GATEWAY_URL=https://your-gateway.example.com

# Dashboard URL for managing credits/limits (usually the same host)
NEXT_PUBLIC_GATEWAY_HUB_URL=https://your-gateway.example.com

# OAuth configuration (public PKCE client — no secret needed or used)
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3004/callback
```

> **Never put a client secret in a `NEXT_PUBLIC_*` variable.** Those values are
> bundled into the browser build. This demo uses OAuth 2.0 + PKCE via
> `@hyperyai/sdk`, which is a public-client flow — it does not need a secret.

## Getting OAuth Credentials

1. Sign in to your Hypery gateway dashboard
2. Go to **Settings → Apps** and click **Create App**
3. Fill in:
   - Name: "JustMakeIt.AI"
   - Description: "AI-powered IDE"
   - Redirect URI: `http://localhost:3004/callback`
   - Scopes: `read`, `write`, `ai:chat`, `ai:completions`
4. Copy the **Client ID** into your `.env.local`

## Workspace storage

Workspaces persist to a local JSON file (`.data/workspaces.json`, gitignored).
No database setup is required.

## How Restriction Errors Work

When you hit a spending limit or run out of credits:

1. **The error comes from the gateway** with structured data
2. **A modal appears in JustMakeIt.AI** (port 3004) showing the restriction details
3. **Action buttons redirect to the gateway dashboard** — from there you can top up
   credits (**Billing**) or manage spending limits (**Authorized Apps**)
4. **After fixing the issue**, come back to JustMakeIt.AI and click "Try Again"

The `NEXT_PUBLIC_GATEWAY_HUB_URL` variable controls where the modal redirects you.
