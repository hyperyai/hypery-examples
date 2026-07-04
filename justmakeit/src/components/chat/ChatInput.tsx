/**
 * Chat Input Component
 * Text input for sending messages with mode selection and file attachments
 */

'use client';

import { useState, FormEvent } from 'react';
import { Code2, Image, Zap, X, FileText, FileImage } from 'lucide-react';
import type { FileAttachment } from '@/types/workspace';

export type ChatMode = 'code' | 'image' | 'general';

interface ChatInputProps {
  onSend: (message: string, mode: ChatMode, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  workspaceFiles?: Record<string, string>; // All workspace files for attachment reading
}

export function ChatInput({ onSend, disabled, workspaceFiles = {} }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('general');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input.trim(), mode, attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const filePath = e.dataTransfer.getData('application/x-file-path') || 
                     e.dataTransfer.getData('text/plain');

    if (filePath && workspaceFiles[filePath]) {
      const fileName = filePath.split('/').pop() || filePath;
      const fileContent = workspaceFiles[filePath];
      
      // Determine file type
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
      const isCode = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json'].includes(ext);
      const isText = ['txt', 'md'].includes(ext);
      
      let fileType: 'text' | 'image' | 'code' | 'binary' = 'binary';
      let dataUrl: string | undefined;
      let content: string | undefined;
      
      if (isImage) {
        fileType = 'image';
        // Check if content is already a data URL
        if (fileContent.startsWith('data:')) {
          dataUrl = fileContent;
        } else {
          // Assume it's base64 without prefix
          dataUrl = `data:image/${ext};base64,${fileContent}`;
        }
      } else if (isCode) {
        fileType = 'code';
        content = fileContent;
      } else if (isText) {
        fileType = 'text';
        content = fileContent;
      } else {
        // Try to treat as text
        fileType = 'text';
        content = fileContent;
      }

      const attachment: FileAttachment = {
        path: filePath,
        name: fileName,
        type: fileType,
        content,
        dataUrl,
        size: fileContent.length,
      };

      // Don't add duplicates
      if (!attachments.some(a => a.path === filePath)) {
        setAttachments([...attachments, attachment]);
      }
    }
  };

  const removeAttachment = (path: string) => {
    setAttachments(attachments.filter(a => a.path !== path));
  };

  const modes = [
    { 
      id: 'general' as ChatMode, 
      icon: Zap, 
      label: 'General',
      color: 'text-[#C586C0] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]',
      activeColor: 'bg-[#C586C0] text-[var(--text-primary)] border-[#C586C0]'
    },
    { 
      id: 'code' as ChatMode, 
      icon: Code2, 
      label: 'Code',
      color: 'text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]',
      activeColor: 'bg-[var(--accent-primary)] text-[var(--text-primary)] border-[var(--accent-primary)]'
    },
    { 
      id: 'image' as ChatMode, 
      icon: Image, 
      label: 'Image',
      color: 'text-[var(--accent-success)] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]',
      activeColor: 'bg-[var(--accent-success)] text-[var(--text-primary)] border-[var(--accent-success)]'
    },
  ];

  const currentMode = modes.find(m => m.id === mode);
  const placeholder = mode === 'code' 
    ? 'Ask me to create, edit, or read files...'
    : mode === 'image'
    ? 'Describe an image to generate...'
    : 'Ask me anything...';

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      {/* Mode Selector */}
      <div className="px-4 pt-3 pb-2 border-b border-[var(--border-primary)]">
        <div className="flex space-x-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                disabled={disabled}
                className={`
                  flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-medium
                  transition-all duration-200
                  ${isActive ? m.activeColor : m.color}
                  hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-[var(--border-primary)]">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.path}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)] text-sm"
              >
                {attachment.type === 'image' ? (
                  <FileImage className="w-4 h-4 text-[var(--accent-success)]" />
                ) : (
                  <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                )}
                <span className="text-[var(--text-secondary)] truncate max-w-[150px]">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.path)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area with Drop Zone */}
      <div
        className={`p-4 transition-colors ${
          isDragOver ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent-primary)]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-[var(--accent-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Drop file to attach
            </div>
          </div>
        )}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || (!input.trim() && attachments.length === 0)}
            className={`
              px-6 py-2 rounded-lg font-medium ide-transition
              ${currentMode?.activeColor || 'bg-[var(--accent-primary)] text-[var(--text-primary)]'}
              hover:opacity-90 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed
            `}
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}

