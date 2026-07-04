/**
 * File System Hook
 * Manages in-memory file storage for the IDE
 */

'use client';

import { useState, useCallback } from 'react';

export interface FileSystemHook {
  files: Record<string, string>;
  activeFile: string;
  setFiles: (files: Record<string, string>) => void;
  setActiveFile: (path: string) => void;
  createFile: (path: string, content?: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  fileExists: (path: string) => boolean;
}

const DEFAULT_FILES: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, JustMakeIt.AI!</h1>
    <p>Try asking the AI to create or modify files.</p>
    <script src="script.js"></script>
</body>
</html>`,
  'style.css': `body {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    line-height: 1.6;
}

h1 {
    color: #2563eb;
}`,
  'script.js': `console.log('Hello from JustMakeIt.AI!');

// Try asking the AI to add functionality here
`,
};

export function useFileSystem(): FileSystemHook {
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState<string>('index.html');

  const createFile = useCallback((path: string, content: string = '') => {
    setFiles(prev => ({
      ...prev,
      [path]: content,
    }));
  }, []);

  const updateFile = useCallback((path: string, content: string) => {
    setFiles(prev => ({
      ...prev,
      [path]: content,
    }));
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[path];
      return newFiles;
    });

    // If the deleted file was active, switch to first available file
    if (activeFile === path) {
      const remainingFiles = Object.keys(files).filter(f => f !== path);
      setActiveFile(remainingFiles[0] || '');
    }
  }, [activeFile, files]);

  const fileExists = useCallback((path: string) => {
    return path in files;
  }, [files]);

  return {
    files,
    activeFile,
    setFiles,
    setActiveFile,
    createFile,
    updateFile,
    deleteFile,
    fileExists,
  };
}


