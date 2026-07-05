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
  useDroppable,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, PanelBottom } from 'lucide-react';
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
// Where the chat panel is docked: inline with the other panels ('row', so it
// can sit on either side via horizontal reorder) or pulled out into a
// full-width panel below the editor ('bottom').
type ChatDock = 'row' | 'bottom';

const DOCK_BOTTOM_ID = 'dock-zone-bottom';
const DOCK_ROW_ID = 'dock-zone-row';

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

const PANEL_BY_ID: Record<PanelId, PanelConfig> = DEFAULT_PANELS.reduce(
  (acc, p) => { acc[p.id] = p; return acc; },
  {} as Record<PanelId, PanelConfig>,
);

interface PanelSize {
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

// react-resizable-panels warns unless the panels in a group have default sizes
// summing to 100. Since the chat panel can leave the row (docking to bottom),
// scale whatever panels remain so they always sum to 100.
function normalizeRowSizes(panels: PanelConfig[]): Record<string, PanelSize> {
  const total = panels.reduce((sum, p) => sum + p.defaultSize, 0) || 1;
  const result: Record<string, PanelSize> = {};
  for (const p of panels) {
    const defaultSize = (p.defaultSize / total) * 100;
    result[p.id] = {
      defaultSize,
      minSize: p.minSize,
      maxSize: Math.max(p.maxSize, Math.ceil(defaultSize)),
    };
  }
  return result;
}

interface DraggablePanelProps {
  panel: PanelConfig;
  size: PanelSize;
  children: React.ReactNode;
}

/** A panel in the horizontal row — draggable (to reorder / dock) and resizable. */
function DraggablePanel({ panel, size, children }: DraggablePanelProps) {
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
      order={DEFAULT_PANELS.findIndex((p) => p.id === panel.id)}
      defaultSize={size.defaultSize}
      minSize={size.minSize}
      maxSize={size.maxSize}
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

/** The chat panel when docked to the bottom — draggable header (to re-dock to a side). */
function BottomChatPanel({ children }: { children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: 'chat' });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="h-full flex flex-col bg-[var(--bg-primary)] border-t border-[var(--border-primary)]"
    >
      <div
        className="ide-panel-header flex items-center justify-between cursor-move"
        {...attributes}
        {...listeners}
      >
        <span>🤖 AI Chat</span>
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * Drop target highlighted while dragging the chat panel. `position` controls
 * which slice of the region it covers so it doesn't swallow every drop:
 *  - 'bottom' → a strip along the bottom (dock the chat below the editor)
 *  - 'full'   → the whole region (re-dock a bottom chat back into the row)
 */
function DockZone({
  id,
  active,
  label,
  position,
}: {
  id: string;
  active: boolean;
  label: string;
  position: 'bottom' | 'full';
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  if (!active) return null;
  const place = position === 'bottom' ? 'absolute inset-x-0 bottom-0 h-1/3' : 'absolute inset-0';
  return (
    <div
      ref={setNodeRef}
      className={`${place} z-30 flex items-center justify-center pointer-events-auto ide-transition border-2 border-dashed rounded m-2 ${
        isOver
          ? 'bg-[var(--border-focus)]/25 border-[var(--border-focus)]'
          : 'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded shadow-lg">
        <PanelBottom className="w-4 h-4" />
        {label}
      </span>
    </div>
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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ide-panel-order-${workspace.id}`);
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return ['chat', 'editor', 'files'];
  });
  const [chatDock, setChatDock] = useState<ChatDock>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ide-chat-dock-${workspace.id}`);
      if (saved === 'bottom' || saved === 'row') return saved;
    }
    return 'row';
  });
  const [activeId, setActiveId] = useState<PanelId | null>(null);

  useEffect(() => {
    // Enable drag-and-drop after the first paint so react-resizable-panels can
    // measure real dimensions. requestAnimationFrame is paused in a background
    // tab, so a short timeout guarantees the interactive layout still mounts.
    const raf = requestAnimationFrame(() => setIsMounted(true));
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  // Reload persisted layout when switching workspaces.
  useEffect(() => {
    const savedOrder = localStorage.getItem(`ide-panel-order-${workspace.id}`);
    if (savedOrder) {
      try { setPanelOrder(JSON.parse(savedOrder)); } catch { setPanelOrder(['chat', 'editor', 'files']); }
    } else {
      setPanelOrder(['chat', 'editor', 'files']);
    }
    const savedDock = localStorage.getItem(`ide-chat-dock-${workspace.id}`);
    setChatDock(savedDock === 'bottom' ? 'bottom' : 'row');
  }, [workspace.id]);

  useEffect(() => {
    localStorage.setItem(`ide-panel-order-${workspace.id}`, JSON.stringify(panelOrder));
  }, [panelOrder, workspace.id]);

  useEffect(() => {
    localStorage.setItem(`ide-chat-dock-${workspace.id}`, chatDock);
  }, [chatDock, workspace.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Prioritise the dock drop-zones (large overlays) when the pointer is inside
  // one; otherwise fall back to closest-center so horizontal reordering works.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerHits = pointerWithin(args);
    const dockHit = pointerHits.find(
      (c) => c.id === DOCK_BOTTOM_ID || c.id === DOCK_ROW_ID,
    );
    if (dockHit) return [dockHit];
    return closestCenter(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as PanelId);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    if (over.id === DOCK_BOTTOM_ID) {
      if (active.id === 'chat') setChatDock('bottom');
      return;
    }
    if (over.id === DOCK_ROW_ID) {
      if (active.id === 'chat') setChatDock('row');
      return;
    }

    if (active.id !== over.id) {
      setPanelOrder((items) => {
        const oldIndex = items.indexOf(active.id as PanelId);
        const newIndex = items.indexOf(over.id as PanelId);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  // Panels shown in the horizontal row (chat is excluded when docked bottom).
  const rowPanels = useMemo(() => {
    return panelOrder
      .filter((id) => (chatDock === 'bottom' ? id !== 'chat' : true))
      .map((id) => PANEL_BY_ID[id])
      .filter((p): p is PanelConfig => p !== undefined);
  }, [panelOrder, chatDock]);

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
    workspace, files, fileList, tabs, activeTab,
    onSelectTab, onCloseTab, onSelectFile, onFileChange, onRenameFile, onDeleteFile,
    onAddToChat, onNewFile, onNewFolder, onCreateThread, onSwitchThread, onDeleteThread,
    onUpdateThread, onFileUpdate, onFileDelete, cacheStatus,
  ]);

  const rowGroup = (interactive: boolean) => {
    const sizes = normalizeRowSizes(rowPanels);
    return (
    <PanelGroup
      key={`row-${chatDock}-${rowPanels.map((p) => p.id).join('-')}`}
      direction="horizontal"
      autoSaveId={`ide-panel-sizes-${workspace.id}-${chatDock}-${rowPanels.map((p) => p.id).join('-')}`}
    >
      {rowPanels.map((panel, index) => (
        <React.Fragment key={panel.id}>
          {interactive ? (
            <DraggablePanel panel={panel} size={sizes[panel.id]}>{renderPanelContent(panel.id)}</DraggablePanel>
          ) : (
            <Panel
              id={panel.id}
              order={DEFAULT_PANELS.findIndex((p) => p.id === panel.id)}
              defaultSize={sizes[panel.id].defaultSize}
              minSize={sizes[panel.id].minSize}
              maxSize={sizes[panel.id].maxSize}
            >
              <div className="h-full flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)]">
                <div className="ide-panel-header flex items-center justify-between">
                  <span>{panel.icon} {panel.title}</span>
                  <GripVertical className="w-4 h-4 opacity-50" />
                </div>
                <div className="flex-1 overflow-hidden">{renderPanelContent(panel.id)}</div>
              </div>
            </Panel>
          )}
          {index < rowPanels.length - 1 && (
            <PanelResizeHandle className="w-1 bg-[var(--border-primary)] hover:bg-[var(--border-focus)] ide-transition" />
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
    );
  };

  // The main content region (right of the ActivityBar). When chat is docked to
  // the bottom the region becomes a vertical split: editor/files on top, chat
  // below. The dock drop-zones overlay this region while the chat is dragged.
  const mainRegion = (interactive: boolean) => {
    const draggingChat = interactive && activeId === 'chat';
    if (chatDock === 'bottom') {
      return (
        <div className="relative h-full">
          <PanelGroup direction="vertical" autoSaveId={`ide-vsplit-${workspace.id}`}>
            <Panel id="main-top" order={0} defaultSize={65} minSize={30}>
              <div className="relative h-full">
                {rowGroup(interactive)}
                <DockZone id={DOCK_ROW_ID} active={draggingChat} label="Dock to side" position="full" />
              </div>
            </Panel>
            <PanelResizeHandle className="h-1 bg-[var(--border-primary)] hover:bg-[var(--border-focus)] ide-transition" />
            <Panel id="main-chat" order={1} defaultSize={35} minSize={15}>
              {interactive ? (
                <BottomChatPanel>{renderPanelContent('chat')}</BottomChatPanel>
              ) : (
                <div className="h-full flex flex-col bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                  <div className="ide-panel-header flex items-center justify-between">
                    <span>🤖 AI Chat</span>
                    <GripVertical className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="flex-1 overflow-hidden">{renderPanelContent('chat')}</div>
                </div>
              )}
            </Panel>
          </PanelGroup>
        </div>
      );
    }
    return (
      <div className="relative h-full">
        {rowGroup(interactive)}
        <DockZone id={DOCK_BOTTOM_ID} active={draggingChat} label="Dock to bottom" position="bottom" />
      </div>
    );
  };

  // Render without drag-and-drop until mounted to avoid dimension errors, but
  // keep the persisted layout so there's no flash.
  if (!isMounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar activeView="files" onViewChange={() => {}} />
          <div className="flex-1 overflow-hidden">{mainRegion(false)}</div>
        </div>
        {terminalSection}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <ActivityBar activeView="files" onViewChange={() => {}} />
          <div className="flex-1 overflow-hidden">
            <SortableContext items={panelOrder} strategy={horizontalListSortingStrategy}>
              {mainRegion(true)}
            </SortableContext>
          </div>
        </div>
        {terminalSection}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="px-4 py-2 text-xs uppercase text-gray-400 font-semibold bg-[#252526] border border-[#007ACC] rounded shadow-lg flex items-center gap-2">
            <span>{PANEL_BY_ID[activeId]?.icon}</span>
            <span>{PANEL_BY_ID[activeId]?.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

