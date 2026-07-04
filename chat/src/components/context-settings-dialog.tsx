'use client';

import { useState, useEffect } from 'react';
import { Settings, Info } from 'lucide-react';

interface ContextSettings {
  contextMode: 'auto' | 'manual' | 'unlimited';
  maxMessagesToSend: number;
  maxTokensToSend: number;
  enableSummarization: boolean;
  summaryTriggerMessageCount: number;
  keepRecentMessages: number;
  preferCaching: boolean;
  aggressiveCompression: boolean;
}

interface ModelLimits {
  maxContextTokens: number;
  recommendedContextTokens: number;
  supportsLongContext: boolean;
}

interface ContextSettingsDialogProps {
  accessToken: string;
  currentModel: string;
  chatId?: string;
  onSettingsChange?: (settings: ContextSettings) => void;
}

export function ContextSettingsDialog({
  accessToken,
  currentModel,
  chatId,
  onSettingsChange,
}: ContextSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ContextSettings | null>(null);
  const [modelLimits, setModelLimits] = useState<ModelLimits | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, currentModel]);

  const fetchSettings = async () => {
    try {
      const url = chatId 
        ? `${API_URL.replace('/v1', '')}/chat/context-settings?chatId=${chatId}&model=${currentModel}`
        : `${API_URL.replace('/v1', '')}/chat/context-settings?model=${currentModel}`;
        
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data.settings);
        setModelLimits(data.data.modelLimits);
      }
    } catch (error) {
      console.error('Failed to fetch context settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL.replace('/v1', '')}/chat/context-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...settings,
          chatId,
        }),
      });

      if (response.ok) {
        onSettingsChange?.(settings);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to save context settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Context Settings"
      >
        <Settings className="h-5 w-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Context Window Settings</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Configure how much conversation history to send with each request
          </p>
        </div>

        {settings && (
          <div className="p-6 space-y-6">
            {/* Model Info */}
            {modelLimits && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Model: {currentModel}</p>
                    <p className="text-sm text-blue-700">
                      Max context: {modelLimits.maxContextTokens.toLocaleString()} tokens
                    </p>
                    <p className="text-sm text-blue-700">
                      Recommended: {modelLimits.recommendedContextTokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Context Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Context Mode</label>
              <select
                value={settings.contextMode}
                onChange={(e) => setSettings({ ...settings, contextMode: e.target.value as any })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="manual">Manual</option>
                <option value="unlimited">Unlimited (Send all messages)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Auto mode intelligently manages context based on model and conversation length
              </p>
            </div>

            {/* Max Messages */}
            {settings.contextMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Messages to Send (0 = auto)
                </label>
                <input
                  type="number"
                  value={settings.maxMessagesToSend}
                  onChange={(e) => setSettings({ ...settings, maxMessagesToSend: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit how many messages are sent. 0 = automatic based on token limit
                </p>
              </div>
            )}

            {/* Max Tokens */}
            {settings.contextMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens to Send (0 = model default)
                </label>
                <input
                  type="number"
                  value={settings.maxTokensToSend}
                  onChange={(e) => setSettings({ ...settings, maxTokensToSend: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  max={modelLimits?.maxContextTokens || 100000}
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit total tokens sent. Recommended: {modelLimits?.recommendedContextTokens.toLocaleString() || '8000'}
                </p>
              </div>
            )}

            {/* Summarization */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableSummarization}
                  onChange={(e) => setSettings({ ...settings, enableSummarization: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Enable Auto-Summarization</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Automatically summarize old messages to reduce token usage
              </p>
            </div>

            {settings.enableSummarization && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Summarizing After (messages)
                  </label>
                  <input
                    type="number"
                    value={settings.summaryTriggerMessageCount}
                    onChange={(e) => setSettings({ ...settings, summaryTriggerMessageCount: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    min="5"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When conversation exceeds this length, older messages will be summarized
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Keep Recent Messages (unsummarized)
                  </label>
                  <input
                    type="number"
                    value={settings.keepRecentMessages}
                    onChange={(e) => setSettings({ ...settings, keepRecentMessages: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    min="5"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Always keep the last N messages in full (not summarized)
                  </p>
                </div>
              </>
            )}

            {/* Advanced Options */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Advanced Options</h3>
              
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={settings.preferCaching}
                  onChange={(e) => setSettings({ ...settings, preferCaching: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Prefer Prompt Caching (when available)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.aggressiveCompression}
                  onChange={(e) => setSettings({ ...settings, aggressiveCompression: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Aggressive Compression (more summarization)</span>
              </label>
            </div>

            {/* Cost Impact */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Estimated Impact</h4>
              <div className="text-sm text-green-800 space-y-1">
                {settings.enableSummarization && (
                  <p>✅ Summarization: ~60-80% token reduction on long conversations</p>
                )}
                {settings.preferCaching && (
                  <p>✅ Prompt Caching: ~50-90% cost reduction on repeated context</p>
                )}
                {settings.contextMode === 'unlimited' && (
                  <p>⚠️ Unlimited mode: Higher costs for long conversations</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
