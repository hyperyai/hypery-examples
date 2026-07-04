/**
 * Workspace Storage
 * Database-backed persistence via API
 */

import type { Workspace, WorkspaceStorage } from '@/types/workspace';

const STORAGE_VERSION = 1;

/**
 * Load all workspaces from API
 * TEMPORARY: Loading all files again to check if data is still in MongoDB
 */
export async function loadWorkspaces(): Promise<WorkspaceStorage> {
  if (typeof window === 'undefined') {
    return {
      version: STORAGE_VERSION,
      activeWorkspaceId: null,
      workspaces: [],
    };
  }

  try {
    const response = await fetch('/api/workspaces?includeFiles=true');
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      const workspaces = data.data.map((w: any) => {
        // Handle both ObjectId and string formats
        const id = w._id?.toString ? w._id.toString() : String(w._id);
        
        // Build fileManifest from files if available
        const fileManifest: Record<string, { hash: string; size: number }> = {};
        if (w.files) {
          for (const [path, content] of Object.entries(w.files)) {
            if (typeof content === 'string') {
              fileManifest[path] = {
                hash: 'temp',
                size: content.length,
              };
            }
          }
        }
        
        return {
          id, // Use MongoDB _id
          name: w.name,
          description: w.description,
          files: w.files || {}, // Load all files to check if they're still there
          fileManifest,
          chatThreads: w.chatThreads || [],
          activeChatId: w.activeChatId || null,
          settings: w.settings || { theme: 'vs-dark', fontSize: 14, tabSize: 2 },
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        };
      });
      
      return {
        version: STORAGE_VERSION,
        activeWorkspaceId: workspaces[0].id,
        workspaces,
      };
    }
    
    // No workspaces found - create default in database
    return await createDefaultStorage();
  } catch (error) {
    console.error('Failed to load workspaces from API:', error);
    return await createDefaultStorage();
  }
}

/**
 * Load a single workspace with full details (fileManifest, chatThreads)
 */
export async function loadWorkspaceDetails(workspaceId: string): Promise<Workspace | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(`/api/workspaces/${workspaceId}`);
    const data = await response.json();
    
    if (data.success) {
      const w = data.data;
      const id = w._id?.toString ? w._id.toString() : String(w._id);
      
      return {
        id,
        name: w.name,
        description: w.description,
        files: {}, // Still empty - use fileManifest to see what's available
        fileManifest: w.fileManifest || {},
        chatThreads: w.chatThreads || [],
        activeChatId: w.activeChatId || null,
        settings: w.settings || { theme: 'vs-dark', fontSize: 14, tabSize: 2 },
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load workspace details:', error);
    return null;
  }
}

/**
 * Lazy load file contents for specific paths
 */
export async function loadWorkspaceFiles(
  workspaceId: string, 
  paths: string[]
): Promise<Record<string, string>> {
  if (typeof window === 'undefined' || paths.length === 0) return {};

  try {
    const response = await fetch(
      `/api/workspaces/${workspaceId}/files?paths=${paths.join(',')}`
    );
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return {};
  } catch (error) {
    console.error('Failed to load workspace files:', error);
    return {};
  }
}

/**
 * Save workspace to API
 */
export async function saveWorkspace(workspace: Workspace): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Filter out images before sending
    const cleanFiles = Object.fromEntries(
      Object.entries(workspace.files).filter(([filename, content]) => {
        if (typeof content === 'string' && content.startsWith('data:image/')) {
          return false; // Don't save images to database
        }
        return true;
      })
    );

    const response = await fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Don't send workspaceId - we're using MongoDB _id now
        name: workspace.name,
        description: workspace.description,
        files: cleanFiles,
        chatThreads: workspace.chatThreads,
        activeChatId: workspace.activeChatId,
        settings: workspace.settings,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save workspace');
    }
  } catch (error) {
    console.error('Failed to save workspace:', error);
  }
}

/**
 * Create new workspace in API
 * Returns the created workspace with MongoDB _id
 */
export async function createWorkspace(workspace: Omit<Workspace, 'id'>): Promise<Workspace | null> {
  if (typeof window === 'undefined') return null;

  try {
    const cleanFiles = Object.fromEntries(
      Object.entries(workspace.files).filter(([_, content]) => 
        !(typeof content === 'string' && content.startsWith('data:image/'))
      )
    );

    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Don't send workspaceId or id - MongoDB will auto-generate _id
        name: workspace.name,
        description: workspace.description,
        files: cleanFiles,
        chatThreads: workspace.chatThreads || [],
        activeChatId: workspace.activeChatId,
        settings: workspace.settings,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create workspace');
    }

    const data = await response.json();
    if (data.success && data.data) {
      const workspaceId = data.data._id?.toString() || data.data._id;
      
      // Load full workspace details to get fileManifest
      const fullWorkspace = await loadWorkspaceDetails(workspaceId);
      if (fullWorkspace) {
        // Populate files since we just created them
        fullWorkspace.files = cleanFiles;
        return fullWorkspace;
      }
      
      // Fallback: return without manifest (shouldn't happen)
      return {
        id: workspaceId,
        name: data.data.name,
        description: data.data.description,
        files: cleanFiles,
        fileManifest: {}, // Empty fallback
        chatThreads: data.data.chatThreads || [],
        activeChatId: data.data.activeChatId,
        settings: data.data.settings,
        createdAt: data.data.createdAt,
        updatedAt: data.data.updatedAt,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return null;
  }
}

/**
 * Delete workspace from API
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete workspace');
    }
  } catch (error) {
    console.error('Failed to delete workspace:', error);
  }
}

/**
 * Create default storage with a blank workspace
 * This MUST be async because it creates the workspace in the database!
 */
async function createDefaultStorage(): Promise<WorkspaceStorage> {
  // Create the default workspace in the database first
  const now = new Date().toISOString();
  const defaultWorkspace = await createWorkspace({
    name: 'My First Project',
    description: 'A blank workspace to get started',
    createdAt: now,
    updatedAt: now,
    files: {
      'README.md': '# My First Project\n\nWelcome to JustMakeIt.AI! Ask the AI to help you create files and code.\n\n## Getting Started\n\nTry asking:\n- "Create a React component called Button"\n- "Add a TypeScript config file"\n- "Write a simple Express server"\n',
    },
    fileManifest: {
      'README.md': {
        hash: '',
        size: 0,
      },
    },
    chatThreads: [],
    activeChatId: null,
    settings: {
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
    },
  });

  // If creation failed, return a minimal fallback (should never happen)
  if (!defaultWorkspace) {
    console.error('❌ Failed to create default workspace in database!');
    return {
      version: STORAGE_VERSION,
      activeWorkspaceId: '',
      workspaces: [],
    };
  }

  return {
    version: STORAGE_VERSION,
    activeWorkspaceId: defaultWorkspace.id,
    workspaces: [defaultWorkspace],
  };
}

/**
 * Migrate storage from older versions
 */
function migrateStorage(old: WorkspaceStorage): WorkspaceStorage {
  // Future migrations will go here
  return old;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export workspace as JSON file
 */
export function exportWorkspace(workspace: Workspace): void {
  const json = JSON.stringify(workspace, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspace.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import workspace from JSON file
 */
export function importWorkspace(file: File): Promise<Workspace> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workspace = JSON.parse(e.target?.result as string) as Workspace;
        // Generate new ID to avoid conflicts
        workspace.id = generateId();
        workspace.updatedAt = new Date().toISOString();
        resolve(workspace);
      } catch (error) {
        reject(new Error('Invalid workspace file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}



