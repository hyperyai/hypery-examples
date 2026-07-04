/**
 * WebContainer Service
 * Runs Node.js and npm commands in the browser using WebAssembly
 */

import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

// Store active preview URLs
const previewUrls = new Map<number, string>();
let portReadyCallback: ((port: number, url: string) => void) | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  // Return existing instance
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  // Wait for existing boot process
  if (bootPromise) {
    return bootPromise;
  }

  // Start new boot process
  console.log('🚀 Booting WebContainer...');
  bootPromise = WebContainer.boot()
    .then((instance) => {
      webcontainerInstance = instance;
      console.log('✅ WebContainer ready!');
      
      // Listen for server ports becoming ready
      instance.on('server-ready', (port, url) => {
        console.log(`🌐 [PREVIEW] Server ready on port ${port}: ${url}`);
        
        previewUrls.set(port, url);
        
        if (portReadyCallback) {
          portReadyCallback(port, url);
        }
      });
      
      return instance;
    })
    .catch((error) => {
      console.error('❌ WebContainer boot failed:', error);
      bootPromise = null; // Allow retry
      throw error;
    });
  
  return bootPromise;
}

/**
 * Set callback for when a server port becomes ready
 */
export function onPortReady(callback: (port: number, url: string) => void) {
  portReadyCallback = callback;
}

/**
 * Get preview URL for a specific port
 */
export function getPreviewUrl(port: number): string | null {
  return previewUrls.get(port) || null;
}

/**
 * Get all active preview URLs
 */
export function getAllPreviewUrls(): Map<number, string> {
  return new Map(previewUrls);
}

export async function writeFile(path: string, content: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
  const container = await getWebContainer();
  const content = await container.fs.readFile(path, 'utf-8');
  return content;
}

export async function mkdir(path: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.mkdir(path, { recursive: true });
}

export async function readdir(path: string): Promise<string[]> {
  const container = await getWebContainer();
  const entries = await container.fs.readdir(path);
  return entries;
}

export async function rm(path: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.rm(path, { recursive: true });
}

/**
 * Clear all files from WebContainer filesystem
 * Used when switching workspaces to ensure clean slate
 */
export async function clearContainer(): Promise<void> {
  console.log('🧹 [CLEAR] Clearing WebContainer filesystem...');
  const container = await getWebContainer();
  
  try {
    // Read all entries in root directory
    const entries = await container.fs.readdir('.', { withFileTypes: true });
    let deletedCount = 0;
    
    for (const entry of entries) {
      try {
        // Delete everything except hidden files (like .webcontainer)
        if (!entry.name.startsWith('.')) {
          await container.fs.rm(entry.name, { recursive: true, force: true });
          console.log(`🗑️ [CLEAR] Deleted: ${entry.name}`);
          deletedCount++;
        }
      } catch (error) {
        console.warn(`⚠️ [CLEAR] Failed to delete ${entry.name}:`, error);
      }
    }
    
    console.log(`✅ [CLEAR] Cleared ${deletedCount} entries from WebContainer`);
  } catch (error) {
    console.error('❌ [CLEAR] Failed to clear WebContainer:', error);
  }
}

/**
 * Mount workspace files to WebContainer filesystem
 */
export async function mountFiles(files: Record<string, string>): Promise<void> {
  const container = await getWebContainer();
  
  // Create directory structure
  const dirs = new Set<string>();
  for (const path of Object.keys(files)) {
    const parts = path.split('/');
    parts.pop(); // Remove filename
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      dirs.add(current);
    }
  }

  // Create all directories
  for (const dir of Array.from(dirs).sort()) {
    try {
      await container.fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
  }

  // Write all files (skip invalid entries)
  let mountedCount = 0;
  for (const [path, content] of Object.entries(files)) {
    // Skip entries that look like directories or invalid paths
    if (!path || path.endsWith('/') || path.includes('//')) {
      console.log(`⏭️ Skipping invalid path: ${path}`);
      continue;
    }
    
    try {
      await container.fs.writeFile(path, content || '');
      mountedCount++;
    } catch (error) {
      console.warn(`⚠️ Failed to mount ${path}:`, error);
    }
  }

  console.log(`📁 Mounted ${mountedCount} files to WebContainer (${Object.keys(files).length} total entries)`);
}

/**
 * Sync single file to WebContainer
 */
export async function syncFile(path: string, content: string): Promise<void> {
  const container = await getWebContainer();
  
  // Ensure directory exists
  const dir = path.split('/').slice(0, -1).join('/');
  if (dir) {
    try {
      await container.fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }
  }
  
  await container.fs.writeFile(path, content);
}

/**
 * Check if WebContainers is supported in this browser
 */
export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for required features
  return (
    'SharedArrayBuffer' in window &&
    crossOriginIsolated === true
  );
}

/**
 * Scan WebContainer file system once and detect changes
 * Much more efficient than constant polling - call this after terminal commands
 */
export async function scanForFileChanges(
  knownFiles: Map<string, string>,
  onFileChange: (path: string, content: string) => void,
  onFileDelete: (path: string) => void
): Promise<void> {
  console.log('🔍 scanForFileChanges: Starting scan...');
  const container = await getWebContainer();
  const currentFiles = new Set<string>();
  
  async function scanDirectory(dir: string = '.'): Promise<void> {
    try {
      const entries = await container.fs.readdir(dir, { withFileTypes: true });
      console.log(`🔍 Scanning directory "${dir}": found ${entries.length} entries`);
      
      for (const entry of entries) {
        const fullPath = dir === '.' ? entry.name : `${dir}/${entry.name}`;
        
        // Skip node_modules and hidden files
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          console.log(`⏭️  Skipping: ${fullPath}`);
          continue;
        }
        
        if (entry.isDirectory()) {
          console.log(`📁 Directory: ${fullPath}`);
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          currentFiles.add(fullPath);
          console.log(`📄 File found: ${fullPath}`);
          try {
            const content = await container.fs.readFile(fullPath, 'utf-8');
            const previousContent = knownFiles.get(fullPath);
            
            if (previousContent === undefined) {
              // New file
              console.log('✨ NEW file detected:', fullPath, `(${content.length} bytes)`);
              knownFiles.set(fullPath, content);
              onFileChange(fullPath, content);
            } else if (previousContent !== content) {
              // Modified file  
              console.log('✏️  MODIFIED file:', fullPath, `(${content.length} bytes)`);
              knownFiles.set(fullPath, content);
              onFileChange(fullPath, content);
            } else {
              console.log(`✅ Unchanged: ${fullPath}`);
            }
          } catch (error) {
            console.warn(`⚠️  Could not read ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error scanning directory:', error);
    }
  }
  
  // Scan all files
  await scanDirectory();
  console.log(`🔍 scanForFileChanges: Found ${currentFiles.size} files, knew about ${knownFiles.size} files`);
  
  // Check for deleted files
  let deletedCount = 0;
  for (const knownPath of knownFiles.keys()) {
    if (!currentFiles.has(knownPath)) {
      console.log('🗑️ Terminal deleted file:', knownPath);
      knownFiles.delete(knownPath);
      onFileDelete(knownPath);
      deletedCount++;
    }
  }
  
  console.log(`🔍 scanForFileChanges: Complete. Deleted ${deletedCount} files.`);
}

/**
 * Watch WebContainer filesystem using native fs.watch() API
 * Event-driven - no polling needed!
 */
export async function watchFileSystem(
  onFileChange: (path: string, content: string) => void,
  onFileDelete: (path: string) => void
): Promise<() => void> {
  const container = await getWebContainer();
  const knownFiles = new Map<string, string>();
  
  // Initial scan to populate known files (WITHOUT triggering callbacks)
  async function initialScan(dir: string = '.'): Promise<void> {
    try {
      const entries = await container.fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = dir === '.' ? entry.name : `${dir}/${entry.name}`;
        if (entry.name.startsWith('.')) continue; // Skip hidden
        
        if (entry.isDirectory()) {
          await initialScan(fullPath);
        } else if (entry.isFile()) {
          try {
            const content = await container.fs.readFile(fullPath, 'utf-8');
            knownFiles.set(fullPath, content);
          } catch {
            // Binary file or unreadable
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }
  
  await initialScan();
  console.log(`👀 Tracking ${knownFiles.size} files`);
  
  // Watch the root directory recursively using WebContainer's native watch API
  const watcher = container.fs.watch('.', { recursive: true }, async (event, filename) => {
    if (!filename) return;
    
    // Convert Uint8Array to string if needed
    let filenameStr: string;
    if (typeof filename === 'string') {
      filenameStr = filename;
    } else {
      try {
        // Try to decode as buffer-like object
        filenameStr = new TextDecoder().decode(filename as BufferSource);
      } catch (error) {
        console.warn('⚠️ Unable to decode filename:', typeof filename, error);
        return;
      }
    }
    
    // Skip node_modules and hidden files
    if (filenameStr.includes('node_modules') || filenameStr.startsWith('.')) {
      return;
    }
    
    // Debounce: wait a bit for the operation to complete
    setTimeout(async () => {
      try {
        // Check if it's a directory by trying to read it as a directory
        try {
          await container.fs.readdir(filenameStr);
          return; // Skip directories
        } catch {
          // Not a directory, continue to read as file
        }
        
        // Try to read the file
        const content = await container.fs.readFile(filenameStr, 'utf-8');
        const previousContent = knownFiles.get(filenameStr);
        
        if (previousContent === undefined) {
          // New file
          knownFiles.set(filenameStr, content);
          onFileChange(filenameStr, content);
        } else if (previousContent !== content) {
          // Modified file
          knownFiles.set(filenameStr, content);
          onFileChange(filenameStr, content);
        }
      } catch (error) {
        // File was deleted or is binary or doesn't exist
        if (knownFiles.has(filenameStr)) {
          knownFiles.delete(filenameStr);
          onFileDelete(filenameStr);
        }
      }
    }, 100); // Small debounce
  });
  
  // Return cleanup function
  return () => {
    watcher.close();
    knownFiles.clear();
  };
}

/**
 * List all files in WebContainer (including node_modules)
 * For display purposes only - not stored in workspace
 */
export async function listAllFiles(): Promise<string[]> {
  const container = await getWebContainer();
  const files: string[] = [];
  
  async function scanDirectory(dir: string = '.'): Promise<void> {
    try {
      const entries = await container.fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = dir === '.' ? entry.name : `${dir}/${entry.name}`;
        
        // Skip hidden files (but NOT node_modules)
        if (entry.name.startsWith('.')) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }
  
  await scanDirectory();
  return files;
}

/**
 * Save ENTIRE WebContainer state to IndexedDB
 * Simple approach: cache everything, workspace files will overwrite on restore
 */
export async function saveNodeModulesToCache(
  workspaceId: string,
  workspaceFiles: Set<string>
): Promise<{ success: boolean; fileCount: number; error?: string }> {
  console.log(`💾 [CACHE-SAVE] Starting cache save for workspace: ${workspaceId}`);
  console.log(`💾 [CACHE-SAVE] Workspace has ${workspaceFiles.size} files (will skip these)`);
  
  const container = await getWebContainer();
  const cachedFiles: Record<string, string> = {};
  let scannedCount = 0;
  let skippedCount = 0;
  
  // Recursively scan ALL files
  async function scanDirectory(dir: string = '.'): Promise<void> {
    try {
      const entries = await container.fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = dir === '.' ? entry.name : `${dir}/${entry.name}`;
        
        // Skip hidden files/directories (but not .next, .cache, etc. in root)
        if (entry.name.startsWith('.') && dir !== '.') {
          skippedCount++;
          continue;
        }
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          scannedCount++;
          
          // Skip workspace files - they're already in localStorage
          if (workspaceFiles.has(fullPath)) {
            skippedCount++;
            continue;
          }
          
          // Check if this is a binary file
          const ext = fullPath.split('.').pop()?.toLowerCase();
          const binaryExtensions = ['wasm', 'node', 'dll', 'so', 'dylib', 'exe', 'bin', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'ttf', 'woff', 'woff2', 'eot'];
          const isBinary = ext && binaryExtensions.includes(ext);
          
          try {
            if (isBinary) {
              // Read as binary (Uint8Array) and convert to base64
              const binaryData = await container.fs.readFile(fullPath);
              const bytes = new Uint8Array(binaryData);
              
              // Convert to base64 in chunks to avoid call stack size exceeded
              let binary = '';
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, Array.from(chunk));
              }
              const base64 = btoa(binary);
              cachedFiles[fullPath] = `BINARY:${base64}`;
            } else {
              // Read as text
              const content = await container.fs.readFile(fullPath, 'utf-8');
              cachedFiles[fullPath] = content;
            }
          } catch (error) {
            // Skip files that can't be read
            console.warn(`⚠️ [CACHE-SAVE] Failed to read ${fullPath}:`, error);
            skippedCount++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning ${dir}:`, error);
    }
  }
  
  await scanDirectory();

  console.log(`💾 [CACHE-SAVE] Scan complete: found ${Object.keys(cachedFiles).length} files to cache (skipped ${skippedCount})`);

  if (Object.keys(cachedFiles).length === 0) {
    console.log(`❌ [CACHE-SAVE] No files to cache!`);
    return { 
      success: false, 
      fileCount: 0, 
      error: 'No non-workspace files found to cache.\n\nRun build commands or install dependencies first.' 
    };
  }
  
  console.log(`💾 [CACHE-SAVE] First 10 files to cache:`, Object.keys(cachedFiles).slice(0, 10));
  console.log(`💾 [CACHE-SAVE] Saving to IndexedDB...`);
  
  const { saveContainerCache } = await import('../storage/node-modules-storage');
  await saveContainerCache(workspaceId, cachedFiles, ['(entire container)']);
  
  console.log(`✅ [CACHE-SAVE] Successfully saved ${Object.keys(cachedFiles).length} files to IndexedDB`);
  
  return { 
    success: true, 
    fileCount: Object.keys(cachedFiles).length
  };
}

/**
 * Load entire container cache from IndexedDB
 * This should be called BEFORE mounting workspace files
 * so workspace files overwrite any cached versions
 */
export async function loadNodeModulesFromCache(workspaceId: string): Promise<void> {
  console.log(`🔍 [CACHE-LOAD] Starting cache load for workspace: ${workspaceId}`);
  
  const { loadContainerCache } = await import('../storage/node-modules-storage');
  const cache = await loadContainerCache(workspaceId);
  
  if (!cache || Object.keys(cache.files).length === 0) {
    console.log(`❌ [CACHE-LOAD] No cache found for workspace: ${workspaceId}`);
    return; // No cache to restore
  }
  
  console.log(`📦 [CACHE-LOAD] Found cache with ${cache.metadata.totalFiles} files (${(cache.metadata.totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`📋 [CACHE-LOAD] First 10 cached files:`, Object.keys(cache.files).slice(0, 10));
  
  const container = await getWebContainer();
  
  // Create directories and write files
  let restoredCount = 0;
  let failedCount = 0;
  
  for (const [path, content] of Object.entries(cache.files)) {
    try {
      // Create parent directories
      const parts = path.split('/');
      parts.pop(); // Remove filename
      const dirPath = parts.join('/');
      
      if (dirPath) {
        await container.fs.mkdir(dirPath, { recursive: true });
      }
      
      // Check if this is a binary file (starts with BINARY:)
      if (content.startsWith('BINARY:')) {
        // Decode base64 to binary
        const base64 = content.substring(7); // Remove 'BINARY:' prefix
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await container.fs.writeFile(path, bytes);
      } else {
        // Write as text
        await container.fs.writeFile(path, content);
      }
      
      restoredCount++;
      
      if (restoredCount <= 5) {
        console.log(`✅ [CACHE-LOAD] Restored: ${path}`);
      }
    } catch (error) {
      failedCount++;
      if (failedCount <= 5) {
        console.error(`❌ [CACHE-LOAD] Failed to restore ${path}:`, error);
      }
    }
  }
  
  console.log(`✅ [CACHE-LOAD] Restore complete: ${restoredCount} succeeded, ${failedCount} failed`);
  
  // Verify cache was restored successfully
  try {
    const testPath = Object.keys(cache.files)[0];
    const exists = await container.fs.readFile(testPath, 'utf-8');
    console.log(`✅ [CACHE-LOAD] Verification: ${testPath} exists in WebContainer`);
    console.log(`✅ [CACHE-LOAD] Cache fully restored including binary files`);
  } catch (error) {
    console.error(`❌ [CACHE-LOAD] Verification failed - cached files not accessible in WebContainer!`);
  }
  
  // Recreate symlinks for binaries (node_modules/.bin/)
  // This is needed because symlinks can't be cached as text/base64
  console.log(`🔧 [CACHE-LOAD] Recreating binary symlinks...`);
  try {
    // Run npm rebuild to recreate all bin links (fast, doesn't recompile)
    const rebuildProcess = await container.spawn('npm', ['rebuild']);
    
    // Stream output to console
    const reader = rebuildProcess.output.getReader();
    reader.read().then(function processText({ done, value }): any {
      if (done) {
        console.log('✅ [CACHE-LOAD] npm rebuild complete - binaries ready');
        return;
      }
      
      // Handle different value types
      let text = '';
      if (value) {
        if (typeof value === 'string') {
          text = value;
        } else {
          try {
            // Try to decode as buffer-like object
            text = new TextDecoder().decode(value as BufferSource);
          } catch (error) {
            console.warn('⚠️ Unable to decode output:', typeof value, error);
          }
        }
      }
      
      if (text.trim()) {
        console.log('[npm rebuild]', text.trim());
      }
      return reader.read().then(processText);
    });
    
    // Wait for exit
    const exitCode = await rebuildProcess.exit;
    if (exitCode === 0) {
      console.log('✅ [CACHE-LOAD] Binary symlinks recreated successfully');
    } else {
      console.warn(`⚠️ [CACHE-LOAD] npm rebuild exited with code ${exitCode}`);
    }
  } catch (error) {
    console.warn(`⚠️ [CACHE-LOAD] Could not recreate symlinks:`, error);
    console.log('💡 [CACHE-LOAD] Run "npm install" or "npm rebuild" manually if binaries are missing');
  }
}

