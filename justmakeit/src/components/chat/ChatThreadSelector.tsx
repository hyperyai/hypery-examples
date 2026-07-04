/**
 * Chat Thread Selector
 * Switch between multiple independent chat contexts
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import type { ChatThread } from '@/types/workspace';

interface ChatThreadSelectorProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSwitch: (threadId: string) => void;
  onCreate: (name: string) => void;
  onDelete: (threadId: string) => void;
}

export function ChatThreadSelector({
  threads,
  activeThreadId,
  onSwitch,
  onCreate,
  onDelete,
}: ChatThreadSelectorProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCreate = () => {
    if (newThreadName.trim()) {
      onCreate(newThreadName.trim());
      setNewThreadName('');
      setShowNewDialog(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2">
      <div className="flex items-center space-x-2">
        {/* Active Thread Display */}
        <div className="flex-1 flex items-center space-x-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <span className="text-sm text-[var(--text-secondary)] truncate">
            {activeThread?.name || 'No Chat Selected'}
          </span>
          {activeThread && (
            <span className="text-xs text-[var(--text-disabled)]">
              ({activeThread.messages.length} messages)
            </span>
          )}
        </div>

        {/* New Chat Button (Always Visible) */}
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-primary)] rounded ide-transition flex-shrink-0"
          title="Create new chat thread"
        >
          <Plus className="w-3 h-3" />
          <span>New Chat</span>
        </button>

        {/* Thread Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3 py-1.5 text-xs bg-[var(--border-primary)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded ide-transition"
          >
            {threads.length} threads
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50">
            <div className="max-h-64 overflow-y-auto">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`
                    flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-elevated)] cursor-pointer
                    ${thread.id === activeThreadId ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--border-focus)]' : ''}
                  `}
                  onClick={() => {
                    console.log('🖱️ [SELECTOR] Thread clicked:', { threadId: thread.id, threadName: thread.name });
                    onSwitch(thread.id);
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-secondary)] truncate">
                      {thread.name}
                    </div>
                    <div className="text-xs text-[var(--text-disabled)]">
                      {thread.messages.length} messages
                    </div>
                  </div>
                  {threads.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(thread.id);
                      }}
                      className="ml-2 p-1 hover:bg-[var(--btn-danger-hover)]/20 text-[var(--text-disabled)] hover:text-[var(--status-error)] rounded ide-transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create New Button */}
            <div className="border-t border-[var(--border-primary)] p-2">
              <button
                onClick={() => {
                  setShowNewDialog(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-primary)] text-sm rounded ide-transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-secondary)]">New Chat Thread</h3>
              <button
                onClick={() => setShowNewDialog(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={newThreadName}
              onChange={(e) => setNewThreadName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Chat name (e.g., 'Image Generation', 'Code Review')"
              className="w-full px-3 py-2 bg-[var(--border-primary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] rounded focus:outline-none focus:border-[var(--border-focus)]"
              autoFocus
            />

            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleCreate}
                disabled={!newThreadName.trim()}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-elevated)] disabled:cursor-not-allowed text-[var(--text-primary)] rounded ide-transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewDialog(false)}
                className="px-4 py-2 bg-[var(--border-primary)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded ide-transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

