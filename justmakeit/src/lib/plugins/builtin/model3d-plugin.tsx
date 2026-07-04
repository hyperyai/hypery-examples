/**
 * 3D Model Viewer Plugin
 * Handles 3D model display using Three.js/React Three Fiber (when installed)
 */

'use client';

import React, { useState } from 'react';
import { Box, RotateCw, Maximize2, Download } from 'lucide-react';
import type { ViewerPlugin, ViewerComponentProps } from '../types';

/**
 * 3D Model Viewer Component
 * 
 * Note: This is a placeholder that would use React Three Fiber
 * Install: npm install @react-three/fiber @react-three/drei three
 */
function Model3DViewer({ url, contentId, metadata, onLoad, onError }: ViewerComponentProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="bg-gray-900 rounded-lg border border-[var(--border-secondary)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Box className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">3D Model Viewer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1 rounded ${autoRotate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Auto Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-400 hover:bg-gray-700 rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <a
            href={url}
            download
            className="p-1 text-gray-400 hover:bg-gray-700 rounded"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3D Canvas (Placeholder) */}
      <div className="relative w-full h-[400px] bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
        {/* This would be replaced with React Three Fiber Canvas */}
        <div className="text-center space-y-4">
          <Box className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
          <div className="text-white">
            <div className="font-medium">3D Model Viewer</div>
            <div className="text-sm text-gray-400 mt-1">
              Install React Three Fiber to view 3D models
            </div>
            <div className="text-xs text-gray-500 mt-2">
              npm install @react-three/fiber @react-three/drei three
            </div>
          </div>
          
          {/* Show model info */}
          <div className="text-xs text-gray-400 mt-4 space-y-1">
            <div>Model: {url.split('/').pop()}</div>
            {metadata?.format && <div>Format: {metadata.format}</div>}
          </div>
        </div>

        {/* Future: React Three Fiber Canvas would go here */}
        {/*
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Model url={url} rotation={rotation} autoRotate={autoRotate} />
          <OrbitControls />
        </Canvas>
        */}
      </div>

      {/* Controls */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-gray-400">
            <div className="font-medium mb-1">Rotation</div>
            <div>X: {rotation.x}° Y: {rotation.y}° Z: {rotation.z}°</div>
          </div>
          <div className="text-gray-400">
            <div className="font-medium mb-1">Controls</div>
            <div>Left click: Rotate</div>
            <div>Right click: Pan</div>
          </div>
          <div className="text-gray-400">
            <div className="font-medium mb-1">Zoom</div>
            <div>Scroll wheel</div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="p-3 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 space-y-1">
          {metadata.prompt && <div><strong>Prompt:</strong> {metadata.prompt}</div>}
          {metadata.model && <div><strong>Model:</strong> {metadata.model}</div>}
          {metadata.format && <div><strong>Format:</strong> {metadata.format}</div>}
          {metadata.polyCount && <div><strong>Polygons:</strong> {metadata.polyCount.toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * 3D Model Viewer Plugin
 */
export const model3DViewerPlugin: ViewerPlugin = {
  id: '3d-model-viewer',
  name: '3D Model Viewer',
  description: 'View 3D models with rotation and zoom controls',
  version: '1.0.0',
  contentTypes: ['3d-model', 'text-to-3d'],
  capabilities: ['viewer'],
  ViewerComponent: Model3DViewer,
  supportedExtensions: ['.glb', '.gltf', '.obj', '.fbx', '.stl'],
  canHandle: (url: string, contentType: string) => {
    return contentType === '3d-model' || contentType === 'text-to-3d' ||
           /\.(glb|gltf|obj|fbx|stl)$/i.test(url);
  },
};

