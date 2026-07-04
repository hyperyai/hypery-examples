# JustMakeIt.AI - Features & Keyboard Shortcuts

## ✨ New VS Code-Like Interface

Your JustMakeIt.AI now has a professional, VS Code-style interface with:

### 🎯 Resizable Panels
- **Drag to resize** any panel (sidebar, chat panel)
- **Double-click** the separator to reset to default size
- Panel sizes are **automatically saved** to localStorage

### 📑 Multi-File Tabs
- Open multiple files at once
- Tabs show file icons and names
- **Dirty indicator** (●) shows unsaved changes
- Click **×** to close individual tabs
- Tabs persist across sessions

### 🎨 Activity Bar
- Left sidebar with quick access icons
- File Explorer view
- Settings (coming soon)
- Search (coming soon)

### 🔄 Collapsible Panels
- **Hide/show sidebar** with button or keyboard shortcut
- **Hide/show chat panel** for maximum editor space
- Quick restore buttons when collapsed

## ⌨️ Keyboard Shortcuts

### File Management
- `⌘/Ctrl + S` - Save file (auto-saves on change)
- `⌘/Ctrl + W` - Close current tab
- `⌘/Ctrl + N` - New file *(coming soon)*

### Layout
- `⌘/Ctrl + B` - Toggle sidebar (file tree)
- `⌘/Ctrl + J` - Toggle bottom panel (chat)

### Navigation
- `⌘/Ctrl + P` - Command palette *(coming soon)*
- `⌘/Ctrl + Shift + P` - Command palette *(coming soon)*

### Tips
- Files **auto-save** as you type
- Use **AI chat** to create and edit files with natural language
- **Drag panel separators** to customize your workspace
- Panel sizes are **remembered** between sessions

## 🚀 Quick Start

1. **Create a workspace** if you haven't already
2. **Click a file** in the sidebar to open it (or ask AI to create one)
3. **Resize panels** by dragging the separators
4. **Use keyboard shortcuts** for faster workflow
5. **Chat with AI** in the bottom panel to edit files

## 🎨 Color Scheme
The IDE uses VS Code's default dark theme colors:
- Background: `#1E1E1E`
- Sidebar: `#252526`
- Borders: `#3E3E42`
- Active separator: `#007ACC` (VS Code blue)

## 🔧 Technical Details

### Technologies Used
- **Allotment** - VS Code's actual split view component
- **Monaco Editor** - VS Code's text editor
- **MCP Tools** - Model Context Protocol for AI interaction
- **Next.js 15** - React framework
- **TypeScript** - Type safety

### Performance
- Panels use efficient resize observers
- Monaco Editor lazy loads language features
- Chat state persists in localStorage
- File operations are debounced

## 📝 Coming Soon
- Command Palette (`⌘+P`)
- File search
- Multi-cursor editing
- Git integration
- Extensions/plugins
- Terminal panel
- Settings panel

