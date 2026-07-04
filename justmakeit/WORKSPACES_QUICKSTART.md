# JustMakeIt.AI Workspaces - Quick Start Guide

## 🚀 Getting Started

### 1. Start the IDE
```bash
cd apps/justmakeit
npm run dev
```

Open http://localhost:3004

### 2. Sign In
- Click "Continue with GitHub" or "Continue with Google"
- Authorize the JustMakeIt.AI app
- You'll be redirected to the IDE

### 3. Your First Workspace
You'll see a default workspace called "My First Project" with a README file.

## 🎯 Quick Tasks

### Create a New Workspace
1. Click the **workspace dropdown** in the header (next to "🤖 JustMakeIt.AI")
2. Click **"New Workspace"**
3. Fill in:
   - **Name**: e.g., "My React App"
   - **Description**: Optional
   - **Template**: Choose React, Node.js, Python, HTML, or Blank
4. Click **"Create Workspace"**

### Switch Between Workspaces
1. Click the **workspace dropdown**
2. Click any workspace name to switch
3. Files and chat history update instantly

### Ask AI to Code
Try these commands in the chat:

```
"Create a React component called UserCard with props for name and email"

"Add a new file utils/api.ts with a fetch wrapper function"

"Refactor the Button component to use TypeScript"

"Create a Python Flask server with two routes"

"Add unit tests for the UserCard component"
```

### Edit Files Manually
1. Click any file in the left sidebar
2. Edit in the Monaco Editor (VS Code-style)
3. Changes auto-save

### Export a Workspace
1. Click workspace dropdown
2. Hover over a workspace
3. Click the **download icon** (↓)
4. JSON file downloads

### Import a Workspace
1. Click workspace dropdown
2. Click **"Import Workspace"**
3. Select a workspace JSON file
4. Workspace appears in your list

### Delete a Workspace
1. Click workspace dropdown
2. Hover over a workspace
3. Click the **trash icon** (🗑️)
4. Confirm deletion
5. *Note: Can't delete if it's your only workspace*

## 💡 Tips

### Template Starter Files

**React Template** includes:
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `src/App.tsx` - Main component
- `src/index.tsx` - Entry point
- `public/index.html` - HTML template

**Node.js Template** includes:
- `package.json` - Express + TypeScript
- `tsconfig.json` - Node config
- `src/index.ts` - Express server

**Python Template** includes:
- `requirements.txt` - FastAPI dependencies
- `main.py` - FastAPI application

**HTML Template** includes:
- `index.html` - Main page
- `style.css` - Styles
- `script.js` - JavaScript

### Chat Commands
The AI can:
- Create files: "Create a new file X"
- Edit files: "Refactor X to use Y"
- Delete files: "Remove the test file"
- List files: "Show me all files"
- Explain code: "What does this function do?"

### Monaco Editor Shortcuts
- `Ctrl/Cmd + S` - Save (auto-saves anyway)
- `Ctrl/Cmd + F` - Find
- `Ctrl/Cmd + H` - Find and replace
- `Alt + Up/Down` - Move line up/down
- `Ctrl/Cmd + /` - Toggle comment
- `F2` - Rename symbol

## 📦 Data Storage

All workspaces are stored in your browser's `localStorage` under the key `justmakeit-workspaces`.

Each workspace includes:
- Files (path → content)
- Chat history
- Settings
- Metadata (name, dates, etc.)

## 🔄 Workflow Example

### Building a React Todo App

1. **Create workspace**:
   - Name: "Todo App"
   - Template: React

2. **Ask AI**:
   ```
   "Create a Todo component with add, delete, and toggle functionality"
   ```

3. **Ask AI**:
   ```
   "Add TypeScript interfaces for Todo items"
   ```

4. **Ask AI**:
   ```
   "Style the Todo component with Tailwind CSS"
   ```

5. **Manually edit** `src/App.tsx` to import and use the Todo component

6. **Export workspace** for backup

That's it! You now have a fully functional React Todo app in your workspace.

## 🎨 Customization

Workspace settings (coming soon):
- Theme (vs-dark, vs-light)
- Font size
- Tab size
- AI model selection

## 🐛 Troubleshooting

### Workspace not saving?
- Check browser console for errors
- Ensure localStorage is enabled
- Try incognito mode

### Chat not responding?
- Check network tab for API errors
- Verify authentication (sign out/in)
- Check Hypery status

### Files not updating?
- Refresh the page
- Check workspace selector (right workspace?)
- Try export/import to reset

## 🚨 Important Notes

- **Data is local**: Only stored in your browser
- **Export regularly**: No cloud backup (yet)
- **Private browsing**: Data lost when window closes
- **Clear storage**: Will delete all workspaces

## Next Steps

1. Create a few workspaces for different projects
2. Experiment with templates
3. Let the AI help you code
4. Export workspaces for backup
5. Share workspaces with others (via JSON export)

Happy coding! 🎉



