/**
 * Workspace-Aware MCP Tools
 * Local tools that operate on workspace state
 */

import type { MCPToolHandler } from './registry';

/**
 * Read a file from the workspace
 */
export const workspaceReadTool: MCPToolHandler = {
  name: 'workspace_read',
  description: 'Read the contents of a file in the current workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to workspace root (e.g., "src/App.tsx")'
      }
    },
    required: ['path']
  },
  handler: async (args, context) => {
    const { path } = args;
    const content = context.workspace.files[path];
    
    if (content === undefined) {
      return {
        success: false,
        error: `File not found: ${path}`,
        path
      };
    }
    
    return {
      success: true,
      path,
      content,
      size: content.length,
      lines: content.split('\n').length
    };
  }
};

/**
 * Write or create a file in the workspace
 */
export const workspaceWriteTool: MCPToolHandler = {
  name: 'workspace_write',
  description: 'Create a new file or update an existing file in the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to workspace root (e.g., "src/components/Button.tsx")'
      },
      content: {
        type: 'string',
        description: 'Complete file content to write'
      }
    },
    required: ['path', 'content']
  },
  handler: async (args, context) => {
    const { path, content } = args;
    const isNewFile = !context.workspace.files[path];
    
    // Update workspace state
    context.updateFile(path, content);
    
    return {
      success: true,
      path,
      action: isNewFile ? 'created' : 'updated',
      size: content.length,
      lines: content.split('\n').length
    };
  }
};

/**
 * List all files in the workspace
 */
export const workspaceListTool: MCPToolHandler = {
  name: 'workspace_list',
  description: 'List all files in the current workspace',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Optional glob-like pattern to filter files (e.g., "*.tsx", "src/**")',
      }
    }
  },
  handler: async (args, context) => {
    const { pattern } = args;
    let files = Object.keys(context.workspace.files);
    
    // Simple pattern matching
    if (pattern) {
      const regex = new RegExp(
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
      );
      files = files.filter(f => regex.test(f));
    }
    
    return {
      success: true,
      files: files.map(path => ({
        path,
        size: context.workspace.files[path].length,
        lines: context.workspace.files[path].split('\n').length
      })),
      total: files.length,
      pattern: pattern || 'all'
    };
  }
};

/**
 * Delete a file from the workspace
 */
export const workspaceDeleteTool: MCPToolHandler = {
  name: 'workspace_delete',
  description: 'Delete a file from the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to delete'
      }
    },
    required: ['path']
  },
  handler: async (args, context) => {
    const { path } = args;
    
    if (!context.workspace.files[path]) {
      return {
        success: false,
        error: `File not found: ${path}`,
        path
      };
    }
    
    context.deleteFile(path);
    
    return {
      success: true,
      path,
      action: 'deleted'
    };
  }
};

/**
 * Search for text across all files in the workspace
 */
export const workspaceSearchTool: MCPToolHandler = {
  name: 'workspace_search',
  description: 'Search for text or patterns across all files in the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Text or regex pattern to search for'
      },
      caseSensitive: {
        type: 'boolean',
        description: 'Whether the search should be case-sensitive (default: false)'
      },
      regex: {
        type: 'boolean',
        description: 'Whether to treat query as a regular expression (default: false)'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 50)'
      }
    },
    required: ['query']
  },
  handler: async (args, context) => {
    const { 
      query, 
      caseSensitive = false, 
      regex = false,
      maxResults = 50 
    } = args;
    
    const results: any[] = [];
    
    // Create search pattern
    let searchPattern: RegExp;
    try {
      if (regex) {
        searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPattern = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
      }
    } catch (error) {
      return {
        success: false,
        error: `Invalid regex pattern: ${query}`,
        query
      };
    }
    
    // Search through all files
    for (const [path, content] of Object.entries(context.workspace.files)) {
      const lines = content.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (results.length >= maxResults) return;
        
        const matches = line.matchAll(searchPattern);
        for (const match of matches) {
          if (results.length >= maxResults) break;
          
          results.push({
            path,
            line: lineIndex + 1,
            column: match.index! + 1,
            match: match[0],
            context: line.trim()
          });
        }
      });
      
      if (results.length >= maxResults) break;
    }
    
    return {
      success: true,
      query,
      caseSensitive,
      regex,
      matches: results,
      total: results.length,
      truncated: results.length === maxResults
    };
  }
};

/**
 * Get workspace context/metadata
 */
export const workspaceContextTool: MCPToolHandler = {
  name: 'workspace_context',
  description: 'Get information about the current workspace (name, file count, etc.)',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args, context) => {
    const fileCount = Object.keys(context.workspace.files).length;
    const totalSize = Object.values(context.workspace.files)
      .reduce((sum, content) => sum + content.length, 0);
    
    return {
      success: true,
      workspace: {
        id: context.workspace.id,
        name: context.workspace.name,
        description: context.workspace.description,
        fileCount,
        totalSize,
        createdAt: context.workspace.createdAt,
        updatedAt: context.workspace.updatedAt
      }
    };
  }
};

/**
 * Save generated content to workspace
 * Universal tool for saving any type of generated content (images, audio, video, etc.)
 */
export const workspaceSaveGeneratedTool: MCPToolHandler = {
  name: 'workspace_save_generated',
  description: 'Save a generated image/audio/video to the workspace. For images, pass the URL and it will be saved as a viewable file.',
  inputSchema: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename with extension (e.g., "panda.png", "cat.jpg")'
      },
      contentUrl: {
        type: 'string',
        description: 'URL of the generated content'
      },
      contentType: {
        type: 'string',
        description: 'Type of content',
        enum: ['image', 'audio', 'video', '3d', 'text', 'other']
      }
    },
    required: ['filename', 'contentUrl', 'contentType']
  },
  handler: async (args, context) => {
    const { filename, contentUrl, contentType } = args;
    
    // Simply save the URL - the IDE will display it properly
    context.updateFile(filename, contentUrl);
    
    return {
      success: true,
      filename: filename,
      path: filename,
      message: `Saved ${contentType} to ${filename}`,
      contentUrl
    };
  }
};

/**
 * All workspace tools
 */
export const workspaceTools: MCPToolHandler[] = [
  workspaceReadTool,
  workspaceWriteTool,
  workspaceListTool,
  workspaceDeleteTool,
  workspaceSearchTool,
  workspaceContextTool,
  workspaceSaveGeneratedTool
];

