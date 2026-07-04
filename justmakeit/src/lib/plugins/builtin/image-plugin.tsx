/**
 * Image Viewer/Editor Plugin
 * Handles image display and basic editing operations
 */

'use client';

import React, { useState } from 'react';
import { Download, Edit, Eye, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { ViewerPlugin, EditorPlugin, ViewerComponentProps, EditorComponentProps, ContentData, EditorOperation } from '../types';

/**
 * Image Viewer Component
 */
function ImageViewer({ url, contentId, metadata, onLoad, onError, actions }: ViewerComponentProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border border-[var(--border-secondary)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-white border-b border-[var(--border-secondary)]">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Image Viewer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="p-1 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {actions?.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              title={action.label}
            >
              {action.icon || action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="flex items-center justify-center p-4 min-h-[200px] bg-gray-50">
        <img
          src={url}
          alt={metadata?.prompt || 'Generated image'}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
          className="max-w-full rounded-lg shadow-md"
          onLoad={onLoad}
          onError={(e) => onError?.(new Error('Failed to load image'))}
        />
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="p-3 bg-white border-t border-[var(--border-secondary)] text-xs text-gray-600 space-y-1">
          {metadata.prompt && <div><strong>Prompt:</strong> {metadata.prompt}</div>}
          {metadata.model && <div><strong>Model:</strong> {metadata.model}</div>}
          {metadata.width && metadata.height && (
            <div><strong>Dimensions:</strong> {metadata.width} × {metadata.height}</div>
          )}
          {metadata.cost !== undefined && <div><strong>Cost:</strong> ${metadata.cost.toFixed(4)}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Image Editor Component (placeholder for now)
 */
function ImageEditor({ url, content, onChange, operations, onExecuteOperation }: EditorComponentProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-[var(--border-secondary)] overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex items-center space-x-2">
          <Edit className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Image Editor</span>
        </div>
      </div>
      
      <ImageViewer url={url} metadata={content.metadata} />
      
      {operations && operations.length > 0 && (
        <div className="p-3 bg-white border-t">
          <div className="text-xs font-medium text-gray-700 mb-2">Available Operations:</div>
          <div className="flex flex-wrap gap-1">
            {operations.slice(0, 5).map(op => (
              <button
                key={op.id}
                onClick={() => onExecuteOperation?.(op.id, {})}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                {op.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Image editing operations
 */
const imageOperations: EditorOperation[] = [
  {
    id: 'resize',
    name: 'Resize',
    description: 'Change image dimensions',
    icon: '↔️',
    category: 'transform',
    parameters: [
      { id: 'width', name: 'Width', type: 'number', default: 512 },
      { id: 'height', name: 'Height', type: 'number', default: 512 },
    ],
  },
  {
    id: 'crop',
    name: 'Crop',
    description: 'Cut out a portion of the image',
    icon: '✂️',
    category: 'transform',
  },
  {
    id: 'rotate',
    name: 'Rotate',
    description: 'Rotate the image',
    icon: '🔄',
    category: 'transform',
    parameters: [
      { id: 'angle', name: 'Angle', type: 'number', default: 90, min: 0, max: 360 },
    ],
  },
  {
    id: 'brightness',
    name: 'Brightness',
    description: 'Adjust image brightness',
    icon: '☀️',
    category: 'adjust',
    parameters: [
      { id: 'value', name: 'Value', type: 'range', default: 0, min: -100, max: 100 },
    ],
  },
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Adjust image contrast',
    icon: '◐',
    category: 'adjust',
    parameters: [
      { id: 'value', name: 'Value', type: 'range', default: 0, min: -100, max: 100 },
    ],
  },
  {
    id: 'blur',
    name: 'Blur',
    description: 'Apply blur effect',
    icon: '🌫️',
    category: 'filter',
    parameters: [
      { id: 'radius', name: 'Radius', type: 'range', default: 5, min: 0, max: 50 },
    ],
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Convert to black and white',
    icon: '⚫',
    category: 'filter',
  },
  {
    id: 'remove-background',
    name: 'Remove Background',
    description: 'Remove image background using AI',
    icon: '🎭',
    category: 'remove',
    requiresAI: true,
  },
  {
    id: 'upscale',
    name: 'Upscale',
    description: 'Increase resolution using AI',
    icon: '⬆️',
    category: 'transform',
    requiresAI: true,
    parameters: [
      { id: 'scale', name: 'Scale', type: 'select', default: 2, options: [
        { label: '2x', value: 2 },
        { label: '4x', value: 4 },
      ]},
    ],
  },
];

/**
 * Image Viewer Plugin
 */
export const imageViewerPlugin: ViewerPlugin = {
  id: 'image-viewer',
  name: 'Image Viewer',
  description: 'View images with zoom and pan controls',
  version: '1.0.0',
  contentTypes: ['image', 'text-to-image'],
  capabilities: ['viewer'],
  ViewerComponent: ImageViewer,
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  canHandle: (url: string, contentType: string) => {
    return contentType === 'image' || contentType === 'text-to-image' || 
           /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  },
};

/**
 * Image Editor Plugin
 */
export const imageEditorPlugin: EditorPlugin = {
  id: 'image-editor',
  name: 'Image Editor',
  description: 'Edit images with filters, adjustments, and AI tools',
  version: '1.0.0',
  contentTypes: ['image', 'text-to-image'],
  capabilities: ['editor', 'transformer'],
  EditorComponent: ImageEditor,
  operations: imageOperations,
  executeOperation: async (operation, parameters, content) => {
    // This would call the API to perform the operation
    console.log('Executing image operation:', operation, parameters);
    
    // For now, return unchanged content
    // In real implementation, this would call /api/v1/images/modify
    return content;
  },
};

