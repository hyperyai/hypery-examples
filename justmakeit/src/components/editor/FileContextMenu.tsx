/**
 * File Context Menu Component
 * Right-click menu for files and folders
 */

'use client';

import { useEffect, useRef } from 'react';
import { 
  Copy, 
  Trash2, 
  Edit3, 
  MessageSquarePlus,
  FilePlus,
  FolderPlus,
} from 'lucide-react';

interface FileContextMenuProps {
  x: number;
  y: number;
  filePath: string | null; // null for empty space
  isFolder: boolean;
  onClose: () => void;
  onRename?: (path: string) => void;
  onDelete?: (path: string) => void;
  onCopyPath?: (path: string) => void;
  onAddToChat?: (path: string) => void;
  onNewFile?: (parentPath: string) => void;
  onNewFolder?: (parentPath: string) => void;
}

export function FileContextMenu({
  x,
  y,
  filePath,
  isFolder,
  onClose,
  onRename,
  onDelete,
  onCopyPath,
  onAddToChat,
  onNewFile,
  onNewFolder,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const parentPath = filePath || '';
  const isEmptySpace = filePath === null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--bg-secondary)] border border-[#454545] rounded-md shadow-xl min-w-[220px] py-1"
      style={{ left: x, top: y }}
    >
      {/* New File/Folder options for folders or empty space */}
      {(isFolder || isEmptySpace) && (
        <>
          {onNewFile && (
            <button
              onClick={() => handleAction(() => onNewFile(parentPath))}
              className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
            >
              <FilePlus className="w-4 h-4" />
              <span>New File</span>
            </button>
          )}
          {onNewFolder && (
            <button
              onClick={() => handleAction(() => onNewFolder(parentPath))}
              className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          )}
          <div className="border-t border-[#454545] my-1" />
        </>
      )}

      {/* File-specific options */}
      {!isFolder && !isEmptySpace && filePath && (
        <>
          {onAddToChat && (
            <button
              onClick={() => handleAction(() => onAddToChat(filePath))}
              className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Add File to Chat</span>
            </button>
          )}
        </>
      )}

      {/* Copy path (not for empty space) */}
      {!isEmptySpace && filePath && onCopyPath && (
        <button
          onClick={() => handleAction(() => onCopyPath(filePath))}
          className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
        >
          <Copy className="w-4 h-4" />
          <span>Copy Path</span>
        </button>
      )}

      {/* Rename and Delete (not for empty space) */}
      {!isEmptySpace && filePath && (
        <>
          <div className="border-t border-[#454545] my-1" />

          {onRename && (
            <button
              onClick={() => handleAction(() => onRename(filePath))}
              className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename...</span>
            </button>
          )}

          <div className="border-t border-[#454545] my-1" />

          {onDelete && (
            <button
              onClick={() => handleAction(() => onDelete(filePath))}
              className="w-full px-3 py-2 text-sm text-[var(--status-error)] hover:bg-[#2A2D2E] flex items-center space-x-3 text-left"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

