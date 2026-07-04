/**
 * useWorkspaces Hook
 * Manages multiple workspaces with localStorage persistence
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Workspace, WorkspaceStorage, ChatMessage, ChatThread } from '../types/workspace';
import {
  loadWorkspaces,
  loadWorkspaceDetails,
  loadWorkspaceFiles,
  saveWorkspace,
  createWorkspace as apiCreateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
  generateId,
  exportWorkspace as exportWorkspaceFile,
  importWorkspace as importWorkspaceFile,
} from '../lib/storage/workspace-storage';
import { getTemplate } from '../lib/templates/workspace-templates';

export function useWorkspaces() {
  // SEPARATE STATE - don't put everything in one object!
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load workspaces from API on mount
  useEffect(() => {
    loadWorkspaces().then(loaded => {
      // Just use the workspaces as-is - no cleaning needed
      // Files will be lazy loaded when workspace is opened
      setWorkspaces(loaded.workspaces);
      setIsLoading(false);
    }).catch(error => {
      console.error('Failed to load workspaces:', error);
      setIsLoading(false);
    });
  }, []);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Keep stable reference to activeWorkspace - don't recompute on every workspaces change!
  const activeWorkspaceRef = useRef<Workspace | null>(null);
  
  // DEBUG: Log when workspaces array reference changes
  const prevWorkspacesRef = useRef(workspaces);
  if (prevWorkspacesRef.current !== workspaces) {
    console.log('🔴 WORKSPACES ARRAY CHANGED! This causes useMemo to recompute.');
    prevWorkspacesRef.current = workspaces;
  }
  
  const activeWorkspace = useMemo(() => {
    console.log('🔵 activeWorkspace useMemo recomputing...');

    if (!activeWorkspaceId) {
      activeWorkspaceRef.current = null;
      return null;
    }
    
    const found = workspaces.find(w => w.id === activeWorkspaceId);
    if (!found) {
      activeWorkspaceRef.current = null;
      return null;
    }
    
    // If we don't have a cached version or ID changed, use the new one
    if (!activeWorkspaceRef.current || activeWorkspaceRef.current.id !== found.id) {
      console.log('📦 Caching new workspace:', found.id);
      activeWorkspaceRef.current = found;
      return found;
    }
    
    // KEEP THE SAME REFERENCE unless data actually changed
    const cached = activeWorkspaceRef.current;
    if (cached.updatedAt !== found.updatedAt) {
      console.log('🔄 Workspace updated:', found.id);
      activeWorkspaceRef.current = found;
      return found;
    }
    
    console.log('✅ Using cached workspace (same reference)');
    return cached;
  }, [workspaces, activeWorkspaceId]);

  // Note: No auto-select here - URL routing handles workspace selection
  // - /ide redirects to first workspace
  // - /workspace/[id] switches to specific workspace
  // - Deleting active workspace handled by deleteWorkspace function

  // DISABLED: Auto-save is dangerous with lazy loading!
  // It would save empty files back to DB, overwriting real data
  // TODO: Implement proper delta updates or explicit save
  // useEffect(() => {
  //   if (!isLoading && activeWorkspace) {
  //     saveWorkspace(activeWorkspace);
  //   }
  // }, [activeWorkspace, isLoading]);

  // Create a new workspace
  const createWorkspace = useCallback(
    async (name: string, description?: string, templateId?: string) => {
      const template = templateId ? getTemplate(templateId) : null;

      const initialChat: ChatThread = {
        id: generateId(),
        name: 'Main Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const workspaceToCreate = {
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: template?.files || {
          'README.md': `# ${name}\n\nCreated with JustMakeIt.AI\n`,
        },
        fileManifest: {}, // Will be computed by API
        chatThreads: [initialChat],
        activeChatId: initialChat.id,
        settings: template?.settings || {
          theme: 'vs-dark',
          fontSize: 14,
          tabSize: 2,
        },
      };

      // Save to API and get back the workspace with MongoDB _id
      const createdWorkspace = await apiCreateWorkspace(workspaceToCreate);

      if (!createdWorkspace) {
        throw new Error('Failed to create workspace');
      }

      setWorkspaces(prev => [...prev, createdWorkspace]);
      setActiveWorkspaceId(createdWorkspace.id);

      return createdWorkspace;
    },
    []
  );

  // Switch to a different workspace
  const switchWorkspace = useCallback(async (workspaceId: string) => {
    // Load full workspace details if not already loaded
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace && Object.keys(workspace.fileManifest).length === 0) {
      // File manifest not loaded yet - load it!
      const details = await loadWorkspaceDetails(workspaceId);
      if (details) {
        setWorkspaces(prev => prev.map(w => 
          w.id === workspaceId 
            ? { 
                ...w, 
                ...details,
                files: { ...w.files, ...details.files }, // Merge files, don't overwrite!
              }
            : w
        ));
      }
    }
    
    setActiveWorkspaceId(workspaceId);
  }, [workspaces]);

  // Delete a workspace
  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    // Delete from API
    await apiDeleteWorkspace(workspaceId);

    setWorkspaces(prev => {
      const filtered = prev.filter((w) => w.id !== workspaceId);
      
      // If we deleted the active workspace, switch to another
      if (workspaceId === activeWorkspaceId) {
        setActiveWorkspaceId(filtered.length > 0 ? filtered[0].id : null);
      }

      return filtered;
    });
  }, [activeWorkspaceId]);

  // Duplicate a workspace
  const duplicateWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return null;

    const duplicated: Workspace = {
      ...workspace,
      id: generateId(),
      name: `${workspace.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkspaces(prev => [...prev, duplicated]);

    return duplicated;
  }, [workspaces]);

  // Update workspace files - DON'T recreate entire workspace!
  const updateFile = useCallback(async (path: string, content: string) => {
    if (!activeWorkspaceId) {
      console.error('❌ Cannot update file: no active workspace');
      return;
    }

    // Validate path - reject invalid paths
    if (!path || path.endsWith('/') || path.includes('//') || !path.includes('.')) {
      console.warn('⚠️ Skipping invalid file path:', path);
      return;
    }

    // Log the operation with workspace ID for debugging
    console.log(`🔧 [UPDATE] File: ${path} → Workspace: ${activeWorkspaceId.slice(0, 8)}...`);

    setWorkspaces((prev) => {
      // Capture the current activeWorkspaceId for this update
      const targetWorkspaceId = activeWorkspaceId;
      
      const updated = prev.map((w) => {
        if (w.id === targetWorkspaceId) {
          const newFiles = { ...w.files, [path]: content };
          
          // Update fileManifest too!
          const newFileManifest = {
            ...w.fileManifest,
            [path]: {
              hash: 'temp', // Will be computed by server
              size: content.length,
            }
          };
          
          console.log(`  ✅ Updated "${w.name}" - now has ${Object.keys(newFiles).length} files`);
          return { 
            ...w, 
            files: newFiles, 
            fileManifest: newFileManifest,
            updatedAt: new Date().toISOString() 
          };
        }
        return w;
      });
      return updated;
    });
    
    // Save this specific file to DB immediately
    try {
      const workspace = workspaces.find(w => w.id === activeWorkspaceId);
      if (workspace) {
        await saveWorkspace({
          ...workspace,
          files: { ...workspace.files, [path]: content }
        });
        console.log(`💾 Saved file to DB: ${path}`);
      }
    } catch (error) {
      console.error('Failed to save file to DB:', error);
    }
  }, [activeWorkspaceId, workspaces]);

  // Delete a file or folder (and all files under it)
  const deleteFile = useCallback((path: string) => {
    console.log('🔧 useWorkspaces.deleteFile called:', { path, activeWorkspaceId });
    if (!activeWorkspaceId) {
      console.error('❌ Cannot delete file: no active workspace');
      return;
    }

    setWorkspaces((prev) => {
      const updated = prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          // Delete the exact file AND any files under this path (for folder deletions)
          const remainingFiles: Record<string, string> = {};
          let deletedCount = 0;
          
          for (const [filePath, content] of Object.entries(w.files)) {
            // Keep files that don't match the path and aren't under it
            if (filePath !== path && !filePath.startsWith(path + '/')) {
              remainingFiles[filePath] = content;
            } else {
              deletedCount++;
              console.log('🗑️ Deleting from workspace:', filePath);
            }
          }
          
          console.log(`✅ Deleted ${deletedCount} file(s) from workspace, remaining files: ${Object.keys(remainingFiles).length}`);
          return { ...w, files: remainingFiles, updatedAt: new Date().toISOString() };
        }
        return w;
      });
      return updated;
    });
  }, [activeWorkspaceId]);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    console.log('🔧 useWorkspaces.renameFile called:', { oldPath, newPath, activeWorkspaceId });
    if (!activeWorkspaceId) {
      console.error('❌ Cannot rename file: no active workspace');
      return;
    }

    setWorkspaces((prev) => {
      const updated = prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          const content = w.files[oldPath];
          if (content === undefined) {
            console.error('❌ File not found:', oldPath);
            return w;
          }
          
          // Create new files object with renamed file
          const { [oldPath]: _, ...remainingFiles } = w.files;
          const newFiles = { ...remainingFiles, [newPath]: content };
          
          console.log('✅ File renamed in workspace:', { oldPath, newPath });
          return { ...w, files: newFiles, updatedAt: new Date().toISOString() };
        }
        return w;
      });
      return updated;
    });
  }, [activeWorkspaceId]);

  // Update workspace metadata/settings
  const updateWorkspace = useCallback((updates: Partial<Workspace>) => {
    if (!activeWorkspaceId) return;

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, ...updates, updatedAt: new Date().toISOString() }
          : w
      )
    );
  }, [activeWorkspaceId]);

  // Create a new chat thread
  const createChatThread = useCallback((name: string, description?: string) => {
    if (!activeWorkspaceId) return null;

    const newThread: ChatThread = {
      id: generateId(),
      name,
      description,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              chatThreads: [...(w.chatThreads || []), newThread],
              activeChatId: newThread.id,
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );

    return newThread;
  }, [activeWorkspaceId]);

  // Switch active chat thread
  const switchChatThread = useCallback((chatId: string) => {
    console.log('🔄 [SWITCH] switchChatThread called:', { chatId, activeWorkspaceId });
    if (!activeWorkspaceId) {
      console.error('❌ [SWITCH] No active workspace!');
      return;
    }

    setWorkspaces((prev) => {
      const updated = prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          console.log('✅ [SWITCH] Updating workspace:', {
            workspaceId: w.id,
            oldActiveChatId: w.activeChatId,
            newActiveChatId: chatId
          });
          return { ...w, activeChatId: chatId, updatedAt: new Date().toISOString() };
        }
        return w;
      });
      console.log('📊 [SWITCH] Updated workspaces:', updated.find(w => w.id === activeWorkspaceId)?.activeChatId);
      return updated;
    });
  }, [activeWorkspaceId]);

  // Delete a chat thread
  const deleteChatThread = useCallback((chatId: string) => {
    if (!activeWorkspaceId) return;

    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          const threads = w.chatThreads || [];
          const filtered = threads.filter((t) => t.id !== chatId);
          let newActiveChatId = w.activeChatId;

          if (chatId === w.activeChatId) {
            newActiveChatId = filtered.length > 0 ? filtered[0].id : null;
          }

          return {
            ...w,
            chatThreads: filtered,
            activeChatId: newActiveChatId,
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  }, [activeWorkspaceId]);

  // Update chat thread (messages, task, etc.)
  const updateChatThread = useCallback((chatId: string, updates: Partial<ChatThread>) => {
    if (!activeWorkspaceId) return;

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              chatThreads: (w.chatThreads || []).map((t) =>
                t.id === chatId
                  ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                  : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );
  }, [activeWorkspaceId]);

  // Add a message to a specific chat thread
  const addChatMessage = useCallback((chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!activeWorkspaceId) return null;

    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              chatThreads: (w.chatThreads || []).map((t) =>
                t.id === chatId
                  ? {
                      ...t,
                      messages: [...t.messages, newMessage],
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );

    return newMessage;
  }, [activeWorkspaceId]);

  // Clear chat thread messages
  const clearChatThread = useCallback((chatId: string) => {
    if (!activeWorkspaceId) return;

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              chatThreads: (w.chatThreads || []).map((t) =>
                t.id === chatId
                  ? { ...t, messages: [], currentTask: undefined, updatedAt: new Date().toISOString() }
                  : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : w
      )
    );
  }, [activeWorkspaceId]);

  // Export workspace
  const exportWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      exportWorkspaceFile(workspace);
    }
  }, [workspaces]);

  // Import workspace
  const importWorkspace = useCallback(async (file: File) => {
    try {
      const workspace = await importWorkspaceFile(file);
      setWorkspaces(prev => [...prev, workspace]);
      setActiveWorkspaceId(workspace.id);
      return workspace;
    } catch (error) {
      console.error('Failed to import workspace:', error);
      return null;
    }
  }, []);

  // Lazy load file content
  const loadFiles = useCallback(async (paths: string[]) => {
    if (!activeWorkspaceId || paths.length === 0) return;
    
    // Filter paths that haven't been loaded yet
    const activeWs = workspaces.find(w => w.id === activeWorkspaceId);
    if (!activeWs) return;
    
    const unloadedPaths = paths.filter(p => !activeWs.files[p]);
    if (unloadedPaths.length === 0) return; // All already loaded
    
    // Load file contents
    const fileContents = await loadWorkspaceFiles(activeWorkspaceId, unloadedPaths);
    
    // Update workspace with loaded files
    setWorkspaces(prev => prev.map(w => 
      w.id === activeWorkspaceId 
        ? { ...w, files: { ...w.files, ...fileContents } }
        : w
    ));
  }, [activeWorkspaceId, workspaces]);

  return {
    // State
    workspaces,
    activeWorkspace,
    isLoading,
    
    // Workspace actions
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
    duplicateWorkspace,
    updateWorkspace,
    exportWorkspace,
    importWorkspace,
    
    // File actions
    updateFile,
    deleteFile,
    renameFile,
    loadFiles, // NEW: Lazy load file content
    
    // Chat thread actions
    createChatThread,
    switchChatThread,
    deleteChatThread,
    updateChatThread,
    addChatMessage,
    clearChatThread,
  };
}

