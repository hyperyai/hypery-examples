/**
 * File Tree Component - VS Code Style
 * Displays hierarchical file tree with folders and files
 */

'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  FileText,
  FileJson,
  FileCode,
  File as FileIcon,
} from 'lucide-react';
import { FileContextMenu } from './FileContextMenu';

interface FileTreeProps {
  files: string[];
  activeFile: string;
  onSelectFile: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onDeleteFile?: (path: string) => void;
  onAddToChat?: (path: string) => void;
  onNewFile?: (parentPath: string) => void;
  onNewFolder?: (parentPath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export function FileTree({ 
  files, 
  activeFile, 
  onSelectFile,
  onRenameFile,
  onDeleteFile,
  onAddToChat,
  onNewFile,
  onNewFolder,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    filePath: string | null;
    isFolder: boolean;
  } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Build tree structure from flat file list
  const tree = useMemo(() => {
    const root: TreeNode = { name: '', path: '', type: 'folder', children: [] };
    
    files.forEach(filePath => {
      const parts = filePath.split('/').filter(Boolean);
      let currentNode = root;
      let currentPath = '';
      
      parts.forEach((part, index) => {
        currentPath += '/' + part;
        const isFile = index === parts.length - 1;
        
        if (!currentNode.children) {
          currentNode.children = [];
        }
        
        let childNode = currentNode.children.find(child => child.name === part);
        
        if (!childNode) {
          childNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
          };
          currentNode.children.push(childNode);
        }
        
        if (!isFile) {
          currentNode = childNode;
        }
      });
    });
    
    // Sort: folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.children) {
          sortNodes(node.children);
        }
      });
    };
    
    if (root.children) {
      sortNodes(root.children);
    }
    
    return root;
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, path: string | null, isFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      filePath: path,
      isFolder,
    });
  };

  const handleEmptySpaceContextMenu = (e: React.MouseEvent) => {
    // Only trigger if clicking on the container itself, not its children
    if (e.target === e.currentTarget) {
      handleContextMenu(e, null, true);
    }
  };

  const handleRename = (path: string) => {
    const fileName = path.split('/').pop() || '';
    setRenamingPath(path);
    setNewName(fileName);
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (newName.trim() && onRenameFile) {
      const pathParts = oldPath.split('/');
      pathParts[pathParts.length - 1] = newName.trim();
      const newPath = pathParts.join('/');
      onRenameFile(oldPath.startsWith('/') ? oldPath.slice(1) : oldPath, newPath.startsWith('/') ? newPath.slice(1) : newPath);
    }
    setRenamingPath(null);
    setNewName('');
  };

  const handleDelete = (path: string) => {
    if (onDeleteFile && confirm(`Are you sure you want to delete ${path}?`)) {
      onDeleteFile(path.startsWith('/') ? path.slice(1) : path);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path.startsWith('/') ? path.slice(1) : path);
  };

  const handleAddToChat = (path: string) => {
    if (onAddToChat) {
      onAddToChat(path.startsWith('/') ? path.slice(1) : path);
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isRenaming = renamingPath === node.path;

    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      const Icon = isExpanded ? FolderOpen : Folder;
      const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
      
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node.path, true)}
            className="w-full flex items-center px-2 py-1 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group ide-transition"
            style={{ paddingLeft: `${depth * 12 + 8}px`, fontSize: '13px' }}
          >
            <ChevronIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <Icon className="w-4 h-4 mr-2 flex-shrink-0 text-[#DCBF85]" />
            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleRenameSubmit(node.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(node.path);
                  if (e.key === 'Escape') setRenamingPath(null);
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="bg-[var(--input-bg)] text-[var(--text-secondary)] px-1 py-0 rounded flex-1 outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    
    // File node
    const isActive = node.path === '/' + activeFile || node.path === activeFile;
    const FileIconComponent = getFileIcon(node.name);
    
    const handleDragStart = (e: React.DragEvent) => {
      const filePath = node.path.startsWith('/') ? node.path.slice(1) : node.path;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/x-file-path', filePath);
      e.dataTransfer.setData('text/plain', filePath); // Fallback
    };
    
    return (
      <button
        key={node.path}
        onClick={() => onSelectFile(node.path.startsWith('/') ? node.path.slice(1) : node.path)}
        onContextMenu={(e) => handleContextMenu(e, node.path, false)}
        draggable={true}
        onDragStart={handleDragStart}
        className={`
          w-full flex items-center px-2 py-1 group cursor-move
          ${isActive 
            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        style={{ paddingLeft: `${depth * 12 + 8 + 20}px`, fontSize: '13px' }}
      >
        <FileIconComponent className={`w-4 h-4 mr-2 flex-shrink-0 ${getFileIconColor(node.name)}`} />
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => handleRenameSubmit(node.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit(node.path);
              if (e.key === 'Escape') setRenamingPath(null);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="bg-[#3C3C3C] text-[var(--text-secondary)] px-1 py-0 rounded flex-1 outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </button>
    );
  };

  if (files.length === 0) {
    return (
      <div className="p-4 text-[var(--text-tertiary)]" style={{ fontSize: '13px' }}>
        No files yet. Ask the AI to create one!
      </div>
    );
  }

  return (
    <>
      <div 
        className="flex flex-col h-full w-full"
        style={{ fontSize: '13px' }}
        onContextMenu={handleEmptySpaceContextMenu}
      >
        {tree.children?.map(node => renderNode(node, 0))}
      </div>

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          filePath={contextMenu.filePath}
          isFolder={contextMenu.isFolder}
          onClose={() => setContextMenu(null)}
          onRename={contextMenu.filePath ? handleRename : undefined}
          onDelete={contextMenu.filePath ? handleDelete : undefined}
          onCopyPath={contextMenu.filePath ? handleCopyPath : undefined}
          onAddToChat={contextMenu.filePath ? handleAddToChat : undefined}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
        />
      )}
    </>
  );
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return FileJson;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'scss':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'go':
    case 'rs':
      return FileCode;
    case 'md':
    case 'txt':
      return FileText;
    default:
      return FileIcon;
  }
}

function getFileIconColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'text-[#F7DF1E]'; // JavaScript yellow
    case 'ts':
    case 'tsx':
      return 'text-[#3178C6]'; // TypeScript blue
    case 'json':
      return 'text-[#F7DF1E]'; // JSON yellow
    case 'html':
      return 'text-[#E34C26]'; // HTML orange
    case 'css':
    case 'scss':
      return 'text-[#1572B6]'; // CSS blue
    case 'py':
      return 'text-[#3776AB]'; // Python blue
    case 'md':
      return 'text-[#519ABA]'; // Markdown blue
    default:
      return 'text-[var(--text-tertiary)]';
  }
}
