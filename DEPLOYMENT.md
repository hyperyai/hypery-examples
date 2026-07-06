# Deploying the examples to Vercel

Each example is a **standalone Next.js app** in its own subdirectory. To host live
demos, create **one Vercel project per app**, with the app's folder set as the
project's **Root Directory**. They all consume the published `@hyperyai/sdk` from
npm and build with the default `next build` — no special build config needed.

## The app matrix

| App | Root Directory | Suggested Vercel project | Needs a server secret? |
| --- | --- | --- | --- |
| auth-demo   | `auth-demo`   | `hypery-auth-demo`   | no |
| chat        | `chat`        | `hypery-chat`        | **yes** (`OAUTH_CLIENT_SECRET`) |
| fiber       | `fiber`       | `hypery-fiber`       | no |
| imagine     | `imagine`     | `hypery-imagine`     | **yes** (`OAUTH_CLIENT_SECRET`) |
| justmakeit  | `justmakeit`  | `hypery-justmakeit`  | no |
| vercel-demo | `vercel-demo` | `hypery-vercel-demo` | optional (`NEXT_PUBLIC_GATEWAY_API_KEY`) |

With those project names the production URL is predictable — `https://<project>.vercel.app`
(e.g. `https://hypery-auth-demo.vercel.app`) — so you can register the OAuth redirect
URI **before** the first deploy and avoid a redeploy cycle.

## One-time: register an OAuth app (per demo) in Hypery

Every demo signs in via Hypery OAuth, so each needs a **redirect URI** registered.
In the Hypery dashboard → **Apps → Create app** (one per demo, or one app with all
the redirect URIs), set:

- **Redirect URI:** `https://<project>.vercel.app/callback`
- **Scopes:** `read`, `write`, `ai:chat`, `ai:models`, `ai:images`, `billing:read`
- Copy the **Client ID** (`app_…`). For `chat` and `imagine` also copy the **Client Secret**.

> If the redirect URI doesn't exactly match what the deployed app sends, sign-in fails
> with `redirect_uri_mismatch`. Include the `/callback` path.

## Deploy — Dashboard (recommended, auto-deploys on push)

Do this once per app:

1. **vercel.com → Add New → Project → Import** `hyperyai/hypery-examples`.
2. **Root Directory:** click *Edit* and choose the app folder (e.g. `auth-demo`). Framework auto-detects as **Next.js**.
3. **Project Name:** set it to the suggested name (so the URL is predictable).
4. **Environment Variables:** add the app's vars (table below).
5. **Deploy.** Live at `https://<project>.vercel.app`. Every push to `main` redeploys; PRs get preview URLs.

## Deploy — CLI (alternative)

```bash
vercel login                      # once
cd <app>                          # e.g. cd auth-demo
vercel link --project hypery-<app>    # creates the project, root = this dir
vercel env add NEXT_PUBLIC_OAUTH_CLIENT_ID production   # repeat per var
vercel --prod                     # deploy
```

## Environment variables per app

Set these in Vercel (Project → Settings → Environment Variables). Use your gateway
origin — the Hypery API is `https://hypery.ai` and the v1 base is
`https://hypery.ai/api/v1`. `REDIRECT_URI` is always `https://<project>.vercel.app/callback`.

**auth-demo**
```
NEXT_PUBLIC_AUTH_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-auth-demo.vercel.app/callback
NEXT_PUBLIC_DEMO_SELLER_APP_ID=app_…   # optional: enables the "buy" checkout demo
```

**fiber**
```
NEXT_PUBLIC_AUTH_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-fiber.vercel.app/callback
```

**justmakeit**
```
NEXT_PUBLIC_AI_GATEWAY_URL=https://hypery.ai
NEXT_PUBLIC_GATEWAY_HUB_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-justmakeit.vercel.app/callback
```

**chat** (backend-proxy OAuth — the secret is server-side, do NOT prefix it with `NEXT_PUBLIC_`)
```
NEXT_PUBLIC_API_URL=https://hypery.ai/api/v1
NEXT_PUBLIC_AUTH_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-chat.vercel.app/callback
OAUTH_CLIENT_SECRET=…            # mark as "Sensitive" in Vercel
```

**imagine** (backend-proxy OAuth)
```
NEXT_PUBLIC_API_URL=https://hypery.ai/api/v1
NEXT_PUBLIC_CORE_API_URL=https://hypery.ai
NEXT_PUBLIC_AUTH_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-imagine.vercel.app/callback
OAUTH_CLIENT_SECRET=…            # mark as "Sensitive" in Vercel
```

**vercel-demo**
```
NEXT_PUBLIC_API_URL=https://hypery.ai/api/v1
NEXT_PUBLIC_AUTH_URL=https://hypery.ai
NEXT_PUBLIC_OAUTH_CLIENT_ID=app_…
NEXT_PUBLIC_REDIRECT_URI=https://hypery-vercel-demo.vercel.app/callback
NEXT_PUBLIC_GATEWAY_API_KEY=ak_…   # optional; NOTE: NEXT_PUBLIC_ ships it to the browser,
                                   # so only use a rate-limited demo key, or drop it and
                                   # rely on the OAuth token.
```

## After deploying

Add the live URLs to the docs — `README.md` (the examples table) and, in the main
app, `apps/web/content/docs/…`. Recommended: a "Live demo →" link per example, e.g.
`https://hypery-auth-demo.vercel.app`.
