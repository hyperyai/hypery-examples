# 3D Model Generator with React Three Fiber

A low-poly retro 3D model generator powered by AI chat interface. Create and modify 3D models using natural language through OpenRouter's best LLMs.

## Features

- 🎨 **Chat-based 3D Generation** - Describe what you want and watch it appear
- 🔐 **Secure OAuth Authentication** - Using @hypery/auth
- 🌐 **OpenRouter Integration** - Access to Claude 3.5 Sonnet and other top LLMs
- 🎮 **Interactive 3D Scene** - Built with React Three Fiber and drei
- 💅 **Modern UI** - Vercel AI SDK components and Tailwind CSS
- 🚀 **Next.js 16** - Latest Next.js with App Router

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **3D Graphics**: React Three Fiber v9, Three.js, @react-three/drei
- **AI/Chat**: Vercel AI SDK, OpenRouter
- **Auth**: @hypery/auth (OAuth 2.0 + PKCE)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **LLM**: Claude 3.5 Sonnet (via OpenRouter)

> **✨ Latest Versions:** Using React 19.2.0, React Three Fiber 9.4.0, and Tailwind CSS 4.1.17!

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- An Hypery Hub account with OAuth app configured
- OpenRouter access through Hypery

### Installation

1. **Install dependencies:**

```bash
npm install
# or
pnpm install
# or
yarn install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your OAuth credentials:

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3006/callback
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
```

**How to get OAuth credentials:**
1. Go to your Hypery Hub dashboard
2. Navigate to Apps section
3. Create a new app or select existing one
4. Copy the Client ID
5. Set redirect URI to `http://localhost:3006/callback`

3. **Run the development server:**

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. **Open your browser:**

Navigate to [http://localhost:3006](http://localhost:3006)

## Usage

### Example Prompts

Try these prompts to get started:

- **"Make a girl on a pony"** - Creates a simple representation with shapes
- **"Add a red sphere"** - Adds a red sphere to the scene
- **"Make the pony purple"** - Changes the color of the last object
- **"Add a blue cone"** - Adds a cone with specified color
- **"Remove the last object"** - Removes the most recent shape
- **"Clear everything"** - Resets the scene

### Available Shapes

- Box/Cube
- Sphere/Ball
- Cone
- Torus/Donut
- Cylinder

### Available Colors

red, blue, green, yellow, purple, orange, pink, cyan, magenta, white, black, gray

### 3D Controls

- **Left-click + drag**: Rotate camera
- **Right-click + drag**: Pan camera
- **Scroll wheel**: Zoom in/out

## Architecture

### Component Structure

```
fiber/
├── app/
│   ├── api/chat/route.ts      # Chat API with OpenRouter
│   ├── callback/page.tsx      # OAuth callback handler
│   ├── layout.tsx             # Root layout with HyperyProvider
│   ├── page.tsx               # Main app page
│   └── globals.css            # Global styles
├── src/
│   ├── components/
│   │   ├── Scene.tsx          # React Three Fiber 3D scene
│   │   └── ChatInterface.tsx  # Chat UI component
│   └── lib/
│       └── utils.ts           # Utility functions
└── package.json
```

### Authentication Flow

1. User clicks "Sign In"
2. Redirected to Hypery OAuth page
3. User authorizes the app
4. Redirected back to `/callback`
5. Auth tokens stored in localStorage
6. Ready to chat and create!

### Chat to 3D Pipeline

1. User types a prompt in chat
2. Request sent to `/api/chat/route.ts` with Hypery auth
3. OpenRouter (Claude 3.5 Sonnet) generates response
4. Response streamed back to client
5. `handleModelUpdate` parses the instruction
6. Scene updates with new/modified 3D models

## Customization

### Change the LLM Model

Edit `ChatInterface.tsx` to use a different model:

```typescript
sendMessage({ text: input }, {
  body: {
    model: 'openai/gpt-4o', // or any OpenRouter model
  },
});
```

### Add More Shapes

Edit `Scene.tsx` to add new geometry types:

```typescript
{geometry === 'pyramid' && <tetrahedronGeometry args={[0.6]} />}
```

### Modify Scene Lighting

Adjust lighting in `Scene.tsx`:

```typescript
<ambientLight intensity={0.6} />
<directionalLight position={[10, 10, 10]} intensity={1.5} />
```

## Advanced Usage

### Using Real 3D Model Generation

For production, integrate with actual 3D model generation APIs:

1. Use Replicate's 3D models (via Hypery predictions API)
2. Models like `gfodor/text2vox` for voxel models
3. Or `meshy/meshy-1` for mesh generation

Example:

```typescript
// In your API route
const response = await fetch(`${AI_GATEWAY_URL}/api/v1/predictions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gfodor/text2vox',
    provider: 'replicate',
    input: { prompt: userPrompt },
  }),
});
```

### MCP Integration (Future Enhancement)

To enable MCP-like tool calling (similar to justmakeit):

1. Add `@hypery/agents` package
2. Implement tool handlers for 3D operations
3. Register tools with the chat endpoint
4. Use structured outputs for precise model updates

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Update redirect URI to your production URL
5. Deploy!

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- Cloudflare Pages
- Self-hosted with Node.js

## Troubleshooting

### "Authentication Required" error

- Make sure you've set up `.env.local` with valid OAuth credentials
- Check that your redirect URI matches in both `.env.local` and your OAuth app settings

### 3D scene not rendering

- Check browser console for Three.js errors
- Make sure WebGL is enabled in your browser
- Try a different browser (Chrome/Firefox recommended)

### Chat not responding

- Verify your Hypery URL is correct
- Check that you have credits in your Hypery account
- Make sure OpenRouter models are enabled in your account

## Contributing

This example lives in the hypery-examples repo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Learn More

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Hypery Hub Docs](https://docs.hypery.com)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Next.js Docs](https://nextjs.org/docs)

## Support

For issues or questions:
- GitHub Issues: [hypery/issues](https://github.com/hypery/hypery/issues)
- Discord: [Hypery Community](https://discord.gg/hypery)
- Email: support@hypery.com

---

Built with ❤️ using React Three Fiber and Hypery Hub

