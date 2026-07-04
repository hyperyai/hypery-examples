/**
 * Activity Bar Component
 * VS Code-style left sidebar with icons
 */

'use client';

import { FileCode, MessageSquare, Settings, FolderOpen } from 'lucide-react';

export type ActivityView = 'files' | 'chat' | 'settings';

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <div className="w-12 bg-[var(--bg-elevated)] border-r border-[var(--border-primary)] flex flex-col items-center py-4 space-y-2">
      {/* Files */}
      <button
        onClick={() => onViewChange('files')}
        className={`
          w-10 h-10 flex items-center justify-center rounded ide-transition
          ${activeView === 'files' 
            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' 
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        title="Explorer (⌘⇧E)"
      >
        <FolderOpen className="w-6 h-6" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={() => onViewChange('settings')}
        className={`
          w-10 h-10 flex items-center justify-center rounded ide-transition
          ${activeView === 'settings' 
            ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' 
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}

