/**
 * Chat Message Component
 * Displays a single message with tool calls and images
 */

'use client';

import type { ChatMessage } from '@/types/workspace';
import type { PluginRegistry } from '@/lib/plugins/registry';
import { ToolCallDisplay } from './ToolCallDisplay';
import { ImageDisplay } from './ImageDisplay';
import { UniversalContentViewer } from '@/components/content/UniversalContentViewer';

interface MessageProps {
  message: ChatMessage;
  pluginRegistry?: PluginRegistry;
}

export function Message({ message, pluginRegistry }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`
        flex
        ${isUser ? 'justify-end' : 'justify-start'}
      `}
    >
      <div
        className={`
          max-w-[80%] rounded-lg p-4
          ${isUser 
            ? 'bg-[var(--accent-primary)] text-[var(--text-primary)]' 
            : 'bg-[var(--bg-tertiary)] text-gray-900'
          }
        `}
      >
        {/* File Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.attachments.map((attachment, idx) => (
              <div key={idx} className="rounded border border-gray-300 overflow-hidden">
                {attachment.type === 'image' && attachment.dataUrl ? (
                  <img 
                    src={attachment.dataUrl} 
                    alt={attachment.name}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                ) : attachment.type === 'code' && attachment.content ? (
                  <div className="bg-gray-900 text-gray-100 p-3 text-xs">
                    <div className="text-gray-400 mb-2">{attachment.name}</div>
                    <pre className="whitespace-pre-wrap overflow-x-auto">{attachment.content}</pre>
                  </div>
                ) : attachment.content ? (
                  <div className="bg-gray-50 p-3 text-sm">
                    <div className="text-gray-600 mb-2 text-xs">{attachment.name}</div>
                    <div className="whitespace-pre-wrap text-gray-800">{attachment.content}</div>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-gray-600">
                    📎 {attachment.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}

        {/* Generated Images (Legacy support) */}
        {message.imageIds && message.imageIds.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.imageIds.map((imageId) => (
              <ImageDisplay key={imageId} imageId={imageId} />
            ))}
          </div>
        )}

        {/* Content Views (New plugin-based system) */}
        {message.contentViews && message.contentViews.length > 0 && pluginRegistry && (
          <div className="mt-3 space-y-2">
            {message.contentViews.map((contentView, index) => (
              <UniversalContentViewer
                key={`${contentView.id || index}`}
                contentView={contentView}
                pluginRegistry={pluginRegistry}
              />
            ))}
          </div>
        )}

        {/* Tool Executions */}
        {message.toolResults && message.toolResults.length > 0 && (
          <ToolCallDisplay executions={message.toolResults} />
        )}
      </div>
    </div>
  );
}

