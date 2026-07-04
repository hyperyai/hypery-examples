/**
 * Keyboard shortcuts hook for IDE
 */

'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onToggleSidebar?: () => void;
  onToggleBottomPanel?: () => void;
  onSave?: () => void;
  onNewFile?: () => void;
  onCloseTab?: () => void;
  onCommandPalette?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // ⌘/Ctrl + B: Toggle Sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault();
        options.onToggleSidebar?.();
      }

      // ⌘/Ctrl + J: Toggle Bottom Panel
      if (modifier && e.key === 'j') {
        e.preventDefault();
        options.onToggleBottomPanel?.();
      }

      // ⌘/Ctrl + S: Save
      if (modifier && e.key === 's') {
        e.preventDefault();
        options.onSave?.();
      }

      // ⌘/Ctrl + N: New File
      if (modifier && e.key === 'n') {
        e.preventDefault();
        options.onNewFile?.();
      }

      // ⌘/Ctrl + W: Close Tab
      if (modifier && e.key === 'w') {
        e.preventDefault();
        options.onCloseTab?.();
      }

      // ⌘/Ctrl + P: Command Palette
      if (modifier && e.key === 'p') {
        e.preventDefault();
        options.onCommandPalette?.();
      }

      // ⌘/Ctrl + Shift + P: Command Palette (alternative)
      if (modifier && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        options.onCommandPalette?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}

