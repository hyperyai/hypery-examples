/**
 * Workspace Selector Component
 * Dropdown for switching between workspaces
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Workspace } from '@/types/workspace';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => void;
  onNew: () => void;
  onDelete: (workspaceId: string) => void;
  onExport: (workspaceId: string) => void;
  onImport: () => void;
}

export function WorkspaceSelector({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  onNew,
  onDelete,
  onExport,
  onImport,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] rounded text-sm ide-transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="max-w-[150px] truncate">
          {activeWorkspace?.name || 'Select Workspace'}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded shadow-lg z-20 max-h-[500px] overflow-y-auto">
            {/* Workspaces List */}
            <div className="p-2">
              <div className="text-xs text-[var(--text-tertiary)] uppercase font-semibold px-2 py-1">
                Workspaces
              </div>
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={`group flex items-center justify-between px-2 py-2 rounded hover:bg-[var(--bg-tertiary)] ide-transition ${
                    workspace.id === activeWorkspaceId ? 'bg-[var(--bg-tertiary)]' : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      // Use Next.js router for SPA navigation (no page reload)
                      router.push(`/workspace/${workspace.id}`);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm text-[var(--text-secondary)] font-medium">
                      {workspace.name}
                    </div>
                    {workspace.description && (
                      <div className="text-xs text-[var(--text-disabled)] truncate">
                        {workspace.description}
                      </div>
                    )}
                    <div className="text-xs text-[var(--text-disabled)] mt-0.5">
                      {Object.keys(workspace.files).length} files
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(workspace.id);
                      }}
                      className="p-1 hover:bg-[var(--border-primary)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      title="Export"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete workspace "${workspace.name}"?`)) {
                            onDelete(workspace.id);
                          }
                        }}
                        className="p-1 hover:bg-[var(--btn-danger-hover)]/20 rounded text-[var(--text-tertiary)] hover:text-[var(--status-error)]"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--border-primary)] p-2">
              <button
                onClick={() => {
                  onNew();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded ide-transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Workspace
              </button>

              <button
                onClick={() => {
                  onImport();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded ide-transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



