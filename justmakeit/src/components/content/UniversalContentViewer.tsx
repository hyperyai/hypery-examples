/**
 * Universal Content Viewer
 * Automatically selects and renders the appropriate viewer based on content type
 */

'use client';

import React from 'react';
import { AlertCircle, FileQuestion } from 'lucide-react';
import type { PluginRegistry } from '@/lib/plugins/registry';
import type { ContentView } from '@/lib/plugins/types';

interface UniversalContentViewerProps {
  /** Content to display */
  contentView: ContentView;
  
  /** Plugin registry */
  pluginRegistry: PluginRegistry;
  
  /** Callback when content loads */
  onLoad?: () => void;
  
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Universal Content Viewer Component
 * 
 * This component automatically finds and renders the appropriate
 * viewer/editor plugin based on the content type
 */
export function UniversalContentViewer({
  contentView,
  pluginRegistry,
  onLoad,
  onError,
}: UniversalContentViewerProps) {
  const { type, url, id, mode, metadata } = contentView;

  // Find appropriate plugin
  const plugin = mode === 'edit'
    ? pluginRegistry.findEditorForContent(type)
    : pluginRegistry.findViewerForContent(url || '', type);

  // No plugin found
  if (!plugin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
        <FileQuestion className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-yellow-900">No viewer available</div>
          <div className="text-sm text-yellow-700 mt-1">
            No plugin found for content type: <code className="font-mono bg-yellow-100 px-1 rounded">{type}</code>
          </div>
          <div className="text-xs text-yellow-600 mt-2">
            To add support for this content type, create a plugin that handles "{type}"
          </div>
        </div>
      </div>
    );
  }

  // No URL provided
  if (!url && mode === 'view') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-blue-900">Content loading...</div>
          <div className="text-sm text-blue-700 mt-1">
            {metadata?.isNew ? 'Creating new content...' : 'Waiting for content URL...'}
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate component
  try {
    if (mode === 'edit' && 'EditorComponent' in plugin) {
      const EditorComponent = plugin.EditorComponent;
      return (
        <EditorComponent
          url={url || ''}
          contentId={id}
          content={{
            type,
            url: url || undefined,
            metadata,
          }}
          metadata={metadata}
          onLoad={onLoad}
          onError={onError}
          operations={plugin.operations}
        />
      );
    } else if ('ViewerComponent' in plugin) {
      const ViewerComponent = plugin.ViewerComponent;
      return (
        <ViewerComponent
          url={url || ''}
          contentId={id}
          metadata={metadata}
          onLoad={onLoad}
          onError={onError}
        />
      );
    }
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-red-900">Error rendering content</div>
          <div className="text-sm text-red-700 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Content Comparison Viewer
 * Shows two pieces of content side by side
 */
export function ContentComparisonViewer({
  contentViews,
  pluginRegistry,
}: {
  contentViews: [ContentView, ContentView];
  pluginRegistry: PluginRegistry;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {contentViews.map((view, index) => (
        <div key={index} className="space-y-2">
          {view.metadata?.label && (
            <div className="text-sm font-medium text-gray-700">
              {view.metadata.label}
            </div>
          )}
          <UniversalContentViewer
            contentView={view}
            pluginRegistry={pluginRegistry}
          />
        </div>
      ))}
    </div>
  );
}

