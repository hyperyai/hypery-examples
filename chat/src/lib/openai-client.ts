import OpenAI from 'openai';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function createClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: API_URL,
    dangerouslyAllowBrowser: true,
  });
}

export async function fetchChats(apiKey: string) {
  const res = await fetch(`${API_URL}/chats`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function fetchChat(apiKey: string, chatId: string) {
  const res = await fetch(`${API_URL}/chats/${chatId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json();
}

export async function createChat(apiKey: string, title?: string, model?: string) {
  const res = await fetch(`${API_URL}/chats`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, model }),
  });
  
  if (!res.ok) throw new Error('Failed to create chat');
  return res.json();
}

export async function updateChat(apiKey: string, chatId: string, updates: { title?: string }) {
  const res = await fetch(`${API_URL}/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) throw new Error('Failed to update chat');
  return res.json();
}

export async function deleteChat(apiKey: string, chatId: string) {
  const res = await fetch(`${API_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!res.ok) throw new Error('Failed to delete chat');
  return res.json();
}

export async function saveMessage(
  apiKey: string,
  chatId: string,
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    reasoning?: string;
    metadata?: any;
  }
) {
  const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  
  if (!res.ok) throw new Error('Failed to save message');
  return res.json();
}

export async function fetchModels(apiKey: string) {
  // Filter for chat models only (not image models)
  const res = await fetch(`${API_URL}/models?type=chat`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

