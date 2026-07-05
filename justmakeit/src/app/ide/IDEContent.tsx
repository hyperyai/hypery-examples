/**
 * IDE Content - Client Only Component
 * This component uses browser-only APIs and should never be SSR'd
 */

'use client';

import { useState, useCallback, useMemo, useEffect, memo, useRef } from 'react';
import { useUser, UserButton } from '@hypery/sdk';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { DraggableLayout } from './DraggableLayout';
import { Terminal } from '@/components/terminal/Terminal';
import { useEditorTabs } from '@/hooks/useEditorTabs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { syncFile } from '@/lib/terminal/webcontainer';

// Separate Terminal section that NEVER re-renders unless workspace ID changes
const TerminalSection = memo(function TerminalSection({ 
  workspaceId, 
  files,
  onFileUpdate,
  onFileDelete,
  onCacheStatusChange,
}: { 
  workspaceId: string; 
  files: Record<string, string>;
  onFileUpdate: (path: string, content: string) => void;
  onFileDelete: (path: string) => void;
  onCacheStatusChange: (status: { loading?: boolean; saving?: boolean; cachedFileCount?: number; lastSaved?: Date }) => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ide-terminal-collapsed-${workspaceId}`);
      return saved === 'true';
    }
    return false;
  });

  // Use ref to always have latest files without triggering re-mount
  const filesRef = useRef(files);
  filesRef.current = files;

  // Update collapsed state when workspace changes
  useEffect(() => {
    const saved = localStorage.getItem(`ide-terminal-collapsed-${workspaceId}`);
    setCollapsed(saved === 'true');
  }, [workspaceId]);

  // Auto-save cache when files change (debounced) + initial save
  useEffect(() => {
    console.log('🔄 [AUTO-SAVE] Effect mounted for workspace:', workspaceId);
    let saveTimeout: NodeJS.Timeout | null = null;

    const saveCache = async (force: boolean = false) => {
      try {
        console.log('💾 [AUTO] Auto-save triggered, setting status to saving...');
        onCacheStatusChange({ saving: true });
        console.log('💾 [AUTO] Auto-saving container cache...');
        const { saveNodeModulesToCache } = await import('@/lib/terminal/webcontainer');
        const workspaceFileSet = new Set(Object.keys(filesRef.current));
        console.log('💾 [AUTO] Workspace has', workspaceFileSet.size, 'files');
        const result = await saveNodeModulesToCache(workspaceId, workspaceFileSet);
        console.log('💾 [AUTO] Save result:', result);
        if (result.success) {
          console.log(`✅ [AUTO] Auto-saved ${result.fileCount} files to cache`);
          onCacheStatusChange({ 
            saving: false, 
            cachedFileCount: result.fileCount, 
            lastSaved: new Date() 
          });
        } else {
          // Not an error - just means no node_modules to cache (e.g., text-only workspace)
          console.log('ℹ️ [AUTO] No cache needed:', result.error);
          onCacheStatusChange({ saving: false });
        }
      } catch (error) {
        console.error('❌ [AUTO] Auto-save exception:', error);
        onCacheStatusChange({ saving: false });
      }
    };

    // Trigger save on file changes (debounced by 5 seconds)
    const handleFileChange = () => {
      console.log('📢 [AUTO] File change event received, scheduling save in 5s...');
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveCache(), 5000); // Save 5 seconds after last change
    };

    // Listen to file system events
    window.addEventListener('webcontainer-file-change', handleFileChange as any);
    console.log('👂 [AUTO-SAVE] Listening for webcontainer-file-change events');

    // Initial save 10 seconds after page load to catch npm installs
    console.log('⏰ [AUTO-SAVE] Scheduling initial save in 10 seconds...');
    const initialSave = setTimeout(() => {
      console.log('⏰ [AUTO-SAVE] Initial save timeout fired!');
      saveCache(true);
    }, 10000);

    return () => {
      console.log('🛑 [AUTO-SAVE] Effect cleanup for workspace:', workspaceId);
      if (saveTimeout) clearTimeout(saveTimeout);
      clearTimeout(initialSave);
      window.removeEventListener('webcontainer-file-change', handleFileChange as any);
    };
  }, [workspaceId, onCacheStatusChange]);

  // Persist terminal collapsed state per workspace
  useEffect(() => {
    localStorage.setItem(`ide-terminal-collapsed-${workspaceId}`, String(collapsed));
  }, [collapsed, workspaceId]);
  
  // Mount files and start watching - only when workspace changes
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isCurrentWorkspace = true; // Track if this workspace is still active
    
    const initializeFileSystem = async () => {
      try {
        const { 
          clearContainer,
          mountFiles, 
          watchFileSystem, 
          loadNodeModulesFromCache 
        } = await import('@/lib/terminal/webcontainer');
        
        // STEP 0: Clear WebContainer to ensure clean slate for this workspace
        console.log(`🔄 [INIT] Initializing workspace ${workspaceId}`);
        await clearContainer();
        
        // Check if we're still the active workspace after clear
        if (!isCurrentWorkspace) {
          console.log(`⚠️ [INIT] Workspace ${workspaceId} no longer active, aborting initialization`);
          return;
        }
        
        // STEP 1: Restore cached container files (node_modules, etc)
        try {
          onCacheStatusChange({ loading: true });
          await loadNodeModulesFromCache(workspaceId);
          onCacheStatusChange({ loading: false });
        } catch (error) {
          console.log('ℹ️ No cache to restore');
          onCacheStatusChange({ loading: false });
        }
        
        // Check again before mounting
        if (!isCurrentWorkspace) {
          console.log(`⚠️ [INIT] Workspace ${workspaceId} no longer active, aborting initialization`);
          return;
        }
        
        // STEP 2: Mount workspace files (will overwrite any cached workspace files)
        const currentFiles = filesRef.current;
        await mountFiles(currentFiles);
        console.log(`✅ [INIT] Workspace ready (${Object.keys(currentFiles).length} files)`);
        
        // STEP 3: Wait for filesystem to settle, then start watching
        // This prevents detecting our own initial writes as "changes"
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Final check before starting watcher
        if (!isCurrentWorkspace) {
          console.log(`⚠️ [INIT] Workspace ${workspaceId} no longer active, skipping watcher`);
          return;
        }
        
        cleanup = await watchFileSystem(
          (path, content) => {
            // Double-check we're still the active workspace before updating
            if (!isCurrentWorkspace) {
              console.warn(`⚠️ [WATCH] Ignoring file change for inactive workspace ${workspaceId}:`, path);
              return;
            }
            console.log(`📝 [${workspaceId}] File changed:`, path);
            onFileUpdate(path, content);
            // Trigger cache save (debounced)
            window.dispatchEvent(new CustomEvent('webcontainer-file-change'));
          },
          (path) => {
            // Double-check we're still the active workspace before updating
            if (!isCurrentWorkspace) {
              console.warn(`⚠️ [WATCH] Ignoring file deletion for inactive workspace ${workspaceId}:`, path);
              return;
            }
            console.log(`🗑️ [${workspaceId}] File deleted:`, path);
            onFileDelete(path);
            // Trigger cache save (debounced)
            window.dispatchEvent(new CustomEvent('webcontainer-file-change'));
          }
        );
        console.log(`✅ [INIT] File watcher active for workspace ${workspaceId}`);
      } catch (error) {
        console.error(`❌ [INIT] Failed to initialize workspace ${workspaceId}:`, error);
      }
    };

    initializeFileSystem();
    return () => { 
      console.log(`🧹 [CLEANUP] Marking workspace ${workspaceId} as inactive, stopping watcher`);
      isCurrentWorkspace = false; // Mark this workspace as no longer active
      if (cleanup) cleanup();
    };
  }, [workspaceId, onFileUpdate, onFileDelete]);
  
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="h-8 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm flex items-center justify-center ide-transition"
      >
        Show Terminal ↑
      </button>
    );
  }
  
  const handleSaveCache = async () => {
    try {
      onCacheStatusChange({ saving: true });
      console.log('🔵 [MANUAL] Manual cache save triggered');
      const { saveNodeModulesToCache } = await import('@/lib/terminal/webcontainer');
      const workspaceFileSet = new Set(Object.keys(filesRef.current));
      console.log('🔵 [MANUAL] Workspace files to skip:', workspaceFileSet.size);
      const result = await saveNodeModulesToCache(workspaceId, workspaceFileSet);
      if (result.success) {
        console.log(`✅ [MANUAL] Saved ${result.fileCount} files to cache`);
        onCacheStatusChange({ 
          saving: false, 
          cachedFileCount: result.fileCount, 
          lastSaved: new Date() 
        });
        alert(`✅ Cached ${result.fileCount} files!`);
      } else {
        console.error('❌ [MANUAL] Save failed:', result.error);
        onCacheStatusChange({ saving: false });
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [MANUAL] Save exception:', error);
      onCacheStatusChange({ saving: false });
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear cached container data?\n\nThis will remove cached node_modules, build outputs, etc. for this workspace.\n\nYour workspace files will NOT be affected.')) {
      return;
    }
    
    try {
      const { deleteContainerCache } = await import('@/lib/storage/node-modules-storage');
      await deleteContainerCache(workspaceId);
      alert('✅ Cache cleared!\n\nRefresh the page to start fresh.');
      console.log('✅ Cache cleared for workspace:', workspaceId);
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      alert(`❌ Failed to clear cache:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="h-80 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex flex-col flex-shrink-0">
      <div className="ide-panel-header flex items-center justify-between">
        <span>⚡ Terminal</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCache}
            className="ide-btn ide-btn-primary"
            title="Save cache now (test manual save)"
          >
            💾 Save Cache Now
          </button>
          <button
            onClick={handleClearCache}
            className="ide-btn ide-btn-danger"
            title="Clear cached container data (node_modules, build outputs, etc.)"
          >
            🗑️ Clear Cache
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ide-transition"
            title="Hide Terminal"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Terminal key={workspaceId} />
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.workspaceId === nextProps.workspaceId);

export default function IDEContent({ workspaceId }: { workspaceId?: string } = {}) {
  const { user } = useUser();
  const {
    workspaces,
    activeWorkspace,
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
    exportWorkspace,
    importWorkspace,
    updateWorkspace,
    updateFile,
    deleteFile,
    renameFile,
    loadFiles,
    createChatThread,
    switchChatThread,
    deleteChatThread,
    updateChatThread,
  } = useWorkspaces();
  
  // Switch to workspace from URL when it changes
  useEffect(() => {
    if (workspaceId && workspaces.length > 0 && activeWorkspace?.id !== workspaceId) {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        switchWorkspace(workspaceId);
      }
    }
  }, [workspaceId, workspaces.length, activeWorkspace?.id, switchWorkspace]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { tabs, activeTab, openTab, closeTab, setActiveTab, markDirty, closeAllTabs } = useEditorTabs();
  const [allFilesInContainer, setAllFilesInContainer] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{
    loading: boolean;
    saving: boolean;
    cachedFileCount: number;
    lastSaved?: Date;
  }>({ loading: false, saving: false, cachedFileCount: 0 });

  // Restore tabs when workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    
    console.log(`📂 [TABS] Restoring tabs for workspace: ${activeWorkspace.name}`);
    
    // Store the tabs to restore before closing
    const tabsToRestore = activeWorkspace.openTabs || [];
    const activeTabToRestore = activeWorkspace.activeTabPath;
    
    // Close all current tabs
    closeAllTabs();
    
    // Restore tabs from workspace
    if (tabsToRestore.length > 0) {
      console.log(`  ✅ Restoring ${tabsToRestore.length} tabs`);
      tabsToRestore.forEach(tab => {
        openTab(tab.path);
      });
      
      // Restore active tab
      if (activeTabToRestore) {
        setActiveTab(activeTabToRestore);
      }
    } else {
      console.log(`  ℹ️  No tabs to restore`);
    }
  }, [activeWorkspace?.id, closeAllTabs, openTab, setActiveTab]); // Include all used functions

  // Save tabs to workspace when they change (debounced to avoid infinite loops)
  useEffect(() => {
    if (!activeWorkspace) return;
    
    // Don't save if tabs are being restored (check if it's the initial render)
    const timeoutId = setTimeout(() => {
      console.log(`💾 [TABS] Saving ${tabs.length} tabs to workspace`);
      updateWorkspace({
        openTabs: tabs,
        activeTabPath: activeTab,
      });
    }, 100); // Small delay to avoid race conditions during restoration
    
    return () => clearTimeout(timeoutId);
  }, [tabs, activeTab, activeWorkspace?.id, updateWorkspace]);

  // Memoize files and fileList
  const files = useMemo(() => activeWorkspace?.files || {}, [activeWorkspace?.files]);
  // Use fileManifest for the file list (shows all files, even if content not loaded yet)
  const fileList = useMemo(() => Object.keys(activeWorkspace?.fileManifest || {}), [activeWorkspace?.fileManifest]);
  
  // Merge workspace files with all container files (including node_modules) for display
  const displayFileList = useMemo(() => {
    const workspaceFiles = new Set(fileList);
    const allFiles = new Set([...fileList, ...allFilesInContainer]);
    const result = Array.from(allFiles).sort();
    
    console.log('📋 [DISPLAY] Recalculating displayFileList:');
    console.log('  - Workspace files (fileList):', fileList.length);
    console.log('  - Container files (allFilesInContainer):', allFilesInContainer.length);
    console.log('  - Merged display files:', result.length);
    
    return result;
  }, [fileList, allFilesInContainer]);

  // Listen for preview server ports becoming ready
  useEffect(() => {
    const setupPreviewListener = async () => {
      const { onPortReady } = await import('@/lib/terminal/webcontainer');
      onPortReady((port, url) => {
        console.log(`🌐 [PREVIEW] Port ${port} ready, setting preview URL: ${url}`);
        setPreviewUrl(url);
      });
    };
    
    setupPreviewListener();
    
    // Clear preview URL when workspace changes
    return () => {
      setPreviewUrl(null);
    };
  }, [activeWorkspace?.id]);

  // Periodically scan WebContainer for all files (including node_modules) for display
  useEffect(() => {
    let isActive = true;
    
    // Clear state immediately when workspace changes to avoid showing old workspace files
    console.log(`🔄 [SCAN] Workspace ${activeWorkspace?.id} - clearing allFilesInContainer state`);
    setAllFilesInContainer([]);
    
    const scanFiles = async () => {
      try {
        const { listAllFiles } = await import('@/lib/terminal/webcontainer');
        const allFiles = await listAllFiles();
        if (isActive) {
          console.log(`📊 [SCAN] Found ${allFiles.length} files in WebContainer for workspace ${activeWorkspace?.id}`);
          if (allFiles.length > 0) {
            console.log(`📋 [SCAN] First 10 files:`, allFiles.slice(0, 10));
          }
          setAllFilesInContainer(allFiles);
        }
      } catch (error) {
        console.error('❌ [SCAN] Failed to list WebContainer files:', error);
      }
    };
    
    // Delay initial scan by 500ms to allow container clear/mount to complete
    const initialScanTimeout = setTimeout(() => {
      if (isActive) {
        console.log(`🔍 [SCAN] Starting initial scan for workspace ${activeWorkspace?.id}...`);
        scanFiles();
      }
    }, 500);
    
    // Refresh every 3 seconds to catch npm installs
    const interval = setInterval(scanFiles, 3000);
    
    return () => {
      isActive = false;
      clearTimeout(initialScanTimeout);
      clearInterval(interval);
    };
  }, [activeWorkspace?.id]);

  // Stable callbacks
  const handleUpdateFile = useCallback(async (path: string, content: string) => {
    updateFile(path, content);
    
    // Sync to WebContainer (local dev environment)
    try {
      await syncFile(path, content);
      console.log(`✅ [SYNC] File synced to WebContainer: ${path}`);
    } catch (error) {
      console.error(`❌ [SYNC] Failed to sync to WebContainer: ${path}`, error);
    }
  }, [updateFile]);

  const handleDeleteFile = useCallback(async (path: string) => {
    deleteFile(path);
    
    // Also remove from IndexedDB cache (handles terminal deletions)
    if (activeWorkspace) {
      try {
        const { removeFromCache } = await import('@/lib/storage/node-modules-storage');
        await removeFromCache(activeWorkspace.id, path);
        console.log('✅ File removed from cache:', path);
      } catch (error) {
        // Silently fail - file might not be in cache
        console.log('ℹ️ File not in cache or cache update failed');
      }
    }
  }, [deleteFile, activeWorkspace]);

  const handleCreateThread = useCallback((name: string, description?: string) => {
    return createChatThread(name, description);
  }, [createChatThread]);

  const handleSwitchThread = useCallback((threadId: string) => {
    switchChatThread(threadId);
  }, [switchChatThread]);

  const handleDeleteThread = useCallback((threadId: string) => {
    deleteChatThread(threadId);
  }, [deleteChatThread]);

  const handleUpdateThread = useCallback((threadId: string, updates: any) => {
    updateChatThread(threadId, updates);
  }, [updateChatThread]);

  const handleImportWorkspace = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await importWorkspace(file);
    };
    input.click();
  }, [importWorkspace]);

  const handleSelectFile = useCallback(async (path: string) => {
    openTab(path);
    
    // Lazy load file content if not already loaded
    if (!files[path]) {
      if (path.includes('node_modules')) {
        // Load from WebContainer for node_modules files
        try {
          const { getWebContainer } = await import('@/lib/terminal/webcontainer');
          const container = await getWebContainer();
          const content = await container.fs.readFile(path, 'utf-8');
          handleUpdateFile(path, content);
        } catch (error) {
          console.error('Failed to read file from WebContainer:', error);
        }
      } else {
        // Load from API for workspace files
        await loadFiles([path]);
      }
    }
  }, [openTab, files, handleUpdateFile, loadFiles]);

  const handleRenameFile = useCallback(async (oldPath: string, newPath: string) => {
    console.log('🔄 Renaming file:', { oldPath, newPath });
    renameFile(oldPath, newPath);
    
    // Sync rename to WebContainer
    try {
      const { rm, syncFile: syncWCFile } = await import('@/lib/terminal/webcontainer');
      
      // Get content from active workspace
      const content = activeWorkspace?.files[oldPath];
      if (content) {
        // Write to new path
        await syncWCFile(newPath, content);
        // Delete old path
        await rm(oldPath);
        console.log('✅ File renamed in WebContainer:', { oldPath, newPath });
      }
    } catch (error) {
      console.error('❌ Failed to rename file in WebContainer:', error);
    }
    
    // Update active tab if renaming the active file
    if (activeTab === oldPath) {
      closeTab(oldPath);
      openTab(newPath);
    }
  }, [renameFile, activeWorkspace, activeTab, closeTab, openTab]);

  const handleFileDelete = useCallback(async (path: string) => {
    console.log('🗑️ [DELETE] ==================== STARTING DELETION ====================');
    console.log('🗑️ [DELETE] Target path:', path);
    console.log('🗑️ [DELETE] Current workspace files (fileList):', fileList.length);
    console.log('🗑️ [DELETE] Current container files (allFilesInContainer):', allFilesInContainer.length);
    console.log('🗑️ [DELETE] Is path in workspace?', fileList.some(f => f === path || f.startsWith(path + '/')));
    console.log('🗑️ [DELETE] Is path in container?', allFilesInContainer.some(f => f === path || f.startsWith(path + '/')));
    
    // STEP 1: Delete from workspace (localStorage)
    handleDeleteFile(path);
    
    // STEP 2: Delete from WebContainer FIRST (so rescan sees the deletion)
    try {
      const { rm } = await import('@/lib/terminal/webcontainer');
      await rm(path);
      console.log('✅ [DELETE] File deleted from WebContainer:', path);
    } catch (error) {
      console.error('❌ [DELETE] Failed to delete file from WebContainer:', error);
    }
    
    // STEP 3: Force immediate rescan from WebContainer to update UI
    console.log('🔄 [DELETE] Forcing rescan to update UI...');
    console.log('🔄 [DELETE] Current allFilesInContainer before rescan:', allFilesInContainer.length);
    try {
      const { listAllFiles } = await import('@/lib/terminal/webcontainer');
      const allFiles = await listAllFiles();
      console.log('📊 [DELETE] Rescan found:', allFiles.length, 'files');
      console.log('📊 [DELETE] Deleted path still in container?', allFiles.some(f => f === path || f.startsWith(path + '/')));
      console.log('🔄 [DELETE] About to call setAllFilesInContainer with', allFiles.length, 'files');
      setAllFilesInContainer(allFiles);
      console.log('🔄 [DELETE] setAllFilesInContainer called');
    } catch (error) {
      console.error('❌ [DELETE] Failed to rescan files:', error);
    }
    
    // STEP 4: Remove from IndexedDB cache so it doesn't come back on refresh
    if (activeWorkspace) {
      try {
        const { removeFromCache } = await import('@/lib/storage/node-modules-storage');
        await removeFromCache(activeWorkspace.id, path);
        console.log('✅ [DELETE] File removed from cache:', path);
      } catch (error) {
        console.log('ℹ️ [DELETE] Could not remove from cache (might not be cached yet):', error);
      }
    }
    
    // STEP 5: Close tab if deleting the active file
    if (activeTab === path) {
      closeTab(path);
    }
    
    console.log('✅ [DELETE] ==================== DELETION COMPLETE ====================');
  }, [handleDeleteFile, activeWorkspace, activeTab, closeTab, fileList, allFilesInContainer]);

  const handleAddFileToChat = useCallback((path: string) => {
    // TODO: Implement adding file content to chat
    // For now, just show a placeholder
    console.log('Add file to chat:', path);
    alert(`Add file to chat feature coming soon!\nFile: ${path}`);
  }, []);

  const handleNewFile = useCallback(async (parentPath: string) => {
    const fileName = prompt('Enter file name:', 'untitled.txt');
    if (!fileName) return;
    
    const fullPath = parentPath ? `${parentPath.replace(/^\//, '')}/${fileName}` : fileName;
    console.log('📄 Creating new file:', fullPath);
    
    // Create empty file in workspace
    handleUpdateFile(fullPath, '');
    
    // Sync to WebContainer
    try {
      const { syncFile: syncWCFile } = await import('@/lib/terminal/webcontainer');
      await syncWCFile(fullPath, '');
      console.log('✅ New file created in WebContainer:', fullPath);
    } catch (error) {
      console.error('❌ Failed to create file in WebContainer:', error);
    }
    
    // Open the new file in editor
    openTab(fullPath);
  }, [handleUpdateFile, openTab]);

  const handleNewFolder = useCallback(async (parentPath: string) => {
    const folderName = prompt('Enter folder name:', 'new-folder');
    if (!folderName) return;
    
    const fullPath = parentPath ? `${parentPath.replace(/^\//, '')}/${folderName}` : folderName;
    const placeholderFile = `${fullPath}/.gitkeep`;
    console.log('📁 Creating new folder:', fullPath);
    
    // Create placeholder file to create the folder (folders don't exist without files)
    handleUpdateFile(placeholderFile, '');
    
    // Sync to WebContainer
    try {
      const { mkdir, syncFile: syncWCFile } = await import('@/lib/terminal/webcontainer');
      await mkdir(fullPath);
      await syncWCFile(placeholderFile, '');
      console.log('✅ New folder created in WebContainer:', fullPath);
    } catch (error) {
      console.error('❌ Failed to create folder in WebContainer:', error);
    }
  }, [handleUpdateFile]);

  const handleFileChange = useCallback((content: string) => {
    if (activeTab) {
      handleUpdateFile(activeTab, content);
      markDirty(activeTab, true);
      syncFile(activeTab, content).catch(console.error);
    }
  }, [activeTab, handleUpdateFile, markDirty]);

  useKeyboardShortcuts({
    onToggleSidebar: () => {},
    onToggleBottomPanel: () => {},
    onCloseTab: () => { if (activeTab) closeTab(activeTab); },
    onSave: () => console.log('💾 Files are auto-saved'),
  });

  if (!activeWorkspace) {
    return (
      <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
        <header className="h-12 bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center px-4 shadow-lg border-b border-[var(--border-primary)]">
          <h1 className="font-bold text-lg">🤖 JustMakeIt.AI</h1>
          <div className="ml-6">
            <WorkspaceSelector
              workspaces={workspaces}
              activeWorkspaceId={null}
              onSwitch={switchWorkspace}
              onNew={() => setShowCreateDialog(true)}
              onDelete={deleteWorkspace}
              onExport={exportWorkspace}
              onImport={handleImportWorkspace}
            />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 border-l border-[var(--border-primary)] pl-4">
                <span className="text-xs text-[var(--text-secondary)]">{user.name || user.email}</span>
                <UserButton size="sm" />
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
          <div className="text-center space-y-4">
            <p className="text-xl">No workspace selected</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="ide-btn ide-btn-primary"
            >
              Create Your First Workspace
            </button>
          </div>
        </div>

        <CreateWorkspaceDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={createWorkspace}
        />
      </div>
    );
  }

  // Terminal section component (after null check)
  const terminalSection = (
    <TerminalSection 
      workspaceId={activeWorkspace.id} 
      files={files}
      onFileUpdate={handleUpdateFile}
      onFileDelete={handleDeleteFile}
      onCacheStatusChange={(status) => setCacheStatus(prev => ({ ...prev, ...status }))}
    />
  );

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="h-12 bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center px-4 shadow-lg border-b border-[var(--border-primary)]">
        <h1 className="font-bold text-lg">🤖 JustMakeIt.AI</h1>
        <div className="ml-6">
          <WorkspaceSelector
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspace.id}
            onSwitch={switchWorkspace}
            onNew={() => setShowCreateDialog(true)}
            onDelete={deleteWorkspace}
            onExport={exportWorkspace}
            onImport={handleImportWorkspace}
          />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-xs text-[var(--text-tertiary)]">
            {displayFileList.length} files ({fileList.length} in workspace)
          </span>

          {user && (
            <div className="flex items-center space-x-2 border-l border-[var(--border-primary)] pl-4">
              <span className="text-xs text-[var(--text-secondary)]">{user.name || user.email}</span>
              <UserButton size="sm" />
            </div>
          )}
        </div>
      </header>

      {/* Main IDE Layout with Drag & Drop */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <DraggableLayout
            workspace={activeWorkspace}
            files={files}
            fileList={displayFileList}
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            onSelectFile={handleSelectFile}
            onFileChange={handleFileChange}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleFileDelete}
            onAddToChat={handleAddFileToChat}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onCreateThread={handleCreateThread}
            onSwitchThread={handleSwitchThread}
            onDeleteThread={handleDeleteThread}
            onUpdateThread={handleUpdateThread}
            onFileUpdate={handleUpdateFile}
            onFileDelete={handleDeleteFile}
            terminalSection={terminalSection}
            cacheStatus={cacheStatus}
          />
        </div>
        
        {/* Preview Panel - Shows when server is running */}
        {previewUrl && (
          <div className="h-96 border-t border-[#3E3E42] flex-shrink-0">
            {(() => {
              const PreviewPane = require('@/components/preview/PreviewPane').PreviewPane;
              return <PreviewPane previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />;
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-6 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs flex items-center px-4 border-t border-[var(--border-primary)]">
        <span>JustMakeIt.AI v0.1.0</span>
        <span className="ml-4 text-[var(--text-disabled)]">{activeWorkspace.name}</span>
        <span className="ml-auto">{fileList.length} files in workspace</span>
      </footer>

      <CreateWorkspaceDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={createWorkspace}
      />
    </div>
  );
}

