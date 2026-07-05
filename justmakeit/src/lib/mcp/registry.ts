/**
 * Enhanced MCP Tool Registry
 * Browser-native implementation following VS Code/Cursor pattern
 */

import type { Workspace, ChatMessage } from '@/types/workspace';

export interface MCPToolHandler {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context: MCPContext) => Promise<MCPToolResult>;
}

export interface MCPContext {
  workspace: Workspace;
  updateWorkspace: (updates: Partial<Workspace>) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  // Workspace file access used by the file/context/ui MCP tools.
  files: Record<string, string>;
  activeFile: string | null;
  setFiles: (files: Record<string, string>) => void;
  setActiveFile: (path: string) => void;
  // Hypery integration for API calls (image generation, etc.)
  aiGatewayUrl?: string;
  aiGatewayToken?: string;
}

export interface MCPToolResult {
  success: boolean;
  [key: string]: any;
}

export interface MCPToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface MCPToolExecution {
  call: {
    id: string;
    name: string;
    arguments: any;
  };
  result: MCPToolResult | {
    content: Array<{
      type: 'text' | 'error';
      text?: string;
      message?: string;
    }>;
    isError?: boolean;
  };
  timestamp: number;
  duration: number;
}

/**
 * MCP Tool Registry
 * Manages tool registration and execution
 */
export class MCPRegistry {
  private tools: Map<string, MCPToolHandler> = new Map();

  /**
   * Register a single tool
   */
  register(tool: MCPToolHandler) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerMany(tools: MCPToolHandler[]) {
    tools.forEach(tool => this.register(tool));
  }

  /**
   * Get tool schemas in OpenAI format
   */
  getSchemas() {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a single tool
   */
  async execute(
    name: string,
    args: any,
    context: MCPContext
  ): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      const result = await tool.handler(args, context);
      return result;
    } catch (error) {
      console.error(`Tool execution error (${name}):`, error);
      throw error;
    }
  }

  /**
   * Execute multiple tool calls
   */
  async executeMany(
    toolCalls: MCPToolCall[],
    context: MCPContext
  ): Promise<MCPToolExecution[]> {
    const results: MCPToolExecution[] = [];
    const startTime = Date.now();

    for (const toolCall of toolCalls) {
      const callStartTime = Date.now();
      
      try {
        const result = await this.execute(
          toolCall.name,
          toolCall.arguments,
          context
        );

        results.push({
          call: toolCall,
          result,
          timestamp: callStartTime,
          duration: Date.now() - callStartTime,
        });
      } catch (error) {
        // Always convert to tool result - don't throw
        // Let tools handle their own errors gracefully
        results.push({
          call: toolCall,
          result: {
            content: [{
              type: 'error',
              message: error instanceof Error ? error.message : 'Unknown error'
            }],
            isError: true,
          },
          timestamp: callStartTime,
          duration: Date.now() - callStartTime,
        });
      }
    }

    return results;
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Clear all registered tools
   */
  clear() {
    this.tools.clear();
  }
}

