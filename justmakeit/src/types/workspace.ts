/**
 * Workspace Types
 */

import type { ContentView } from '@/lib/plugins/types';

export interface FileAttachment {
  path: string;
  name: string;
  type: 'text' | 'image' | 'code' | 'binary';
  content?: string; // For text/code files
  dataUrl?: string; // For images (base64 data URL)
  mimeType?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: any[];
  toolResults?: any[];
  imageIds?: string[]; // Legacy support
  contentViews?: ContentView[]; // New: Support any content type via plugins
  attachments?: FileAttachment[]; // File attachments (drag-and-drop from file tree)
}

export interface ChatThread {
  id: string;
  name: string;
  description?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  currentTask?: any; // Active AgentTask if running
}

export interface EditorTab {
  path: string;
  title: string;
  isDirty: boolean;
}

export interface FileManifestEntry {
  hash: string;
  size: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, string>; // Lazy-loaded file contents (initially empty)
  fileManifest: Record<string, FileManifestEntry>; // File metadata (always present)
  chatThreads: ChatThread[]; // Multiple independent chats
  activeChatId: string | null; // Currently selected chat
  openTabs?: EditorTab[]; // Open editor tabs for this workspace
  activeTabPath?: string | null; // Currently active tab
  settings: {
    theme: string;
    fontSize: number;
    tabSize: number;
  };
}

export interface WorkspaceStorage {
  version?: number;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
}

export interface WorkspaceTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  settings?: {
    theme: string;
    fontSize: number;
    tabSize: number;
  };
}
