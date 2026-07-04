# JustMakeIt.AI - AI-Powered Development Environment

A full-featured AI-powered IDE built with the Model Context Protocol (MCP), featuring multi-workspace support, Monaco Editor, and natural language control through chat.

## 🎯 Features

### Core IDE Features
- **Monaco Editor**: Professional code editor (same as VS Code) with:
  - Real-time syntax highlighting
  - IntelliSense & autocomplete
  - Auto-closing brackets/quotes
  - Format on paste/type
  - Line numbers & code folding
- **Multi-Workspace System**: Create unlimited projects with isolated files and chat history
- **Project Templates**: Quick start with React, Node.js, Python, HTML, or blank templates
- **localStorage Persistence**: All workspaces save automatically across sessions
- **Export/Import**: Share projects as JSON files

### MCP Tools
- **Chat as Control Center**: Natural language interface to the entire IDE
- **15+ Core Tools** across 3 categories:

#### Workspace Tools (6 tools)
  - `workspace_read` - Read file contents
  - `workspace_write` - Write/create files
  - `workspace_list` - List all files
  - `workspace_delete` - Delete files
  - `workspace_save_generated` - Save generated content to files
  - `context_get` - Query IDE state

#### Image Tools (3 tools)
  - `image_generate` - Generate images with AI
  - `image_status` - Check generation status
  - `image_list_models` - List available models

#### Capability & Routing Tools (3 tools) 🆕
  - `capability_discover` - Discover all available AI capabilities
  - `capability_plan` - Create intelligent plans for complex tasks
  - `content_generate` - Generate any content type with auto-routing

- **Workspace-Aware**: All tools operate on the active workspace
- **Tool Execution Visibility**: See exactly what tools the AI is calling
- **Intelligent Orchestration**: AI can discover, plan, and execute complex multi-step tasks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Hypery running on `http://localhost:3001` (or configure via env)
- Hypery API key

### Installation

```bash
cd apps/justmakeit
npm install
```

### Configuration

Create `.env.local`:

```bash
# Hypery URL (default: http://localhost:3001)
NEXT_PUBLIC_AI_GATEWAY_URL=http://localhost:3001

# Hypery API Key (get from your Hypery account)
AI_GATEWAY_API_KEY=your_api_key_here
```

### Run the IDE

```bash
npm run dev
```

Open [http://localhost:3004](http://localhost:3004)

## 💬 Example Prompts

Try these commands in the chat:

### Capability Discovery 🆕
- "What capabilities do you have?"
- "Show me available image models"
- "What can you help me create?"

### Intelligent Planning 🆕
- "Create a 3D platform game with music and image assets"
- "Build a product landing page with hero image and demo video"
- "Make an interactive data visualization with custom graphics"
- "Plan how you would create a music player app"

### Content Generation 🆕
- "Generate a futuristic cityscape image and save it"
- "Create background music for a game"
- "Generate a product demo video" (when implemented)

### Workspace Commands
- "Create a new workspace for a React todo app"
- "Show me all my workspaces"
- "Switch to my Python project"

### File Operations
- "Create a new file called app.js with a hello world function"
- "Add a button to index.html that shows an alert"
- "Show me what files exist"
- "Read the contents of style.css"
- "Delete script.js"
- "Refactor Button.tsx to use TypeScript interfaces"

### Advanced
- "Create a React component called UserCard with name and email props"
- "Add unit tests for the UserCard component"
- "Set up a Python Flask server with two routes"
- "Get the current workspace context"

## 🛠️ MCP Tools

All tools follow the Model Context Protocol specification:

### File Operations

**`resource_read`**
```json
{
  "uri": "file://index.html"
}
```

**`resource_write`**
```json
{
  "uri": "file://new-file.js",
  "content": "console.log('Hello');"
}
```

**`resource_list`**
```json
{}
```

**`resource_delete`**
```json
{
  "uri": "file://old-file.js"
}
```

### UI Operations

**`ui_update`**
```json
{
  "component": "editor",
  "action": "open",
  "data": { "path": "index.html" }
}
```

### Context Operations

**`context_get`**
```json
{
  "scope": "files" | "editor" | "workspace"
}
```

## 📦 Architecture

```
JustMakeIt.AI
├── @hypery/mcp (Core MCP library)
│   ├── Tool Registry
│   ├── Tool Executor
│   ├── JSON Schema Validator
│   └── Type Definitions
├── Components
│   ├── Chat (Control Center)
│   ├── Code Editor
│   ├── File Tree
│   └── Tool Call Display
├── MCP Tools
│   ├── Workspace Tools (file operations)
│   ├── Image Tools (image generation)
│   ├── Capability Tools (NEW: discovery & routing)
│   └── Context Tools
├── Intelligent Orchestration (NEW)
│   ├── Capability Discovery
│   ├── Multi-Step Planning
│   └── Automatic Tool Routing
└── Hypery Integration (port 3001)
    ├── /api/v1/models (model discovery)
    ├── /api/v1/chat/completions (text/code)
    ├── /api/v1/images/generate (images)
    └── Future: audio, video, 3D endpoints
```

## 🧪 Testing the Flow

1. Start the IDE
2. Try: "Create a file called test.html with a hello world page"
3. Watch the AI:
   - Call `resource_write` tool
   - Call `ui_update` tool to open the file
4. The file appears in the tree and opens in the editor
5. Try: "Add a button that says Click Me"
6. The AI updates the file content directly

## 🎯 New: Modular Plugin System

The MCP-IDE now features a **fully modular plugin system**! Add support for new content types (images, 3D models, audio, video, PDFs, etc.) **without modifying core code**.

See [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) for complete documentation.

**Key Features:**
- 🔌 Add new plugins without touching core code
- 🎨 Built-in viewers for images, 3D models, audio
- ✏️ Pluggable editors for content manipulation
- 🤖 AI can discover and use all plugins automatically
- 🧩 Each plugin is self-contained and isolated

## 🎯 Capability Discovery System

The MCP-IDE includes intelligent capability discovery and routing! See [CAPABILITY_SYSTEM.md](./CAPABILITY_SYSTEM.md) for full documentation.

**Key Features:**
- 🔍 Discover all available AI models and capabilities
- 🧠 Automatically plan complex multi-step tasks
- 🚀 Generate any content type with automatic routing
- 🎨 Create games, websites, media, and more with single prompts

**Quick Example:**
```
User: "Create a 3D platform game with music and image assets"

AI:
1. Discovers available capabilities (3D models, audio, images, code)
2. Creates execution plan
3. Generates 3D player model
4. Creates platform textures
5. Generates background music
6. Writes game engine code
7. Assembles everything into a working game!
```

## 📦 Quick Start

See [WORKSPACES_QUICKSTART.md](./WORKSPACES_QUICKSTART.md) for a detailed guide.

**TL;DR:**
1. Sign in with GitHub/Google
2. Click workspace dropdown → "New Workspace"
3. Choose a template (React, Node.js, Python, HTML, Blank)
4. Ask AI to code: "Create a React component called Button"
5. Edit files in Monaco Editor
6. Export workspace as JSON for backup

## 🔮 Future Enhancements

- [x] Monaco Editor integration ✅
- [x] File persistence (localStorage) ✅
- [x] Multi-workspace system ✅
- [x] Project templates ✅
- [x] Export/Import workspaces ✅
- [ ] Cloud sync (backend integration)
- [ ] HTML/CSS/JS preview panel
- [ ] Terminal integration
- [ ] Git operations via MCP tools
- [ ] External MCP server support
- [ ] Collaborative editing
- [ ] Extensions/plugins system

## 📚 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Hypery Documentation](../../../README.md)
- [MCP Package README](../../packages/hypery-mcp/README.md)

## 🎯 Key Takeaways

This IDE demonstrates:

1. **Chat as Universal Interface**: Everything is controlled through natural language
2. **MCP Standardization**: Tools follow a universal protocol
3. **Tool Composability**: Mix file, UI, and context tools seamlessly
4. **No Custom Logic Needed**: The AI figures out which tools to call
5. **Extensible**: Easy to add new tools following the MCP pattern

---

**Built with Model Context Protocol & Hypery** 🚀

