# WebContainer File Sync Guide

## How It Works

Your workspace files are automatically synced to the WebContainer filesystem!

### Automatic Syncing

1. **Initial Mount** (2 seconds after terminal loads)
   - All workspace files are mounted to WebContainer
   - You'll see: `📁 Mounting workspace files to WebContainer...`
   - Then: `✅ Workspace files mounted!`

2. **Real-Time Sync**
   - When you edit a file in the editor, it auto-syncs to WebContainer
   - Changes are available immediately in the terminal

3. **New File Creation**
   - Files created by AI or manually are synced
   - Available in terminal after workspace updates

## Using Files in Terminal

Once mounted, you can access your files:

```bash
# List all files
ls -la

# Read a file
cat myfile.js

# Edit files (changes won't sync back to editor yet)
echo "console.log('test')" > test.js

# Run Node.js files
node myfile.js

# Create package.json and install packages
npm init -y
npm install express
```

## File Structure

Your workspace files are mounted at the root (`/`) of the WebContainer:

```
/
├── file1.js
├── file2.md
├── folder/
│   └── nested.ts
└── package.json (if you have one)
```

## Creating Files

### Option 1: In the Editor (Recommended)
- Ask AI to create files
- Files auto-sync to WebContainer
- Changes tracked and saved

### Option 2: In Terminal
- Create files with `touch`, `echo`, etc.
- Files exist in WebContainer
- Won't automatically appear in editor (yet)

## Package Management

You can install real npm packages!

```bash
# Install dependencies
npm install lodash axios express

# Install dev dependencies
npm install -D typescript @types/node

# Run scripts
npm run dev
npm test
```

## Running Servers

You can run dev servers in the terminal:

```bash
# Create a simple server
cat > server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from WebContainer!');
});
server.listen(3000, () => console.log('Server running on port 3000'));
EOF

# Run it
node server.js
```

WebContainers provides port forwarding so servers work!

## Tips

1. **Wait for Mount**: Look for the "files mounted" message before expecting files
2. **Case Sensitive**: File paths are case-sensitive (like Linux)
3. **No Binary Files**: WebContainers can't run native binaries (only Node.js/npm)
4. **Memory Limits**: Files stored in browser memory (cleared on refresh)

## Troubleshooting

### Files Not Appearing?
```bash
# Check what's in the filesystem
ls -la
find . -type f

# Check current directory
pwd
```

### Sync Issues?
- Refresh the page to remount all files
- Check browser console for sync errors
- Make sure files were created (check file tree)

## Future Enhancements

Coming soon:
- Bi-directional sync (terminal → editor)
- File watcher for automatic updates
- Git support in terminal
- Better error handling
- File system browser in UI

