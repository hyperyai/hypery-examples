# Imagine - AI Image Generation

A beautiful frontend app for generating images using Replicate's AI models through the Hypery backend.

## Features

- 🎨 Generate images with AI using FLUX, Stable Diffusion, and more
- 🔐 OAuth authentication with Hypery
- 📜 Image generation history
- 🎯 Multiple model selection (FLUX Schnell, FLUX Dev, FLUX Pro, SDXL)
- 💾 Download and delete generated images
- 💳 Credits-based billing through Hypery

## Getting Started

### Prerequisites

1. Hypery backend running on `http://localhost:3001`
2. A registered app in Hypery with OAuth credentials

### Environment Variables

Create `.env.local` in the `/apps/imagine` directory:

```env
NEXT_PUBLIC_CORE_APP_URL=http://localhost:3001
NEXT_PUBLIC_CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback
```

### Installation

```bash
# From the /apps/imagine directory
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3003`

### Setting up OAuth

1. Go to `http://localhost:3001/apps` in the Hypery
2. Create a new app or use an existing one
3. Set the redirect URI to `http://localhost:3003/auth/callback`
4. Copy the Client ID and Client Secret to your `.env.local`

## How It Works

The Imagine app is a lightweight frontend that:

1. Authenticates with Hypery using OAuth 2.0
2. Makes REST API calls to `/api/v1/images/*` endpoints
3. Hypery backend handles:
   - Replicate API integration
   - Credit management
   - Image storage and history
   - Cost calculation

## Tech Stack

- **Next.js 15** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **OAuth 2.0** - Authentication with Hypery

## API Endpoints Used

- `POST /api/v1/images/generate` - Generate a new image
- `GET /api/v1/images` - Get image history
- `GET /api/v1/images/models` - Get available models
- `DELETE /api/v1/images?id={id}` - Delete an image

## Models Available

- **FLUX Schnell** - Fast, high-quality (recommended)
- **FLUX Dev** - Better quality, slower
- **FLUX Pro** - Best quality, professional
- **Stable Diffusion XL** - High-resolution
- **Stable Diffusion** - Classic model
