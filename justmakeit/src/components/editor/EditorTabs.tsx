/**
 * Editor Tabs Component
 * VS Code-style tabs for open files
 */

'use client';

import { X } from 'lucide-react';
import type { EditorTab } from '@/types/workspace';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export function EditorTabs({ tabs, activeTab, onSelectTab, onCloseTab }: EditorTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`
            group flex items-center gap-2 px-3 py-2 border-r border-[var(--border-primary)]
            cursor-pointer select-none ide-transition min-w-0
            ${activeTab === tab.path
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
            }
          `}
          onClick={() => onSelectTab(tab.path)}
        >
          {/* File Icon */}
          <span className="text-sm flex-shrink-0">
            {getFileIcon(tab.title)}
          </span>
          
          {/* File Name */}
          <span className={`text-sm truncate ${tab.isDirty ? 'italic' : ''}`}>
            {tab.title}
          </span>
          
          {/* Dirty Indicator or Close Button */}
          {tab.isDirty ? (
            <span className="w-4 h-4 flex items-center justify-center text-xs flex-shrink-0">
              ●
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.path);
              }}
              className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] rounded ide-transition flex-shrink-0"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts':
    case 'tsx':
      return '📘';
    case 'js':
    case 'jsx':
      return '📜';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    case 'css':
      return '🎨';
    case 'html':
      return '🌐';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return '🖼️';
    default:
      return '📄';
  }
}

