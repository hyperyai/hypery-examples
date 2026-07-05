# Hypery Examples

Runnable example apps for building on [Hypery](https://hypery.ai) — OAuth
sign-in with [`@hyperyai/sdk`](https://github.com/hyperyai/hypery-sdk), AI API
calls, checkout, error/restriction handling, and both OAuth integration
patterns (frontend PKCE and backend proxy).

Each example is a **standalone app** with its own `package.json` — `cd` in,
install, and run. No monorepo tooling, no database (examples persist to
localStorage or a local JSON file).

## Examples

| App | Port | What it shows |
| --- | --- | --- |
| [`auth-demo`](./auth-demo) | 3003 | `@hyperyai/sdk` component gallery — sign-in, modals, checkout, hooks |
| [`chat`](./chat) | 3002 | Chat UI on the AI API; **backend-proxy** OAuth (confidential client) |
| [`fiber`](./fiber) | 3006 | React Three Fiber 3D generation with `@hyperyai/sdk` |
| [`imagine`](./imagine) | 3007 | Image generation; **backend-proxy** OAuth (confidential client) |
| [`justmakeit`](./justmakeit) | 3004 | AI IDE with MCP tools, Monaco, WebContainers; `@hyperyai/sdk` |
| [`vercel-demo`](./vercel-demo) | 3005 | Vercel AI SDK integration with `@hyperyai/sdk` |

Start with **[INTEGRATION_PATTERNS.md](./INTEGRATION_PATTERNS.md)** — it
explains the two OAuth patterns (frontend PKCE vs. backend proxy) and when to
use each.

## Setup

Every example talks to a Hypery gateway and needs an OAuth client:

1. Sign in to your gateway dashboard and go to **Settings → Apps → Create App**
2. Set the redirect URI to the example's callback (e.g.
   `http://localhost:3003/callback` — each app's `.env.example` has the exact
   value) and the scopes its README lists
3. Copy `.env.example` to `.env.local` inside the example and fill in your
   client ID (+ client secret **only** for the two backend-proxy examples,
   where it stays server-side)

```bash
cd auth-demo        # or any example
cp .env.example .env.local   # then edit
npm install
npm run dev
```

## Security notes

- **Never commit `.env.local`** (gitignored here; CI fails if any env file
  appears).
- **Never put a client secret in a `NEXT_PUBLIC_*` variable** — those are
  bundled into the browser. The PKCE examples need no secret at all.

## License

[MIT](./LICENSE).
