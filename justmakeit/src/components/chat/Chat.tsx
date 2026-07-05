/**
 * Chat Component
 * Main chat interface with browser-native MCP support and multi-threading
 */

'use client';

import { useState, useMemo } from 'react';
import { useHyperyAuth } from '@hyperyai/sdk';
import type { Workspace, ChatMessage, ChatThread } from '@/types/workspace';
import { MCPRegistry, type MCPContext, type MCPToolExecution } from '@/lib/mcp/registry';
import { workspaceTools } from '@/lib/mcp/workspace-tools';
import { imageTools } from '@/lib/mcp/image-tools';
import { capabilityTools } from '@/lib/mcp/capability-tools';
import { editorTools } from '@/lib/mcp/editor-tools';
import { modelExecutionTools } from '@/lib/mcp/model-execution-tool';
import { createPluginRegistry, type PluginRegistry } from '@/lib/plugins/registry';
import { builtinPlugins } from '@/lib/plugins/builtin';
import type { AgentTask } from '@/lib/agents/orchestrator';
import { MessageList } from './MessageList';
import { ChatInput, type ChatMode } from './ChatInput';
import { TaskProgress } from './TaskProgress';
import { ChatThreadSelector } from './ChatThreadSelector';
import { RestrictionModal, type RestrictionError } from '@hyperyai/sdk';

interface ChatProps {
  workspace: Workspace;
  onCreateThread: (name: string) => ChatThread | null;
  onSwitchThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateThread: (threadId: string, updates: Partial<ChatThread>) => void;
  onFileUpdate: (path: string, content: string) => void;
  onFileDelete: (path: string) => void;
}

export function Chat({ 
  workspace,
  onCreateThread,
  onSwitchThread,
  onDeleteThread,
  onUpdateThread,
  onFileUpdate,
  onFileDelete 
}: ChatProps) {
  const { getAccessToken } = useHyperyAuth();
  
  // Get active chat thread (with backward compatibility)
  const activeThread = workspace.chatThreads?.find(
    t => t.id === workspace.activeChatId
  ) || workspace.chatThreads?.[0];
  
  console.log('🎯 [CHAT] Active thread check:', {
    activeChatId: workspace.activeChatId,
    activeThreadId: activeThread?.id,
    activeThreadName: activeThread?.name,
    totalThreads: workspace.chatThreads?.length
  });

  const [isLoading, setIsLoading] = useState(false);
  const [restrictionError, setRestrictionError] = useState<RestrictionError | null>(null);

  // Initialize plugin registry
  const pluginRegistry = useMemo(() => {
    const registry = createPluginRegistry({
      workspace,
      emit: (event) => console.log('Plugin event:', event),
      on: (eventType, handler) => {},
    });
    
    // Register all built-in plugins
    builtinPlugins.forEach(plugin => {
      registry.register(plugin);
    });
    
    return registry;
  }, [workspace.id]); // Recreate when workspace changes

  // Initialize MCP registry with workspace-aware tools, image tools, capability tools, and editor tools
  const mcpRegistry = useMemo(() => {
    const registry = new MCPRegistry();
    registry.registerMany(workspaceTools);
    registry.registerMany(imageTools);
    registry.registerMany(capabilityTools);
    registry.registerMany(editorTools);
    registry.registerMany(modelExecutionTools);
    
    // Also register tools from plugins
    const pluginTools = pluginRegistry.getAllTools();
    if (pluginTools.length > 0) {
      registry.registerMany(pluginTools);
    }
    
    return registry;
  }, [pluginRegistry]);

  // Create MCP context for tool execution
  const mcpContext = useMemo<MCPContext>(() => ({
    workspace,
    updateWorkspace: () => {}, // Not needed anymore, we use thread updates
    updateFile: onFileUpdate,
    deleteFile: onFileDelete,
    // File access for the file/context/ui MCP tools.
    files: workspace.files,
    activeFile: workspace.activeTabPath ?? null,
    setFiles: (files) => { Object.entries(files).forEach(([p, c]) => onFileUpdate(p, c)); },
    setActiveFile: () => {}, // Chat doesn't own tab state (mirrors updateWorkspace no-op)
    addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...msg,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      // Add to current thread
      if (activeThread) {
        onUpdateThread(activeThread.id, {
          messages: [...activeThread.messages, newMessage]
        });
      }
    },
    aiGatewayUrl: process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:3001',
    aiGatewayToken: undefined, // Will be set dynamically when tools are called
  }), [workspace, onFileUpdate, onFileDelete, activeThread, onUpdateThread]);

  const handleSend = async (content: string, mode: ChatMode = 'general', attachments?: import('@/types/workspace').FileAttachment[]) => {
    if (!activeThread) return;

    // Add user message to current thread
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachments, // Include file attachments
    };

    onUpdateThread(activeThread.id, {
      messages: [...activeThread.messages, userMessage]
    });

    setIsLoading(true);

    try {
      // Get access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Get MCP tool schemas - AI will handle ALL planning and execution via tools
      const toolSchemas = mcpRegistry.getSchemas();
      console.log('🔧 Available tools:', toolSchemas.map(t => t.function.name));
      console.log('📊 Total tools:', toolSchemas.length);

      // Create system message based on mode
      const systemMessage = mode === 'code' 
        ? { role: 'system' as const, content: `**🚨 CODE CREATION = TWO TOOL CALLS 🚨**

When generating ANY non-trivial code, you MUST call TWO tools in sequence:

**SEQUENCE:**
1️⃣ model_execute (Claude generates code)
2️⃣ workspace_write (YOU save it) ← **REQUIRED!**

**Example:**
[Call 1] model_execute({
  modelId: "anthropic/claude-3.5-sonnet",
  provider: "openrouter",
  input: { prompt: "Create React Button component. Return ONLY code." }
})

[Call 2] workspace_write({
  path: "components/Button.tsx",
  content: "<paste entire output from Call 1>"
})

**❌ WRONG:** Call model_execute, then just say "code generated"
**✅ RIGHT:** Call model_execute, THEN call workspace_write with the result

**IF YOU DON'T CALL workspace_write, NO FILE IS CREATED!**

Simple edits: workspace_write directly
Complex code: model_execute → workspace_write` }
        : mode === 'image'
        ? { role: 'system' as const, content: `You are an image generation assistant with direct image creation capabilities.

**Image Generation: FULLY AUTOMATIC**

**RECOMMENDED MODEL (use this by default):**
• image_generate({ prompt: "...", provider: "openrouter", model: "google/gemini-2.5-flash-image-preview" })

Alternative models:
• Replicate Flux: image_generate({ prompt: "...", provider: "replicate", model: "black-forest-labs/flux-schnell" })

When user asks to create an image:
1. Call image_generate with prompt + recommended model above
2. Tool automatically waits for completion
3. Tool automatically downloads and saves to workspace
4. DONE!

⚠️ IMPORTANT: 
• ALWAYS use google/gemini-2.5-flash-image-preview on openrouter
• Generated images remain visible in the conversation - you can see them!
• When user asks to modify "that image" or "make it pink", you can see what they're referring to
• To modify an image: generate a new one with the modified description

Just call the tool ONCE and it handles everything!` }
        : { role: 'system' as const, content: `You are a powerful AI assistant with DIRECT WRITE ACCESS to files and tools. When a user asks you to do something, DO IT IMMEDIATELY - don't explain what needs to be done.

**CRITICAL: BE ACTION-ORIENTED, NOT INSTRUCTIONAL**
❌ BAD: "To convert your components to Tailwind, we will replace the inline styles..."
✅ GOOD: Call workspace_list, read each component, modify it, write it back

**🚨🚨🚨 CRITICAL: ALWAYS SAVE CODE TO FILES! 🚨🚨🚨**

**YOU ARE NOT JUST EXPLAINING - YOU ARE CREATING FILES!**

When generating code, you MUST make TWO tool calls in sequence:
1️⃣ model_execute (generates code)
2️⃣ workspace_write (saves the code) ← **YOU MUST DO THIS!**

**EXAMPLE - User: "create a Three.js platformer"**

YOUR TOOL CALLS MUST BE:

[Call 1] model_execute({
  modelId: "anthropic/claude-3.5-sonnet",
  provider: "openrouter",
  input: { 
    prompt: "Create complete Three.js 2.5D platformer game code with player controls, platforms, and physics. Return ONLY the complete game.js code, no explanations."
  }
})

[Call 2] workspace_write({
  path: "game.js",
  content: "<paste the ENTIRE output from model_execute here>"
})

[Call 3] model_execute({
  modelId: "gfodor/text2vox",
  provider: "replicate",
  input: { prompt: "3D voxel model of a space cow character..." }
})

**❌ WRONG (what you're doing now):**
- Call model_execute
- Say "code has been generated" 
- Don't call workspace_write
- Result: NO FILES CREATED!

**✅ RIGHT:**
- Call model_execute
- IMMEDIATELY call workspace_write with the result
- Result: FILE APPEARS IN WORKSPACE!

**THE CODE FROM model_execute MUST GO INTO workspace_write!**
**IF YOU DON'T CALL workspace_write, THE FILE DOESN'T EXIST!**

**Content Generation - RECOMMENDED MODELS:**

→ For images: ALWAYS use image_generate (NOT model_execute!)
   **USE THIS:** image_generate({ prompt: "...", provider: "openrouter", model: "google/gemini-2.5-flash-image-preview" })
   
→ For code generation/transformation:
   **ALWAYS USE:** model_execute({ modelId: "anthropic/claude-3.5-sonnet", provider: "openrouter", input: { prompt: "..." } })
   **This is REQUIRED for any non-trivial code generation!**
   
→ For 3D models:
   model_execute({ modelId: "gfodor/text2vox", provider: "replicate", input: { prompt: "..." } })
   **Returns prediction ID immediately, model generates in background**
   Tell user: "⏳ 3D model generation started! This takes 2-5 minutes. I'll let you know when ready."
   **DO NOT call model_status repeatedly! User can check manually if needed.**
     
→ ⚠️ CRITICAL: 
   • Replicate (3D/video/audio) = ASYNC (minutes) - returns immediately with prediction ID
   • OpenRouter (code/chat) = SYNC (seconds) - waits and returns result
→ ACTUALLY GENERATE the content, don't just explain how

**🎯 Complex Multi-Step Tasks (games, apps with multiple files/assets):**

**ALWAYS START WITH capability_plan for complex projects!**

Example - User: "create a Three.js platformer with a space cow"
→ YOU:
  1. **FIRST, create a visual plan:**
     capability_plan({
       goal: "Create Three.js 2.5D platformer game with space cow character",
       steps: [
         {
           description: "Generate space cow 3D model",
           tool: "model_execute",
           arguments: {
             modelId: "gfodor/text2vox",
             provider: "replicate",
             input: { prompt: "space cow character..." }
           }
         },
         {
           description: "Generate game code with Claude",
           tool: "model_execute",
           arguments: {
             modelId: "anthropic/claude-3.5-sonnet",
             provider: "openrouter",
             input: { prompt: "Create complete Three.js platformer..." }
           }
         },
         {
           description: "Save game.js to workspace",
           tool: "workspace_write",
           arguments: { path: "game.js", content: "..." }
         }
       ]
     })
  2. **Then EXECUTE each step immediately!**

This creates a visual TODO list the user can see!

**Available Tools:**
• workspace_write, workspace_read, workspace_list, workspace_delete - File operations
• image_generate - Image generation (automatic: waits + saves)
• model_execute, model_status - Execute models (Replicate: 3D/audio/video, OpenRouter: chat/text)
• capability_discover - Find all available models and their parameters
• capability_plan - Create visual TODO lists for complex tasks
• And more editor and content tools

**REMEMBER: You have WRITE ACCESS to files AND access to ANY AI model. USE THEM. Don't describe, DO!**` };

      // 4. Call Hypery directly (client-side)
      const AI_GATEWAY_URL = process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:3001';
      const response = await fetch(`${AI_GATEWAY_URL}/api/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini', // Fast orchestrator - calls model_execute with Claude for code
          provider: 'openrouter',
          messages: [
            systemMessage,
            ...activeThread.messages.map(m => {
              // Format message with attachments for multi-modal support
              if (m.attachments && m.attachments.length > 0) {
                const contentParts: any[] = [];
                
                // Add text content
                if (m.content) {
                  contentParts.push({ type: 'text', text: m.content });
                }
                
                // Add file attachments
                for (const attachment of m.attachments) {
                  if (attachment.type === 'image' && attachment.dataUrl) {
                    // OpenAI/Anthropic vision format
                    contentParts.push({
                      type: 'image_url',
                      image_url: { url: attachment.dataUrl }
                    });
                  } else if (attachment.content) {
                    // Include text/code files as context
                    contentParts.push({
                      type: 'text',
                      text: `File: ${attachment.name}\n\`\`\`\n${attachment.content}\n\`\`\``
                    });
                  }
                }
                
                return {
                  role: m.role,
                  content: contentParts.length === 1 ? contentParts[0].text || contentParts[0] : contentParts
                };
              }
              
              return {
                role: m.role,
                content: m.content,
              };
            }),
            // Format user message with attachments
            (() => {
              if (userMessage.attachments && userMessage.attachments.length > 0) {
                const contentParts: any[] = [];
                
                if (userMessage.content) {
                  contentParts.push({ type: 'text', text: userMessage.content });
                }
                
                for (const attachment of userMessage.attachments) {
                  if (attachment.type === 'image' && attachment.dataUrl) {
                    contentParts.push({
                      type: 'image_url',
                      image_url: { url: attachment.dataUrl }
                    });
                  } else if (attachment.content) {
                    contentParts.push({
                      type: 'text',
                      text: `File: ${attachment.name}\n\`\`\`\n${attachment.content}\n\`\`\``
                    });
                  }
                }
                
                return {
                  role: userMessage.role,
                  content: contentParts.length === 1 ? contentParts[0].text || contentParts[0] : contentParts
                };
              }
              
              return { role: userMessage.role, content: userMessage.content };
            })()
          ],
          tools: toolSchemas,
          // Force tool usage in image/code modes, let AI decide in general mode
          tool_choice: mode === 'general' ? 'auto' : 'required',
        }),
      });

      if (!response.ok) {
        // Parse structured error response
        console.log('❌ [CHAT] Request failed with status:', response.status, response.statusText);
        const errorData = await response.json().catch((e) => {
          console.error('❌ [CHAT] Failed to parse error JSON:', e);
          return {};
        });
        
        console.log('📛 [CHAT] Full error response:', JSON.stringify(errorData, null, 2));
        
        // Check if it's a structured Hypery error
        if (errorData.error) {
          console.log('✅ [CHAT] Detected structured error, showing modal');
          console.log('📛 [CHAT] Error object:', JSON.stringify(errorData.error, null, 2));
          setRestrictionError(errorData.error as RestrictionError);
          return; // Exit early, modal will handle it
        }
        
        console.warn('⚠️ [CHAT] No structured error found, throwing generic error');
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      let aiMessage = data.choices[0].message;

      // 5. Execute tool calls in a loop (handling recursive tool calls)
      let toolResults: MCPToolExecution[] = [];
      let allToolResults: MCPToolExecution[] = [];
      let progressMessages: ChatMessage[] = [];
      let maxIterations = 5; // Prevent infinite loops
      let iteration = 0;

      // Build the message list incrementally
      let currentMessages = [...activeThread.messages, userMessage];

      while (aiMessage.tool_calls && aiMessage.tool_calls.length > 0 && iteration < maxIterations) {
        iteration++;
        console.log(`🔧 Iteration ${iteration}: Executing ${aiMessage.tool_calls.length} tool calls...`);
        
        const toolCalls = aiMessage.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));

        // Show which tools are being executed
        const toolNames = toolCalls.map((tc: any) => tc.name).join(', ');
        const progressMessage: ChatMessage = {
          id: `progress-${Date.now()}-${iteration}`,
          role: 'assistant',
          content: `▶️ Running: ${toolNames}...`,
          timestamp: new Date().toISOString(),
        };
        
        progressMessages.push(progressMessage);
        currentMessages = [...activeThread.messages, userMessage, ...progressMessages];
        
        // Show progress in chat
        onUpdateThread(activeThread.id, {
          messages: currentMessages
        });

        // Inject access token into context for API calls
        const contextWithToken = {
          ...mcpContext,
          aiGatewayToken: accessToken,
        };

        toolResults = await mcpRegistry.executeMany(toolCalls, contextWithToken);
        allToolResults.push(...toolResults);
        
        console.log('✅ Tool execution complete:', toolResults);

        // Update last message with completion status
        const completionSummary = toolResults.map(tr => 
          `${tr.result.isError ? '❌' : '✅'} ${tr.call.name}`
        ).join('\n');
        
        progressMessages[progressMessages.length - 1] = {
          ...progressMessage,
          content: completionSummary,
          toolResults: toolResults,
        };
        
        currentMessages = [...activeThread.messages, userMessage, ...progressMessages];
        
        // Update chat with completed status
        onUpdateThread(activeThread.id, {
          messages: currentMessages
        });

        // Check if capability_plan was called and returned a task
        const planResult = toolResults.find(tr => tr.call.name === 'capability_plan');
        if (planResult && !planResult.result.isError) {
          const result = planResult.result as any;
          if (result.task) {
            console.log('📋 Task plan created, saving to thread...');
            onUpdateThread(activeThread.id, {
              currentTask: result.task
            });
          }
        }

        // Update task step statuses if we have an active task
        if (activeThread.currentTask) {
          const updatedTask = { ...activeThread.currentTask };
          let taskChanged = false;

          // Mark steps as completed if their tools were executed
          toolResults.forEach(tr => {
            const step = updatedTask.steps.find((s: any) => 
              s.tool === tr.call.name && s.status !== 'completed'
            );
            if (step) {
              step.status = tr.result.isError ? 'failed' : 'completed';
              if (tr.result.isError) {
                step.error = tr.result.content[0]?.message || 'Unknown error';
              } else {
                step.result = tr.result;
              }
              taskChanged = true;
              console.log(`✅ Step "${step.description}" marked as ${step.status}`);
            }
          });

          // Check if all steps are completed
          const allCompleted = updatedTask.steps.every((s: any) => 
            s.status === 'completed' || s.status === 'failed'
          );
          if (allCompleted && updatedTask.status !== 'completed') {
            updatedTask.status = 'completed';
            updatedTask.completedAt = new Date();
            taskChanged = true;
            console.log('🎉 All task steps completed!');
          }

          if (taskChanged) {
            onUpdateThread(activeThread.id, {
              currentTask: updatedTask
            });
          }
        }

        // 6. Send tool results back to AI for next response
        console.log('📤 Sending tool results back to AI...');
        console.log('Tool results:', toolResults.map(tr => ({
          tool: tr.call.name,
          success: !tr.result.isError,
          result: tr.result
        })));

        // Build conversation history with all tool calls and results so far
        const conversationHistory = [
          systemMessage,
          ...activeThread.messages.map(m => {
            // Include generated images from tool results in conversation history
            if (m.role === 'assistant' && m.toolResults) {
              const imageResults = m.toolResults.filter((tr: any) => 
                tr.call.name === 'image_generate' && (tr.result as any).imageUrl
              );
              
              if (imageResults.length > 0) {
                // Build multi-modal content with text + images
                const contentParts: any[] = [];
                
                if (m.content) {
                  contentParts.push({ type: 'text', text: m.content });
                }
                
                for (const result of imageResults) {
                  const resultData = result.result as any;
                  contentParts.push({
                    type: 'image_url',
                    image_url: { url: resultData.imageUrl }
                  });
                }
                
                return {
                  role: m.role,
                  content: contentParts
                };
              }
            }
            
            return {
              role: m.role,
              content: m.content,
            };
          }),
          { role: userMessage.role, content: userMessage.content },
        ];

        // Add all previous tool calls and results
        for (const result of allToolResults) {
          // Find the assistant message that made this tool call
          const assistantMsg = conversationHistory.find((msg: any) => 
            msg.tool_calls?.some((tc: any) => tc.id === result.call.id)
          );
          
          if (!assistantMsg) {
            // Add assistant message with tool calls
            conversationHistory.push({
              role: 'assistant',
              content: '',
              tool_calls: [{
                id: result.call.id,
                type: 'function',
                function: {
                  name: result.call.name,
                  arguments: JSON.stringify(result.call.arguments)
                }
              }]
            } as any);
          }
          
          // Add tool result - properly format the content for AI to understand
          let toolResultContent: any;
          if (result.result.isError) {
            // For errors, include full context
            toolResultContent = JSON.stringify({
              error: true,
              message: result.result.content,
            });
          } else if (result.call.name === 'image_generate' && (result.result as any).imageUrl) {
            // SPECIAL CASE: For image generation, include the image visually
            // This allows the AI to "see" the image in subsequent messages
            const resultData = result.result as any;
            toolResultContent = [
              {
                type: 'text',
                text: `Successfully generated image and saved to workspace as ${resultData.filepath || 'image.png'}`
              },
              {
                type: 'image_url',
                image_url: { url: resultData.imageUrl }
              }
            ];
          } else if (result.result.content && Array.isArray(result.result.content)) {
            // For MCP-style content array, extract the text/message
            const textContent = result.result.content
              .map((c: any) => c.text || c.message || '')
              .filter(Boolean)
              .join('\n');
            toolResultContent = textContent || JSON.stringify(result.result);
          } else if (typeof result.result.content === 'string') {
            // For string content
            toolResultContent = result.result.content;
          } else {
            // For other formats, stringify the whole result
            toolResultContent = JSON.stringify(result.result);
          }
          
          conversationHistory.push({
            role: 'tool',
            tool_call_id: result.call.id,
            name: result.call.name,
            content: toolResultContent
          } as any);
        }

        // Debug: Log what we're sending to AI
        console.log('📤 Sending to AI (iteration ' + iteration + '):');
        console.log('  - Messages:', conversationHistory.length);
        console.log('  - Last 3 messages:', conversationHistory.slice(-3).map((m: any) => {
          let contentPreview: any;
          if (typeof m.content === 'string') {
            contentPreview = m.content.substring(0, 100);
          } else if (Array.isArray(m.content)) {
            contentPreview = `[${m.content.length} parts: ${m.content.map((p: any) => p.type).join(', ')}]`;
          } else {
            contentPreview = m.content;
          }
          
          return {
            role: m.role,
            content: contentPreview,
            tool_call_id: m.tool_call_id,
            name: m.name,
          };
        }));

        const followUpResponse = await fetch(`${AI_GATEWAY_URL}/api/v1/chat/completions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            provider: 'openrouter',
            messages: conversationHistory,
            tools: toolSchemas,
            tool_choice: 'auto',
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          aiMessage = followUpData.choices[0].message;
          console.log(`💬 AI response (iteration ${iteration}):`, aiMessage.content);
          console.log('🔧 More tool calls?', aiMessage.tool_calls?.length || 0);
          
          // Loop continues if there are more tool calls
        } else {
          // Parse structured error for follow-up requests too
          console.log('❌ [CHAT] Follow-up request failed:', followUpResponse.status);
          const errorData = await followUpResponse.json().catch(() => ({}));
          
          console.log('📛 [CHAT] Follow-up error response:', JSON.stringify(errorData, null, 2));
          
          if (errorData.error) {
            console.log('⚠️ [CHAT] Detected structured error in follow-up (after tools succeeded)');
            console.log('📛 [CHAT] Follow-up error object:', JSON.stringify(errorData.error, null, 2));
            console.log('ℹ️  [CHAT] Tools already executed successfully, not showing modal for follow-up failure');
            // Tools already succeeded - don't show modal, just stop the loop
            // The user got their result (image/code/etc), we just can't send it back to AI
            break;
          }
          
          const errorText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
          console.error('Follow-up request failed:', {
            status: followUpResponse.status,
            statusText: followUpResponse.statusText,
            error: errorText
          });
          break;
        }
      }

      console.log(`✅ Tool execution loop complete after ${iteration} iterations`);
      console.log(`📊 Total tools executed: ${allToolResults.length}`);
      console.log(`💬 Final AI message content:`, aiMessage.content);

      // 7. Add final assistant message with extracted image IDs
      const imageIds: string[] = [];
      
      // Extract image IDs from ALL tool results
      allToolResults.forEach(tr => {
        if (tr.call.name === 'image_generate' && tr.result.content) {
          tr.result.content.forEach((c: any) => {
            if (c.type === 'text' && c.text) {
              // Extract image ID from text like "🆔 Image ID: 68f4a26f..."
              const match = c.text.match(/Image ID:\s*([a-f0-9]{24})/i);
              if (match) {
                imageIds.push(match[1]);
              }
            }
          });
        }
      });

      // Build final content from AI response or tool results
      let finalContent = aiMessage.content || '';
      
      // If AI didn't provide content but tools executed, show completion message
      if (!finalContent && allToolResults.length > 0) {
        finalContent = `✅ Completed ${allToolResults.length} tool${allToolResults.length > 1 ? 's' : ''}`;
      }
      
      // Always show something to the user
      if (!finalContent) {
        finalContent = 'Done!';
      }

      console.log(`📝 Final message content:`, finalContent);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        toolResults: allToolResults.length > 0 ? allToolResults : undefined,
        imageIds: imageIds.length > 0 ? imageIds : undefined,
        timestamp: new Date().toISOString(),
      };

      console.log(`📤 Adding final message to thread:`, {
        messageId: assistantMessage.id,
        content: assistantMessage.content.substring(0, 100),
        hasToolResults: !!assistantMessage.toolResults,
        currentMessagesCount: currentMessages.length,
      });

      // Update thread with final assistant response
      const finalMessages = [...currentMessages, assistantMessage];
      console.log(`📊 Final message count:`, finalMessages.length);
      console.log(`📊 Message breakdown:`, {
        total: finalMessages.length,
        user: finalMessages.filter(m => m.role === 'user').length,
        assistant: finalMessages.filter(m => m.role === 'assistant').length,
        lastMessage: finalMessages[finalMessages.length - 1],
      });
      
      onUpdateThread(activeThread.id, {
        messages: finalMessages
      });
      
      console.log('✅ Thread update called successfully');
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      onUpdateThread(activeThread.id, {
        messages: [...activeThread.messages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeThread) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-tertiary)] space-y-4">
        <p>No active chat thread.</p>
        <button
          onClick={() => {
            const thread = onCreateThread('Main Chat');
            if (thread) {
              onSwitchThread(thread.id);
            }
          }}
          className="ide-btn ide-btn-primary"
        >
          Create Your First Chat
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-[var(--bg-primary)]">
        {/* Chat Thread Selector */}
        {workspace.chatThreads && (
          <ChatThreadSelector
            threads={workspace.chatThreads}
            activeThreadId={workspace.activeChatId}
            onSwitch={onSwitchThread}
            onCreate={onCreateThread}
            onDelete={onDeleteThread}
          />
        )}

        {/* Task Progress (if AI created a plan via capability_plan tool) */}
        {activeThread.currentTask && (
          <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2">
            <TaskProgress task={activeThread.currentTask} />
          </div>
        )}
        
        <MessageList messages={activeThread.messages} pluginRegistry={pluginRegistry} />
        <ChatInput 
          onSend={handleSend} 
          disabled={isLoading}
          workspaceFiles={workspace.files}
        />
      </div>

      {/* Restriction Modal - CONNECTED to Hypery */}
      <RestrictionModal
        error={restrictionError}
        appId={process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!}
        gatewayUrl={process.env.NEXT_PUBLIC_GATEWAY_HUB_URL || 'http://localhost:3001'}
        getAccessToken={getAccessToken}
        onClose={() => setRestrictionError(null)}
        onRetry={() => {
          // Clear error and user can try sending message again
          setRestrictionError(null);
        }}
        // These are now handled internally by the modal using fetched data
      />
    </>
  );
}
