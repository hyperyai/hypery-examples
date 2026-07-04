/**
 * Tool Call Display Component
 * Shows tool executions in chat messages with smart content preview
 */

'use client';

import type { MCPToolExecution } from '@/lib/mcp/registry';

interface ToolCallDisplayProps {
  executions: MCPToolExecution[];
}

// Extract media content from tool result
function extractMediaContent(exec: MCPToolExecution): { 
  type: 'image' | '3d' | 'audio' | 'video' | null; 
  url: string; 
  filepath?: string;
} | null {
  // Check result for URLs and filepaths
  const result = exec.result as any; // Type cast for dynamic properties
  
  // Image from image_generate tool
  if (exec.call.name === 'image_generate' && result.imageUrl) {
    return { type: 'image', url: result.imageUrl, filepath: result.filepath };
  }
  
  // 3D model from model_execute
  if (result.output && typeof result.output === 'string') {
    const url = result.output;
    if (url.endsWith('.glb') || url.endsWith('.gltf') || url.endsWith('.vox')) {
      return { type: '3d', url };
    }
    if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp')) {
      return { type: 'image', url };
    }
    if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg')) {
      return { type: 'audio', url };
    }
    if (url.endsWith('.mp4') || url.endsWith('.webm')) {
      return { type: 'video', url };
    }
  }
  
  return null;
}

// Extract user-friendly summary from verbose text
function extractSummary(text: string): string {
  // Remove emojis and verbose details, keep essential info
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('🖼️') && 
           !trimmed.startsWith('📝') &&
           !trimmed.startsWith('🤖') &&
           !trimmed.startsWith('🔗') &&
           !trimmed.startsWith('🆔');
  });
  
  return lines[0] || text.split('\n')[0] || text;
}

export function ToolCallDisplay({ executions }: ToolCallDisplayProps) {
  if (executions.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {executions.map((exec, idx) => {
        const media = extractMediaContent(exec);
        
        return (
          <div key={idx} className="space-y-2">
            {/* Media Preview - Show content first */}
            {media && (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                {media.type === 'image' && (
                  <img 
                    src={media.url} 
                    alt={media.filepath || 'Generated image'} 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                )}
                {media.type === '3d' && (
                  <div className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-700 mb-2">🎨 3D Model generated</p>
                    <a 
                      href={media.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View 3D Model →
                    </a>
                  </div>
                )}
                {media.type === 'audio' && (
                  <div className="p-4">
                    <audio controls className="w-full">
                      <source src={media.url} />
                    </audio>
                  </div>
                )}
                {media.type === 'video' && (
                  <video controls className="w-full">
                    <source src={media.url} />
                  </video>
                )}
                {media.filepath && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                    📁 Saved as: {media.filepath}
                  </div>
                )}
              </div>
            )}
            
            {/* Collapsible Tool Details */}
            <details className="text-xs">
              <summary className={`
                cursor-pointer p-2 rounded border inline-flex items-center gap-2
                ${exec.result.isError 
                  ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
              `}>
                <span className="font-mono font-medium">
                  {exec.result.isError ? '❌' : '✓'} {exec.call.name}
                </span>
                {exec.duration && (
                  <span className="text-[var(--text-disabled)]">({exec.duration}ms)</span>
                )}
                {!media && exec.result.content && Array.isArray(exec.result.content) && (
                  <span className="text-gray-600">
                    {extractSummary(exec.result.content.find((c: any) => c.type === 'text')?.text || '')}
                  </span>
                )}
              </summary>
              
              <div className={`
                mt-2 p-3 rounded border
                ${exec.result.isError 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50 border-gray-200'
                }
              `}>
                {/* Arguments */}
                {Object.keys(exec.call.arguments).length > 0 && (
                  <details className="mb-2">
                    <summary className="cursor-pointer text-[var(--text-disabled)] hover:text-gray-800">
                      Arguments
                    </summary>
                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                      {JSON.stringify(exec.call.arguments, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Result Details */}
                <div className="text-xs">
                  {exec.result.content && Array.isArray(exec.result.content) ? (
                    exec.result.content.map((content: any, cidx: number) => (
                      <div key={cidx} className="mb-2">
                        {content.type === 'text' && (
                          <p className="text-gray-700 whitespace-pre-wrap">{content.text}</p>
                        )}
                        {content.type === 'error' && (
                          <p className="text-red-700">Error: {content.message}</p>
                        )}
                      </div>
                    ))
                  ) : exec.result.content && typeof exec.result.content === 'string' ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{exec.result.content}</p>
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(exec.result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}

