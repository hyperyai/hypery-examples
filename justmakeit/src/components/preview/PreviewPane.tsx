/**
 * Preview Pane Component
 * Displays running web applications from WebContainer
 */

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, X } from 'lucide-react';

interface PreviewPaneProps {
  previewUrl: string | null;
  onClose?: () => void;
}

export function PreviewPane({ previewUrl, onClose }: PreviewPaneProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when URL changes
  useEffect(() => {
    setIsLoading(true);
  }, [previewUrl]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (!previewUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-tertiary)]">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-xl font-semibold">No Preview Available</p>
          <p className="text-sm max-w-md">
            Start a development server in the terminal to see a live preview here.
          </p>
          <p className="text-xs text-[var(--text-disabled)] max-w-md mt-4">
            Example: <code className="bg-[var(--bg-secondary)] px-2 py-1 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Preview Header */}
      <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-[var(--text-tertiary)] font-mono truncate max-w-md">
            {previewUrl}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-[var(--border-primary)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ide-transition"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 hover:bg-[var(--border-primary)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ide-transition"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--border-primary)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ide-transition"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--border-focus)] mx-auto" />
              <p className="text-sm text-[var(--text-tertiary)]">Loading preview...</p>
            </div>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="w-full h-full border-0 bg-[var(--bg-secondary)]"
          title="App Preview"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  );
}

