/**
 * Container Cache Storage using IndexedDB
 * Persists ALL non-workspace files (node_modules, build outputs, vendor/, etc.)
 * Works for any language/framework - language agnostic!
 */

const DB_NAME = 'justmakeit-storage';
const STORE_NAME = 'container-cache';
const DB_VERSION = 2;

interface ContainerCacheData {
  workspaceId: string;
  files: Record<string, string>; // path -> content
  metadata: {
    totalFiles: number;
    totalSize: number;
    cachedPaths: string[]; // Top-level directories cached (node_modules, dist, vendor, etc.)
  };
  updatedAt: string;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'workspaceId' });
      }
    };
  });
}

/**
 * Save container cache for a workspace
 */
export async function saveContainerCache(
  workspaceId: string,
  files: Record<string, string>,
  cachedPaths: string[]
): Promise<void> {
  console.log(`💾 Saving container cache for workspace ${workspaceId}:`, Object.keys(files).length, 'files');
  
  // Calculate total size
  let totalSize = 0;
  for (const content of Object.values(files)) {
    totalSize += new Blob([content]).size;
  }
  
  console.log(`📊 Cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  const database = await initDB();

  const data: ContainerCacheData = {
    workspaceId,
    files,
    metadata: {
      totalFiles: Object.keys(files).length,
      totalSize,
      cachedPaths,
    },
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    console.log(`💾 [IndexedDB] Attempting to store ${(totalSize / 1024 / 1024).toFixed(2)} MB...`);
    
    const request = store.put(data);

    request.onerror = () => {
      console.error('❌ [IndexedDB] Save error:', request.error);
      console.error('❌ [IndexedDB] Error name:', request.error?.name);
      console.error('❌ [IndexedDB] Error message:', request.error?.message);
      
      if (request.error?.name === 'QuotaExceededError') {
        console.error('❌ [IndexedDB] Browser storage quota exceeded!');
        console.error('💡 Try clearing cache or reducing node_modules size');
      }
      
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log(`✅ [IndexedDB] Put ${Object.keys(files).length} files into store`);
    };
    
    // Wait for transaction to complete
    transaction.oncomplete = () => {
      console.log('✅ [IndexedDB] Transaction complete');
      resolve();
    };
    
    transaction.onerror = () => {
      console.error('❌ [IndexedDB] Transaction error:', transaction.error);
      console.error('❌ [IndexedDB] Error name:', transaction.error?.name);
      reject(transaction.error);
    };
  });
}

/**
 * Load container cache for a workspace
 */
export async function loadContainerCache(
  workspaceId: string
): Promise<{ files: Record<string, string>; metadata: ContainerCacheData['metadata'] } | null> {
  console.log(`📂 Loading container cache for workspace ${workspaceId}`);
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(workspaceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result as ContainerCacheData | undefined;
      if (data && data.files) {
        const sizeMB = (data.metadata.totalSize / 1024 / 1024).toFixed(2);
        console.log(`✅ Loaded ${data.metadata.totalFiles} files (${sizeMB} MB) from cache`);
        console.log(`📁 Cached paths: ${data.metadata.cachedPaths.join(', ')}`);
        resolve({ files: data.files, metadata: data.metadata });
      } else {
        console.log('ℹ️ No cached files found');
        resolve(null);
      }
    };
  });
}

/**
 * Delete container cache for a workspace
 */
export async function deleteContainerCache(workspaceId: string): Promise<void> {
  console.log(`🗑️ Deleting container cache for workspace ${workspaceId}`);
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(workspaceId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('✅ Deleted container cache from IndexedDB');
      resolve();
    };
  });
}

/**
 * Remove specific file(s) from cache
 * Useful when deleting files - keeps cache in sync with container
 */
export async function removeFromCache(
  workspaceId: string,
  pathToRemove: string
): Promise<void> {
  console.log(`🗑️ [CACHE] Removing ${pathToRemove} from cache for workspace ${workspaceId}...`);
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      // Load existing cache
      const cache = await loadContainerCache(workspaceId);
      if (!cache) {
        console.log('ℹ️ [CACHE] No cache exists for this workspace');
        resolve();
        return;
      }

      console.log(`📊 [CACHE] Current cache has ${Object.keys(cache.files).length} files`);

      // Check if this is a directory deletion (remove all files under it)
      const filesToRemove: string[] = [];
      for (const cachedPath of Object.keys(cache.files)) {
        if (cachedPath === pathToRemove || cachedPath.startsWith(pathToRemove + '/')) {
          filesToRemove.push(cachedPath);
        }
      }

      if (filesToRemove.length === 0) {
        console.log(`ℹ️ [CACHE] Path "${pathToRemove}" not found in cache`);
        resolve();
        return;
      }

      console.log(`🗑️ [CACHE] Found ${filesToRemove.length} file(s) to remove:`, filesToRemove.slice(0, 10));

      // Remove files from cache
      for (const path of filesToRemove) {
        delete cache.files[path];
      }

      console.log(`🗑️ [CACHE] Removed ${filesToRemove.length} file(s) from cache`);

      // Recalculate metadata
      const totalFiles = Object.keys(cache.files).length;
      let totalSize = 0;
      for (const content of Object.values(cache.files)) {
        totalSize += new Blob([content]).size;
      }

      console.log(`📊 [CACHE] New cache size: ${totalFiles} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      const updatedData: ContainerCacheData = {
        workspaceId,
        files: cache.files,
        metadata: {
          totalFiles,
          totalSize,
          cachedPaths: cache.metadata.cachedPaths,
        },
        updatedAt: new Date().toISOString(),
      };

      // Save updated cache
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedData);

      request.onerror = () => {
        console.error('❌ [CACHE] Failed to update cache:', request.error);
        reject(request.error);
      };
      transaction.oncomplete = () => {
        console.log('✅ [CACHE] Cache successfully updated after deletion');
        resolve();
      };
      transaction.onerror = () => {
        console.error('❌ [CACHE] Transaction error:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error('❌ [CACHE] Error in removeFromCache:', error);
      reject(error);
    }
  });
}

// Legacy exports for backwards compatibility
export const saveNodeModules = saveContainerCache;
export const loadNodeModules = async (workspaceId: string) => {
  const cache = await loadContainerCache(workspaceId);
  return cache?.files || null;
};
export const deleteNodeModules = deleteContainerCache;

