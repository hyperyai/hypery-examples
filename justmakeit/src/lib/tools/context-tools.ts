/**
 * Context MCP Tools
 * Implements context_get for retrieving IDE state
 */

import type { MCPToolHandler } from '../mcp/registry';
import type { FileSystemContext } from './file-tools';

interface IDEContext extends FileSystemContext {
  activeFile: string;
}

/**
 * Get IDE context information
 */
export const contextGet: MCPToolHandler = {
  name: 'context_get',
  description: 'Get current IDE context (files, editor state, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        enum: ['files', 'editor', 'workspace'],
        description: 'Context scope to retrieve',
      },
    },
    required: ['scope'],
  },
  handler: async ({ scope }, context) => {
    const data: Record<string, any> = {
      files: {
        count: Object.keys(context.files).length,
        list: Object.keys(context.files),
      },
      editor: {
        activeFile: context.activeFile || 'none',
        hasContent: context.activeFile ? (context.files[context.activeFile]?.length || 0) > 0 : false,
      },
      workspace: {
        name: 'JustMakeIt.AI Workspace',
        fileCount: Object.keys(context.files).length,
        totalSize: Object.values(context.files).reduce((sum, content) => sum + content.length, 0),
      },
    };

    if (!(scope in data)) {
      return {
        success: false,
        content: [{
          type: 'error',
          code: 'INVALID_SCOPE',
          message: `Unknown scope: ${scope}`,
        }],
        isError: true,
      };
    }

    return {
      success: true,
      content: [{
        type: 'text',
        text: JSON.stringify(data[scope], null, 2),
      }],
    };
  },
};

export const contextTools = [contextGet];



