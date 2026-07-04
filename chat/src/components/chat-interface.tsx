'use client';

import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { fetchChat, saveMessage, fetchModels } from '@/lib/openai-client';
import { Send, Settings, Loader2, Bot, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
}

interface Props {
  client: OpenAI;
  apiKey: string;
  chatId: string;
  onChatUpdate: () => void;
}

export function ChatInterface({ client, apiKey, chatId, onChatUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Load from localStorage or default to Claude 3.5 Sonnet
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_selected_model') || 'anthropic/claude-3.5-sonnet';
    }
    return 'anthropic/claude-3.5-sonnet';
  });
  const [models, setModels] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      if (!cancelled) {
        await Promise.all([loadChat(), loadModels()]);
      }
    };
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      setIsLoadingChat(true);
      const chat = await fetchChat(apiKey, chatId);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const loadModels = async () => {
    try {
      const data = await fetchModels(apiKey);
      const loadedModels = data.data || [];
      setModels(loadedModels);
      
      // Verify selected model exists, otherwise use default
      const modelExists = loadedModels.some((m: any) => m.id === selectedModel);
      if (!modelExists && loadedModels.length > 0) {
        // Try to find Claude 3.5 Sonnet
        const claudeModel = loadedModels.find((m: any) => m.id === 'anthropic/claude-3.5-sonnet');
        const defaultModel = claudeModel?.id || loadedModels[0]?.id || 'anthropic/claude-3.5-sonnet';
        setSelectedModel(defaultModel);
        if (typeof window !== 'undefined') {
          localStorage.setItem('chat_selected_model', defaultModel);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Save user message
    try {
      await saveMessage(apiKey, chatId, userMessage);
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Add empty assistant message for streaming
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMessage]);

    try {
      const stream = await client.chat.completions.create({
        model: selectedModel,
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        temperature,
        max_tokens: maxTokens,
      });

      let accumulatedContent = '';
      let reasoning = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          accumulatedContent += delta.content;
          setMessages([
            ...newMessages,
            { role: 'assistant', content: accumulatedContent, reasoning },
          ]);
        }

        // Handle reasoning for o1 models
        if ((delta as any)?.reasoning) {
          reasoning += (delta as any).reasoning;
        }
      }

      // Save assistant message
      try {
        await saveMessage(apiKey, chatId, {
          role: 'assistant',
          content: accumulatedContent,
          reasoning,
          metadata: {
            model: selectedModel,
          },
        });
        onChatUpdate();
      } catch (error) {
        console.error('Failed to save assistant message:', error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove empty assistant message on error
      setMessages(newMessages);
      
      // Show error message in UI instead of blocking alert
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response'}. Please try again.` 
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Select 
            value={selectedModel} 
            onValueChange={(value) => {
              setSelectedModel(value);
              // Save to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('chat_selected_model', value);
              }
            }}
          >
            <SelectTrigger className="w-full max-w-[280px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{model.name}</span>
                    {model.contextLength && (
                      <span className="text-xs text-muted-foreground">
                        {model.contextLength.toLocaleString()} token context
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-8 sm:h-auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-8 sm:h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 px-4">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm sm:text-base">Start a conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 sm:gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-[85%] sm:max-w-[80%] lg:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{msg.content}</p>
                {msg.reasoning && (
                  <details className="mt-2 text-xs sm:text-sm opacity-70">
                    <summary className="cursor-pointer">Reasoning</summary>
                    <p className="mt-1 whitespace-pre-wrap">{msg.reasoning}</p>
                  </details>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-[120px] text-sm sm:text-base"
            disabled={isLoading}
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="min-w-[44px] min-h-[44px] px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

