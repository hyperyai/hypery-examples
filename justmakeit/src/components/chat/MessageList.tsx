/**
 * Message List Component
 * Displays all chat messages
 */

'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/workspace';
import type { PluginRegistry } from '@/lib/plugins/registry';
import { Message } from './Message';

interface MessageListProps {
  messages: ChatMessage[];
  pluginRegistry?: PluginRegistry;
}

export function MessageList({ messages, pluginRegistry }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-disabled)]">
        <div className="text-center max-w-md px-4">
          <h3 className="text-lg font-medium mb-2">Welcome to JustMakeIt.AI</h3>
          <p className="text-sm">
            Ask me to create, edit, or read files. I can help you build your project!
          </p>
          <p className="text-xs mt-4 text-[var(--text-tertiary)]">
            Example: "Create a button in index.html that shows an alert"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <Message key={message.id} message={message} pluginRegistry={pluginRegistry} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

