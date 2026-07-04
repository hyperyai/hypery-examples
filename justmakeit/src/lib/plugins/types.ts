/**
 * Plugin System Types
 * Defines the interfaces for creating modular, extensible plugins
 */

import type { ReactNode } from 'react';
import type { MCPToolHandler } from '@/lib/mcp/registry';

/**
 * Base plugin interface - all plugins must implement this
 */
export interface Plugin {
  /** Unique identifier for the plugin */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what the plugin does */
  description: string;
  
  /** Version of the plugin */
  version: string;
  
  /** Content types this plugin handles (e.g., 'image', '3d-model', 'audio') */
  contentTypes: string[];
  
  /** Plugin capabilities */
  capabilities: PluginCapability[];
  
  /** MCP tools provided by this plugin */
  tools?: MCPToolHandler[];
  
  /** Initialize the plugin (optional) */
  initialize?: () => Promise<void> | void;
  
  /** Cleanup when plugin is unloaded (optional) */
  cleanup?: () => Promise<void> | void;
}

/**
 * Plugin capabilities
 */
export type PluginCapability = 
  | 'viewer'      // Can view content
  | 'editor'      // Can edit content
  | 'generator'   // Can generate new content
  | 'analyzer'    // Can analyze content
  | 'transformer' // Can transform content
  | 'exporter';   // Can export content

/**
 * Viewer Plugin - Displays content
 */
export interface ViewerPlugin extends Plugin {
  capabilities: ('viewer' | PluginCapability)[];
  
  /** Component to render the content */
  ViewerComponent: React.ComponentType<ViewerComponentProps>;
  
  /** Supported file extensions */
  supportedExtensions: string[];
  
  /** Check if this plugin can handle a specific URL/file */
  canHandle?: (url: string, contentType: string) => boolean;
}

/**
 * Editor Plugin - Allows editing content
 */
export interface EditorPlugin extends Plugin {
  capabilities: ('editor' | PluginCapability)[];
  
  /** Component to render the editor */
  EditorComponent: React.ComponentType<EditorComponentProps>;
  
  /** Available editing operations */
  operations: EditorOperation[];
  
  /** Execute an operation */
  executeOperation: (
    operation: string,
    parameters: Record<string, any>,
    content: ContentData
  ) => Promise<ContentData>;
}

/**
 * Generator Plugin - Creates new content
 */
export interface GeneratorPlugin extends Plugin {
  capabilities: ('generator' | PluginCapability)[];
  
  /** Generate new content */
  generate: (
    prompt: string,
    parameters: Record<string, any>
  ) => Promise<ContentData>;
  
  /** Available generation templates */
  templates?: GeneratorTemplate[];
}

/**
 * Props for viewer components
 */
export interface ViewerComponentProps {
  /** URL or data URL of the content */
  url: string;
  
  /** Optional content ID (for tracking) */
  contentId?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Callback when content is loaded */
  onLoad?: () => void;
  
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  
  /** Optional: Actions to display */
  actions?: ViewerAction[];
}

/**
 * Props for editor components
 */
export interface EditorComponentProps extends ViewerComponentProps {
  /** Current content data */
  content: ContentData;
  
  /** Callback when content is modified */
  onChange?: (content: ContentData) => void;
  
  /** Available operations */
  operations?: EditorOperation[];
  
  /** Callback to execute operation */
  onExecuteOperation?: (operation: string, parameters: Record<string, any>) => void;
  
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
}

/**
 * Content data structure
 */
export interface ContentData {
  /** Type of content */
  type: string;
  
  /** URL to the content */
  url?: string;
  
  /** Raw data (for data URLs or blob data) */
  data?: any;
  
  /** Metadata about the content */
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    size?: number;
    [key: string]: any;
  };
  
  /** History for undo/redo */
  history?: ContentData[];
}

/**
 * Editor operation definition
 */
export interface EditorOperation {
  /** Unique operation ID */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what it does */
  description: string;
  
  /** Icon (lucide-react icon name or emoji) */
  icon?: string;
  
  /** Parameters required for this operation */
  parameters?: OperationParameter[];
  
  /** Category for grouping operations */
  category?: 'transform' | 'filter' | 'adjust' | 'add' | 'remove' | 'export' | 'other';
  
  /** Whether this operation requires AI processing */
  requiresAI?: boolean;
}

/**
 * Operation parameter definition
 */
export interface OperationParameter {
  /** Parameter ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Parameter type */
  type: 'number' | 'string' | 'boolean' | 'select' | 'color' | 'range';
  
  /** Default value */
  default?: any;
  
  /** Options for select type */
  options?: Array<{ label: string; value: any }>;
  
  /** Min/max for number/range types */
  min?: number;
  max?: number;
  step?: number;
  
  /** Description/help text */
  description?: string;
}

/**
 * Generator template
 */
export interface GeneratorTemplate {
  /** Template ID */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Preview image */
  preview?: string;
  
  /** Default parameters */
  defaultParameters?: Record<string, any>;
}

/**
 * Viewer action (buttons/controls in viewer)
 */
export interface ViewerAction {
  /** Action ID */
  id: string;
  
  /** Label */
  label: string;
  
  /** Icon */
  icon?: string;
  
  /** Callback */
  onClick: () => void;
  
  /** Whether action is disabled */
  disabled?: boolean;
}

/**
 * Content view (used in chat messages)
 */
export interface ContentView {
  /** Content type (matches plugin contentTypes) */
  type: string;
  
  /** URL to content */
  url: string | null;
  
  /** Optional content ID */
  id?: string;
  
  /** Mode: view or edit */
  mode: 'view' | 'edit';
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** For comparison views */
  isComparison?: boolean;
  comparisonPosition?: 'left' | 'right';
}

/**
 * Plugin events
 */
export type PluginEvent = 
  | { type: 'content:loaded'; contentId: string; content: ContentData }
  | { type: 'content:modified'; contentId: string; content: ContentData }
  | { type: 'content:saved'; contentId: string; path: string }
  | { type: 'operation:executed'; operation: string; contentId: string }
  | { type: 'error'; error: Error; contentId?: string };

/**
 * Plugin event handler
 */
export type PluginEventHandler = (event: PluginEvent) => void;

/**
 * Plugin context (provided to all plugins)
 */
export interface PluginContext {
  /** Workspace information */
  workspace: any;
  
  /** Event emitter */
  emit: (event: PluginEvent) => void;
  
  /** Event listener */
  on: (eventType: string, handler: PluginEventHandler) => void;
  
  /** Hypery URL */
  aiGatewayUrl?: string;
  
  /** Hypery token */
  aiGatewayToken?: string;
}

