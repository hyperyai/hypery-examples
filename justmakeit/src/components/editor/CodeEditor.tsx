/**
 * Code Editor Component
 * Monaco Editor with syntax highlighting, autocomplete, and more
 */

'use client';

import { useEffect, useState } from 'react';
import Editor, { type BeforeMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename: string;
}

export function CodeEditor({ value, onChange, filename }: CodeEditorProps) {
  const language = getLanguageFromFilename(filename);
  const isImage = isImageFile(filename);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>('');

  // Configure Monaco Editor theme - VS Code Dark+ exact colors
  const handleEditorBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // TypeScript specific tokens
        { token: 'identifier.ts', foreground: '9CDCFE' },
        { token: 'identifier.js', foreground: '9CDCFE' },
        { token: 'type.identifier.ts', foreground: '4EC9B0' },
        { token: 'type.identifier.js', foreground: '4EC9B0' },
        { token: 'delimiter.ts', foreground: 'D4D4D4' },
        { token: 'delimiter.bracket.ts', foreground: 'FFD700' },
        { token: 'delimiter.parenthesis.ts', foreground: 'FFD700' },
        { token: 'delimiter.square.ts', foreground: 'FFD700' },
        { token: 'string.ts', foreground: 'CE9178' },
        { token: 'number.ts', foreground: 'B5CEA8' },
        { token: 'keyword.ts', foreground: '569CD6' },
        { token: 'comment.ts', foreground: '6A9955' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editor.lineHighlightBackground': '#2A2D2E',
        'editorCursor.foreground': '#AEAFAD',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
      },
    });
    monaco.editor.setTheme('custom-dark');
  };

  // Fetch authenticated images
  useEffect(() => {
    if (!isImage || !value) {
      setImageUrl('');
      return;
    }

    // If it's already a data URL or blob URL, use it directly
    if (value.startsWith('data:') || value.startsWith('blob:')) {
      setImageUrl(value);
      return;
    }

    // If it's an API URL that requires auth, use proxy to avoid CORS
    if (value.includes('/api/') || value.startsWith('http')) {
      setImageLoading(true);
      setImageError('');

      // Extract image ID from URL (handles both full URLs and relative paths)
      let imageId: string | null = null;
      
      // Try to extract from /api/v1/images/serve/... pattern
      const serveMatch = value.match(/\/api\/v1\/images\/serve\/([a-f0-9]+)/);
      if (serveMatch) {
        imageId = serveMatch[1];
      }

      if (!imageId) {
        setImageError('Invalid image URL format');
        setImageLoading(false);
        return;
      }

      // Use local proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/images/proxy/${imageId}`;
      
      fetch(proxyUrl)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load image: ${res.status} ${res.statusText}`);
          }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          setImageUrl(blobUrl);
          setImageLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load image:', error);
          setImageError(error.message);
          setImageLoading(false);
        });

      // Cleanup blob URL when component unmounts or value changes
      return () => {
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    } else {
      // Assume it's a relative path or other valid URL
      setImageUrl(value);
    }
  }, [value, isImage]);

  if (!filename) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <p className="text-lg font-medium mb-2 text-[var(--text-tertiary)]">No file selected</p>
          <p className="text-sm text-[var(--text-disabled)]">Select a file or ask AI to create one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{filename}</span>
        <span className="text-xs text-[var(--text-disabled)] uppercase">{isImage ? 'image' : language}</span>
      </div>

      {/* Image Viewer or Monaco Editor */}
      <div className="flex-1 overflow-auto">
        {isImage ? (
          <div className="h-full flex items-center justify-center p-8 bg-[var(--bg-primary)]">
            {imageLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
                <p className="text-sm text-[var(--text-tertiary)]">Loading image...</p>
              </div>
            ) : imageError ? (
              <div className="text-center">
                <p className="text-[var(--status-error)] mb-2">❌ Failed to load image</p>
                <p className="text-sm text-[var(--text-disabled)]">{imageError}</p>
                <p className="text-xs text-[var(--text-disabled)] mt-4">URL: {value}</p>
              </div>
            ) : imageUrl ? (
              <div className="max-w-full max-h-full">
                <img 
                  src={imageUrl} 
                  alt={filename}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                />
                <div className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
                  {filename}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[var(--text-tertiary)]">No image to display</p>
              </div>
            )}
          </div>
        ) : (
          <Editor
            height="100%"
            language={language}
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            theme="custom-dark"
            beforeMount={handleEditorBeforeMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              formatOnType: true,
              'semanticHighlighting.enabled': true,
            }}
          />
        )}
      </div>
    </div>
  );
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext || '');
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'jsx':
      return 'javascript';
    case 'tsx':
      return 'typescript';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'sh':
      return 'shell';
    default:
      return 'plaintext';
  }
}

