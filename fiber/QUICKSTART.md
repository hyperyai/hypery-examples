# Quick Start Guide - 3D Model Generator

Get up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd fiber
npm install
```

**✨ Latest Tech:** Uses React 19, React Three Fiber v9, and Tailwind CSS v4!

## Step 2: Set Up Environment

Create `.env.local` file:

```bash
cp ENV.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3006/callback
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
```

**Getting OAuth Credentials:**
- Go to Hypery Hub dashboard
- Create/select an app
- Copy Client ID
- Set redirect URI to `http://localhost:3006/callback`

## Step 3: Run Development Server

```bash
npm run dev
```

## Step 4: Open in Browser

Visit: [http://localhost:3006](http://localhost:3006)

## Step 5: Sign In and Start Creating!

1. Click "Sign In"
2. Authorize the app
3. Start chatting to create 3D models

## Example Prompts

- "Make a girl on a pony"
- "Add a red sphere"
- "Make the pony purple"
- "Add a blue cone"
- "Clear everything"

## Troubleshooting

**Can't sign in?**
- Check your OAuth credentials in `.env.local`
- Make sure redirect URI matches exactly

**3D scene blank?**
- Check browser console for errors
- Ensure WebGL is enabled
- Try Chrome or Firefox

**Chat not responding?**
- Verify Hypery URL
- Check you have credits in your account
- Ensure OpenRouter is enabled

## Next Steps

- Read the full [README.md](./README.md)
- Customize the system prompt in `app/api/chat/route.ts`
- Add more shapes in `src/components/Scene.tsx`
- Integrate real 3D model generation APIs

Enjoy creating! 🎨✨

