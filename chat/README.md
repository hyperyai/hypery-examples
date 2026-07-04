# Hypery Chat

A minimal, standalone chat interface for Hypery.

## Features

- 🚀 Lightweight Next.js app
- 💬 Real-time streaming responses
- 📝 Chat history persistence
- 🔑 API key authentication
- 🎨 Clean, minimal UI
- 📱 Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```bash
cp .env.local.example .env.local
```

3. Start development server:
```bash
npm run dev
```

The app will run on http://localhost:3002

## Configuration

Set these environment variables in `.env.local`:

- `NEXT_PUBLIC_API_URL` - Hypery API URL (default: http://localhost:3001/api/v1)
- `NEXT_PUBLIC_APP_NAME` - App name (default: Hypery Chat)

## Architecture

This is a pure frontend client that communicates with the main Hypery API. All data (chat history, messages, etc.) is stored in the main backend.

### API Endpoints Used

- `POST /api/v1/chats` - Create chat
- `GET /api/v1/chats` - List chats
- `GET /api/v1/chats/:id` - Get chat with messages
- `PATCH /api/v1/chats/:id` - Update chat
- `DELETE /api/v1/chats/:id` - Delete chat
- `POST /api/v1/chats/:id/messages` - Save message
- `POST /api/v1/chat/completions` - AI completions
- `GET /api/v1/models` - Available models

## Deployment

Build for production:
```bash
npm run build
npm start
```

The app outputs a standalone build that can be deployed independently.

