import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Configure OpenAI provider to use Hypery Hub
const aiGateway = createOpenAI({
  apiKey: process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '',
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const result = streamText({
    model: aiGateway(model),
    messages,
    system: 'You are a helpful AI assistant. Be concise and friendly.',
  });

  return result.toTextStreamResponse();
}

