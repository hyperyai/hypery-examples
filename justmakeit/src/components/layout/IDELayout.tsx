/**
 * IDE Layout Component
 * VS Code-style resizable panel layout using Allotment
 */

'use client';

import { Allotment } from 'allotment';
import { ActivityBar, type ActivityView } from './ActivityBar';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { FileTree } from '@/components/editor/FileTree';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Chat } from '@/components/chat/Chat';
import { Terminal } from '@/components/terminal/Terminal';
import { usePanelSizes } from '@/hooks/usePanelSizes';
import { useEditorTabs } from '@/hooks/useEditorTabs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useState } from 'react';
import type { Workspace, ChatThread } from '@/types/workspace';

interface IDELayoutProps {
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

export function IDELayout({
  workspace,
  files,
  fileList,
  onFileUpdate,
  onFileDelete,
  onCreateThread,
  onSwitchThread,
  onDeleteThread,
  onUpdateThread,
}: IDELayoutProps) {
  const { sizes, updateSizes } = usePanelSizes();
  const { tabs, activeTab, openTab, closeTab, setActiveTab, markDirty } = useEditorTabs();
  const [activeView, setActiveView] = useState<ActivityView>('files');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: () => setSidebarCollapsed(prev => !prev),
    onToggleBottomPanel: () => setBottomPanelCollapsed(prev => !prev),
    onCloseTab: () => {
      if (activeTab) closeTab(activeTab);
    },
    onSave: () => {
      // Files auto-save, so just show a toast or indicator
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
      markDirty(activeTab, true); // Mark as dirty when changed
    }
  };

  return (
    <div className="h-full flex bg-[var(--bg-primary)]">
      {/* Activity Bar */}
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Layout with Allotment */}
      <div className="flex-1 overflow-hidden">
        <Allotment
          defaultSizes={[sizes.sidebar, 100 - sizes.sidebar]}
          onChange={(sizes) => {
            if (sizes[0]) {
              updateSizes({ sidebar: sizes[0] });
            }
          }}
        >
          {/* Sidebar (File Tree) */}
          {!sidebarCollapsed && (
            <Allotment.Pane minSize={200} maxSize={500} preferredSize={`${sizes.sidebar}%`}>
              <div className="h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] overflow-hidden flex flex-col">
                {/* Sidebar Header */}
                <div className="px-4 py-2 text-xs uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-primary)] flex items-center justify-between">
                  <span>Explorer</span>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    title="Hide Sidebar"
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
            </Allotment.Pane>
          )}

          {/* Editor + Chat Area */}
          <Allotment.Pane>
            <Allotment
              vertical
              defaultSizes={[100 - sizes.bottomPanel, sizes.bottomPanel]}
              onChange={(sizes) => {
                if (sizes[1]) {
                  updateSizes({ bottomPanel: sizes[1] });
                }
              }}
            >
              {/* Editor Area */}
              <Allotment.Pane minSize={200}>
                <div className="h-full flex flex-col bg-[var(--bg-primary)]">
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
                          <p className="text-sm">Select a file from the sidebar or ask the AI to create one</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Allotment.Pane>

              {/* Chat Panel */}
              {!bottomPanelCollapsed && (
                <Allotment.Pane minSize={150} maxSize={600} preferredSize={`${sizes.bottomPanel}%`}>
                  <div className="h-full bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex flex-col">
                    {/* Panel Header */}
                    <div className="px-4 py-2 text-xs uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]">
                      <span>AI Chat Control Center</span>
                      <button
                        onClick={() => setBottomPanelCollapsed(true)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        title="Hide Panel"
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
            </Allotment>
          </Allotment.Pane>
        </Allotment>
      </div>

      {/* Restore collapsed panels buttons */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-12 top-1/2 -translate-y-1/2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-r"
          title="Show Sidebar"
        >
          →
        </button>
      )}
      
      {bottomPanelCollapsed && (
        <button
          onClick={() => setBottomPanelCollapsed(false)}
          className="fixed bottom-6 right-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-1 rounded text-sm"
          title="Show Chat Panel"
        >
          Show AI Chat ↑
        </button>
      )}
    </div>
  );
}

