/**
 * File System MCP Tools
 * Implements resource_read, resource_write, resource_list
 */

import type { MCPToolHandler } from '../mcp/registry';

export interface FileSystemContext {
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
  setActiveFile: (path: string) => void;
}

/**
 * Read file contents
 */
export const resourceRead: MCPToolHandler = {
  name: 'resource_read',
  description: 'Read the contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        pattern: '^file://',
        description: 'File URI (e.g., file://index.html)',
      },
    },
    required: ['uri'],
  },
  handler: async ({ uri }, context) => {
    const path = uri.replace('file://', '');
    const content = context.files[path];

    if (content === undefined) {
      return {
        content: [{
          type: 'error',
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
        }],
        isError: true,
        success: false,
      };
    }

    return {
      success: true,
      content: [{
        type: 'text',
        text: content,
      }],
    };
  },
};

/**
 * Write file contents
 */
export const resourceWrite: MCPToolHandler = {
  name: 'resource_write',
  description: 'Write content to a file (creates if doesn\'t exist)',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        pattern: '^file://',
        description: 'File URI (e.g., file://index.html)',
      },
      content: {
        type: 'string',
        description: 'File content to write',
      },
    },
    required: ['uri', 'content'],
  },
  handler: async ({ uri, content }, context) => {
    const path = uri.replace('file://', '');
    
    // Update files
    context.setFiles({
      ...context.files,
      [path]: content,
    });

    const bytes = new Blob([content]).size;

    return {
      success: true,
      content: [{
        type: 'text',
        text: `Wrote ${bytes} bytes to ${path}`,
      }],
    };
  },
};

/**
 * List all files in workspace
 */
export const resourceList: MCPToolHandler = {
  name: 'resource_list',
  description: 'List all files in the workspace',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (args, context) => {
    const files = Object.keys(context.files);

    if (files.length === 0) {
      return {
        success: true,
        content: [{
          type: 'text',
          text: 'No files in workspace',
        }],
      };
    }

    return {
      success: true,
      content: [{
        type: 'text',
        text: files.join('\n'),
      }],
    };
  },
};

/**
 * Delete a file
 */
export const resourceDelete: MCPToolHandler = {
  name: 'resource_delete',
  description: 'Delete a file from the workspace',
  inputSchema: {
    type: 'object',
    properties: {
      uri: {
        type: 'string',
        pattern: '^file://',
        description: 'File URI to delete',
      },
    },
    required: ['uri'],
  },
  handler: async ({ uri }, context) => {
    const path = uri.replace('file://', '');

    if (!(path in context.files)) {
      return {
        content: [{
          type: 'error',
          code: 'FILE_NOT_FOUND',
          message: `File not found: ${path}`,
        }],
        isError: true,
        success: false,
      };
    }

    const newFiles = { ...context.files };
    delete newFiles[path];
    context.setFiles(newFiles);

    return {
      success: true,
      content: [{
        type: 'text',
        text: `Deleted ${path}`,
      }],
    };
  },
};

export const fileTools = [
  resourceRead,
  resourceWrite,
  resourceList,
  resourceDelete,
];



