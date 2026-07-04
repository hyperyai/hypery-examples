/**
 * Emergency File Recovery
 * Attempt to recover files from WebContainer
 */

export async function recoverFilesFromContainer(workspaceId: string): Promise<Record<string, string>> {
  try {
    const { getWebContainer } = await import('../terminal/webcontainer');
    const container = await getWebContainer();
    
    // Recursively read all files from container
    async function readDir(path: string = '.'): Promise<Record<string, string>> {
      const files: Record<string, string> = {};
      
      try {
        const entries = await container.fs.readdir(path, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path === '.' ? entry.name : `${path}/${entry.name}`;
          
          // Skip node_modules and hidden files
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          
          if (entry.isDirectory()) {
            const subFiles = await readDir(fullPath);
            Object.assign(files, subFiles);
          } else if (entry.isFile()) {
            try {
              const content = await container.fs.readFile(fullPath, 'utf-8');
              files[fullPath] = content;
            } catch (error) {
              console.warn(`Could not read file: ${fullPath}`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Could not read directory: ${path}`, error);
      }
      
      return files;
    }
    
    return await readDir();
  } catch (error) {
    console.error('Failed to recover files from container:', error);
    return {};
  }
}






