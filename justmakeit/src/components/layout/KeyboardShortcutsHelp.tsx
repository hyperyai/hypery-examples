/**
 * Keyboard Shortcuts Help Overlay
 */

'use client';

import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: `${mod}+B`, description: 'Toggle Sidebar' },
    { keys: `${mod}+J`, description: 'Toggle Chat Panel' },
    { keys: `${mod}+S`, description: 'Save File (auto-saves)' },
    { keys: `${mod}+W`, description: 'Close Current Tab' },
    { keys: `${mod}+P`, description: 'Command Palette (coming soon)' },
    { keys: `${mod}+N`, description: 'New File (coming soon)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ide-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-tertiary)] ide-transition"
            >
              <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-xs font-mono text-[var(--text-tertiary)]">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-primary)] text-xs text-[var(--text-disabled)]">
          Press <kbd className="px-1 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded">?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}

