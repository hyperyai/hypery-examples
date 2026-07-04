'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { ActivityBar } from '@/components/layout/ActivityBar';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { FileTree } from '@/components/editor/FileTree';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Chat } from '@/components/chat/Chat';
import type { Workspace, EditorTab, ChatThread } from '@/types/workspace';

interface DraggableLayoutProps {
  workspace: Workspace;
  files: Record<string, string>;
  fileList: string[];
  tabs: EditorTab[];
  activeTab: string | null;
  onSelectTab: (tab: string) => void;
  onCloseTab: (tab: string) => void;
  onSelectFile: (file: string) => void;
  onFileChange: (content: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
  onAddToChat: (path: string) => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onCreateThread: (name: string, description?: string) => any;
  onSwitchThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateThread: (threadId: string, updates: Partial<ChatThread>) => void;
  onFileUpdate: (path: string, content: string) => void;
  onFileDelete: (path: string) => void;
  terminalSection: React.ReactNode;
  cacheStatus: {
    loading: boolean;
    saving: boolean;
    cachedFileCount: number;
    lastSaved?: Date;
  };
}

type PanelId = 'chat' | 'editor' | 'files';

interface PanelConfig {
  id: PanelId;
  title: string;
  icon: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

const DEFAULT_PANELS: PanelConfig[] = [
  { id: 'chat', title: 'AI Chat', icon: '🤖', defaultSize: 25, minSize: 15, maxSize: 40 },
  { id: 'editor', title: 'Editor', icon: '📝', defaultSize: 55, minSize: 30, maxSize: 70 },
  { id: 'files', title: 'Explorer', icon: '📁', defaultSize: 20, minSize: 15, maxSize: 30 },
];

interface DraggablePanelProps {
  panel: PanelConfig;
  children: React.ReactNode;
}

function DraggablePanel({ panel, children }: DraggablePanelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Panel
      id={panel.id}
      defaultSize={panel.defaultSize}
      minSize={panel.minSize}
      maxSize={panel.maxSize}
    >
      <div 
        ref={setNodeRef}
        style={style}
        className="h-full flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)]"
      >
        <div
          className="ide-panel-header flex items-center justify-between cursor-move"
          {...attributes}
          {...listeners}
        >
          <span>{panel.icon} {panel.title}</span>
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </Panel>
  );
}

export function DraggableLayout({
  workspace,
  files,
  fileList,
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onSelectFile,
  onFileChange,
  onRenameFile,
  onDeleteFile,
  onAddToChat,
  onNewFile,
  onNewFolder,
  onCreateThread,
  onSwitchThread,
  onDeleteThread,
  onUpdateThread,
  onFileUpdate,
  onFileDelete,
  terminalSection,
  cacheStatus,
}: DraggableLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [panelOrder, setPanelOrder] = useState<PanelId[]>(() => {
    // Load saved panel order immediately on initialization
    if (typeof window !== 'undefined') {
      const storageKey = `ide-panel-order-${workspace.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return ['chat', 'editor', 'files'];
        }
      }
    }
    return ['chat', 'editor', 'files'];
  });
  const [activeId, setActiveId] = useState<PanelId | null>(null);

  // Mount after a tiny delay to let DOM initialize
  useEffect(() => {
    // Use requestAnimationFrame to mount after browser paint
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  // Update panel order when workspace changes
  useEffect(() => {
    const storageKey = `ide-panel-order-${workspace.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setPanelOrder(JSON.parse(saved));
      } catch {
        setPanelOrder(['chat', 'editor', 'files']);
      }
    } else {
      setPanelOrder(['chat', 'editor', 'files']);
    }
  }, [workspace.id]);

  // Persist panel order to localStorage per workspace
  useEffect(() => {
    const storageKey = `ide-panel-order-${workspace.id}`;
    localStorage.setItem(storageKey, JSON.stringify(panelOrder));
  }, [panelOrder, workspace.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as PanelId);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPanelOrder((items) => {
        const oldIndex = items.indexOf(active.id as PanelId);
        const newIndex = items.indexOf(over.id as PanelId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const orderedPanels = useMemo(() => {
    return panelOrder
      .map(id => DEFAULT_PANELS.find(p => p.id === id))
      .filter((p): p is PanelConfig => p !== undefined);
  }, [panelOrder]);

  const renderPanelContent = useCallback((panelId: PanelId) => {
    switch (panelId) {
      case 'chat':
        return (
          <Chat
            workspace={workspace}
            onCreateThread={onCreateThread}
            onSwitchThread={onSwitchThread}
            onDeleteThread={onDeleteThread}
            onUpdateThread={onUpdateThread}
            onFileUpdate={onFileUpdate}
            onFileDelete={onFileDelete}
          />
        );
      case 'editor':
        return (
          <div className="h-full flex flex-col">
            <EditorTabs
              tabs={tabs}
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              onCloseTab={onCloseTab}
            />
            <div className="flex-1 overflow-hidden">
              {activeTab ? (
                <CodeEditor
                  value={files[activeTab] || ''}
                  onChange={onFileChange}
                  filename={activeTab}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center space-y-2">
                    <p className="text-xl">No file selected</p>
                    <p className="text-sm">Select a file or ask AI to create one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="h-full flex flex-col">
            {/* Cache Status Indicator */}
            {(cacheStatus.loading || cacheStatus.saving || cacheStatus.cachedFileCount > 0) && (
              <div className="px-3 py-2 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                {cacheStatus.loading && (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading cache...</span>
                  </span>
                )}
                {cacheStatus.saving && (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <span>Saving cache...</span>
                  </span>
                )}
                {!cacheStatus.loading && !cacheStatus.saving && cacheStatus.cachedFileCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-green-400">📦</span>
                    <span>{cacheStatus.cachedFileCount} files cached</span>
                    {cacheStatus.lastSaved && (
                      <span className="text-gray-500">
                        • {new Date(cacheStatus.lastSaved).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <FileTree
                files={fileList}
                activeFile={activeTab || ''}
                onSelectFile={onSelectFile}
                onRenameFile={onRenameFile}
                onDeleteFile={onDeleteFile}
                onAddToChat={onAddToChat}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
              />
            </div>
          </div>
        );
    }
  }, [
    workspace,
    files,
    fileList,
    tabs,
    activeTab,
    onSelectTab,
    onCloseTab,
    onSelectFile,
    onFileChange,
    onRenameFile,
    onDeleteFile,
    onAddToChat,
    onNewFile,
    onNewFolder,
    onCreateThread,
    onSwitchThread,
    onDeleteThread,
    onUpdateThread,
    onFileUpdate,
    onFileDelete,
    cacheStatus,
  ]);

  // Don't render drag-and-drop until mounted to avoid dimension errors
  // But render the panels in their saved order immediately to avoid layout flash
  if (!isMounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar activeView="files" onViewChange={() => {}} />
          
          <div className="flex-1 overflow-hidden">
            <PanelGroup 
              key={`panel-group-${panelOrder.join('-')}`}
              direction="horizontal"
              autoSaveId={`ide-panel-sizes-${workspace.id}-${panelOrder.join('-')}`}
            >
              {orderedPanels.map((panel, index) => (
                <React.Fragment key={panel.id}>
                  <Panel
                    id={panel.id}
                    defaultSize={panel.defaultSize}
                    minSize={panel.minSize}
                    maxSize={panel.maxSize}
                  >
                    <div className="h-full flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)]">
                      <div className="ide-panel-header flex items-center justify-between">
                        <span>{panel.icon} {panel.title}</span>
                        <GripVertical className="w-4 h-4 opacity-50" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {renderPanelContent(panel.id)}
                      </div>
                    </div>
                  </Panel>
                  {index < orderedPanels.length - 1 && (
                    <PanelResizeHandle className="w-1 bg-[var(--border-primary)] hover:bg-[var(--border-focus)] ide-transition" />
                  )}
                </React.Fragment>
              ))}
            </PanelGroup>
          </div>
        </div>
        
        {terminalSection}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar activeView="files" onViewChange={() => {}} />
          
          <div className="flex-1 overflow-hidden">
            <SortableContext items={panelOrder} strategy={horizontalListSortingStrategy}>
              <PanelGroup 
                key={`panel-group-${panelOrder.join('-')}`}
                direction="horizontal"
                autoSaveId={`ide-panel-sizes-${workspace.id}-${panelOrder.join('-')}`}
              >
                {orderedPanels.map((panel, index) => (
                  <React.Fragment key={panel.id}>
                    <DraggablePanel panel={panel}>
                      {renderPanelContent(panel.id)}
                    </DraggablePanel>
                    {index < orderedPanels.length - 1 && (
                      <PanelResizeHandle className="w-1 bg-[var(--border-primary)] hover:bg-[var(--border-focus)] ide-transition" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </SortableContext>
          </div>
        </div>
        
        {/* Terminal */}
        {terminalSection}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="px-4 py-2 text-xs uppercase text-gray-400 font-semibold bg-[#252526] border border-[#007ACC] rounded shadow-lg flex items-center gap-2">
            <span>{DEFAULT_PANELS.find(p => p.id === activeId)?.icon}</span>
            <span>{DEFAULT_PANELS.find(p => p.id === activeId)?.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

