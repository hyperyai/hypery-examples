/**
 * Cursor-Style IDE Layout
 * Chat (left) | Editor (middle) | Files (right) | Terminal (bottom)
 */

'use client';

import { Allotment } from 'allotment';
import dynamic from 'next/dynamic';
import { ActivityBar, type ActivityView } from './ActivityBar';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { FileTree } from '@/components/editor/FileTree';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Chat } from '@/components/chat/Chat';
import { usePanelSizes } from '@/hooks/usePanelSizes';
import { useEditorTabs } from '@/hooks/useEditorTabs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useState } from 'react';
import type { Workspace, ChatThread } from '@/types/workspace';

// Dynamically import Terminal to avoid SSR issues with xterm
const Terminal = dynamic(() => import('@/components/terminal/Terminal').then(mod => ({ default: mod.Terminal })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-tertiary)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-focus)]"></div>
    </div>
  ),
});

interface CursorIDELayoutProps {
  workspace: Workspace;
  files: Record<string, string>;
  fileList: string[];
  onFileUpdate: (path: string, content: string) => void;
  onFileDelete: (path: string) => void;
  onCreateThread: (name: string) => ChatThread | null;
  onSwitchThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateThread: (threadId: string, updates: Partial<ChatThread>) => void;
}

export function CursorIDELayout({
  workspace,
  files,
  fileList,
  onFileUpdate,
  onFileDelete,
  onCreateThread,
  onSwitchThread,
  onDeleteThread,
  onUpdateThread,
}: CursorIDELayoutProps) {
  const { sizes, updateSizes } = usePanelSizes();
  const { tabs, activeTab, openTab, closeTab, setActiveTab, markDirty } = useEditorTabs();
  const [activeView, setActiveView] = useState<ActivityView>('files');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  // Keyboard shortcuts - updated for new layout
  useKeyboardShortcuts({
    onToggleSidebar: () => setChatCollapsed(prev => !prev), // Now toggles chat (left)
    onToggleBottomPanel: () => setTerminalCollapsed(prev => !prev), // Toggles terminal
    onCloseTab: () => {
      if (activeTab) closeTab(activeTab);
    },
    onSave: () => {
      console.log('💾 Files are auto-saved');
    },
  });

  // Handle file selection from tree
  const handleSelectFile = (path: string) => {
    openTab(path);
  };

  // Handle file content change
  const handleFileChange = (content: string) => {
    if (activeTab) {
      onFileUpdate(activeTab, content);
      markDirty(activeTab, true);
    }
  };

  return (
    <div className="h-full flex bg-[var(--bg-primary)]">
      {/* Activity Bar */}
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Layout - Cursor Style */}
      <div className="flex-1 overflow-hidden">
        <Allotment
          defaultSizes={[sizes.chatPanel, 100 - sizes.chatPanel]}
          onChange={(sizes) => {
            if (sizes[0]) {
              updateSizes({ chatPanel: sizes[0] });
            }
          }}
        >
          {/* LEFT: Chat Panel */}
          {!chatCollapsed && (
            <Allotment.Pane minSize={250} maxSize={600} preferredSize={`${sizes.chatPanel}%`}>
              <div className="h-full bg-[var(--bg-primary)] border-r border-[var(--border-primary)] flex flex-col">
                {/* Chat Header */}
                <div className="px-4 py-2 text-xs uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]">
                  <span>🤖 AI Chat</span>
                  <button
                    onClick={() => setChatCollapsed(true)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    title="Hide Chat"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat Component */}
                <div className="flex-1 overflow-hidden">
                  <Chat
                    workspace={workspace}
                    onCreateThread={onCreateThread}
                    onSwitchThread={onSwitchThread}
                    onDeleteThread={onDeleteThread}
                    onUpdateThread={onUpdateThread}
                    onFileUpdate={onFileUpdate}
                    onFileDelete={onFileDelete}
                  />
                </div>
              </div>
            </Allotment.Pane>
          )}

          {/* RIGHT: Editor Area + Files + Terminal */}
          <Allotment.Pane>
            <div className="h-full flex flex-col">
              {/* TOP: Editor + Files */}
              <div className="flex-1 flex min-h-0">
                {/* MIDDLE: Editor */}
                <div className="flex-1 flex flex-col bg-[var(--bg-primary)] min-w-0">
                  {/* Editor Tabs */}
                  <EditorTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    onCloseTab={closeTab}
                  />

                  {/* Editor Content */}
                  <div className="flex-1 overflow-hidden">
                    {activeTab ? (
                      <CodeEditor
                        value={files[activeTab] || ''}
                        onChange={handleFileChange}
                        filename={activeTab}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[var(--text-disabled)]">
                        <div className="text-center space-y-2">
                          <p className="text-xl">No file selected</p>
                          <p className="text-sm">Select a file or ask AI to create one</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Files Panel */}
                {!filesCollapsed && (
                  <div className="w-64 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] overflow-hidden flex flex-col flex-shrink-0">
                    {/* Files Header */}
                    <div className="px-4 py-2 text-xs uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-primary)] flex items-center justify-between">
                      <span>📁 Explorer</span>
                      <button
                        onClick={() => setFilesCollapsed(true)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        title="Hide Files"
                      >
                        ✕
                      </button>
                    </div>

                    {/* File Tree */}
                    <div className="flex-1 overflow-y-auto">
                      <FileTree
                        files={fileList}
                        activeFile={activeTab || ''}
                        onSelectFile={handleSelectFile}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM: Terminal (collapsible with fixed height) */}
              {!terminalCollapsed && (
                <div className="h-80 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex flex-col flex-shrink-0">
                  {/* Terminal Header */}
                  <div className="px-4 py-2 text-xs uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]">
                    <span>⚡ Terminal</span>
                    <button
                      onClick={() => setTerminalCollapsed(true)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      title="Hide Terminal"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Terminal Component */}
                  <div className="flex-1 overflow-hidden">
                    <Terminal />
                  </div>
                </div>
              )}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>

      {/* Restore collapsed panels buttons */}
      {chatCollapsed && (
        <button
          onClick={() => setChatCollapsed(false)}
          className="fixed left-12 top-1/2 -translate-y-1/2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-r z-50"
          title="Show Chat"
        >
          💬
        </button>
      )}

      {filesCollapsed && (
        <button
          onClick={() => setFilesCollapsed(false)}
          className="fixed right-4 top-1/2 -translate-y-1/2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-l z-50"
          title="Show Files"
        >
          📁
        </button>
      )}

      {terminalCollapsed && (
        <button
          onClick={() => setTerminalCollapsed(false)}
          className="fixed bottom-6 right-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-1 rounded text-sm z-50"
          title="Show Terminal"
        >
          Show Terminal ↑
        </button>
      )}
    </div>
  );
}

