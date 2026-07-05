'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { AuthButton } from '@hyperyai/sdk';

const models = [
  { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
  { name: 'GPT-4o', value: 'openai/gpt-4o' },
  { name: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
  { name: 'Gemini Pro', value: 'google/gemini-pro' },
];

export default function ChatPage() {
  const [model, setModel] = useState(models[0].value);
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status } = useChat();
  
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(
      { text: input },
      {
        body: {
          model,
        },
      }
    );
    setInput('');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Vercel AI SDK Demo</h1>
          <AuthButton />
        </div>
      </header>

      {/* Main Chat */}
      <div className="container mx-auto flex flex-1 flex-col p-4">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium">Model:</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <div
                      key={`${message.id}-${i}`}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{part.text}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border px-4 py-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-500">
          Powered by Vercel AI SDK + Hypery
        </p>
      </div>
    </div>
  );
}

