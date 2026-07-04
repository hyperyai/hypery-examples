# MCP-IDE Capability Discovery & Intelligent Routing System

## Overview

The MCP-IDE now includes an intelligent capability discovery and routing system that allows the AI to discover available tools/models and orchestrate complex multi-step tasks automatically.

## Key Features

### 🎯 Capability Discovery
Automatically discovers all available AI capabilities from the Hypery:
- Chat models (GPT-4, Claude, etc.)
- Image generation (Flux, Stable Diffusion, etc.)
- Audio generation
- Video generation
- 3D model generation
- And more...

### 🧠 Intelligent Planning
Creates multi-step execution plans for complex requests:
- Analyzes user intent
- Determines required capabilities
- Orders operations logically
- Suggests appropriate models for each step

### 🚀 Flexible Content Generation
Generates any type of content with automatic routing:
- Images → Routes to `/api/v1/images/generate`
- Code/Text → Routes to `/api/v1/chat/completions`
- Audio/Video/3D → Guides implementation or uses available endpoints

## New MCP Tools

### 1. `capability_discover`

**Purpose:** Discover all available AI capabilities and models

**Parameters:**
- `capability` (optional): Filter by specific type (chat, text-to-image, audio, video, text-to-3d)
- `limit` (optional): Max models per capability type (default: 5)

**Example Usage:**
```
User: "What capabilities do you have?"
AI: [Calls capability_discover]
     Returns grouped list of all available models by type
```

**Response Format:**
```
🎯 **Available AI Capabilities**

💬 **Chat & Text Generation** (50 models available)
  • openai/gpt-4o (openrouter) - $5.00/M tokens
  • anthropic/claude-3.5-sonnet (openrouter) - $3.00/M tokens
  ... and 48 more

🎨 **Image Generation** (25 models available)
  • black-forest-labs/flux-schnell (replicate)
  • stability-ai/stable-diffusion-3.5-large (replicate)
  ... and 23 more

🎵 **Audio Generation** (10 models available)
  ... and so on

💡 **Available Endpoints:**
• `/api/v1/chat/completions` - Text generation & chat
• `/api/v1/images/generate` - Image generation
• More endpoints available for audio, video, 3D
```

---

### 2. `capability_plan`

**Purpose:** Create an execution plan for complex multi-step requests

**Parameters:**
- `goal` (required): The high-level goal (e.g., "create a 3D platform game")
- `context` (optional): Additional context or requirements

**Example Usage:**
```
User: "Create a 3D platform game with music and image assets"
AI: [Calls capability_plan with goal]
     Returns detailed step-by-step execution plan
```

**Response Format:**
```
📋 **Execution Plan**

Goal: Create a 3D platform game with music and image assets

**Available Capabilities:**
- Chat & Text Generation: 50 models (best: openai/gpt-4o)
- Image Generation: 25 models (best: black-forest-labs/flux-schnell)
- Audio Generation: 10 models (best: meta/musicgen)
- 3D Generation: 5 models (best: shap-e)

**Execution Steps:**

1. **Generate Game Code Structure**
   - Tool: content_generate (type: code)
   - Model: openai/gpt-4o
   - Output: HTML5 Canvas game engine with physics

2. **Create 3D Player Model**
   - Tool: content_generate (type: 3d-model)
   - Model: shap-e
   - Prompt: "Low-poly character for platformer game"
   - Output: Save to workspace as player.glb

3. **Generate Platform Textures**
   - Tool: image_generate
   - Model: flux-schnell
   - Prompts: "stone platform texture", "grass platform", "metal platform"
   - Output: Save to workspace/assets/

4. **Create Background Music**
   - Tool: content_generate (type: audio)
   - Model: musicgen
   - Prompt: "Upbeat 8-bit style platformer background music"
   - Output: Save as music/background.mp3

5. **Assemble Game**
   - Tool: workspace_write
   - Combine all assets into working game
   - Create index.html with proper asset loading

**Next Steps:**
Execute each step in order, using the appropriate tools and saving outputs to the workspace.
```

---

### 3. `content_generate`

**Purpose:** Generate any type of content with automatic routing

**Parameters:**
- `type` (required): Content type (image, audio, video, 3d-model, code, text)
- `prompt` (required): Description of what to generate
- `model` (optional): Specific model to use
- `parameters` (optional): Additional parameters (width, height, duration, etc.)

**Supported Types:**
- `image` ✅ Fully implemented
- `code` ✅ Fully implemented
- `text` ✅ Fully implemented
- `3d-model` 🚧 Routes to API (requires endpoint implementation)
- `audio` 🚧 Routes to API (requires endpoint implementation)
- `video` 🚧 Routes to API (requires endpoint implementation)

**Example Usage:**

#### Generate Image:
```json
{
  "type": "image",
  "prompt": "A futuristic cityscape at sunset",
  "model": "black-forest-labs/flux-schnell",
  "parameters": {
    "width": 1024,
    "height": 768
  }
}
```

#### Generate Code:
```json
{
  "type": "code",
  "prompt": "Create a React component for a user profile card with avatar, name, and bio",
  "model": "openai/gpt-4o"
}
```

#### Generate 3D Model (when implemented):
```json
{
  "type": "3d-model",
  "prompt": "Low-poly tree for a game scene",
  "parameters": {
    "format": "glb",
    "polyCount": "low"
  }
}
```

---

## Usage Examples

### Example 1: Simple Capability Discovery
```
User: "What can you do?"
AI: Uses capability_discover to show all available capabilities
```

### Example 2: Complex Multi-Step Task
```
User: "Create me a 3D platform game with custom assets"

Step 1: AI calls capability_discover to understand available tools
Step 2: AI calls capability_plan to create execution plan
Step 3: AI executes plan step by step:
  - Generate game engine code (content_generate type:code)
  - Create 3D models (content_generate type:3d-model)
  - Generate textures (image_generate)
  - Create music (content_generate type:audio)
  - Save all to workspace (workspace_write)
  - Combine into working game
```

### Example 3: Product Showcase
```
User: "Build a product showcase webpage with images and video"

Step 1: AI plans the approach
Step 2: Generates HTML/CSS/JS code
Step 3: Creates product images
Step 4: Generates promotional video (when available)
Step 5: Assembles everything into workspace
```

### Example 4: Music Visualizer
```
User: "Create a music visualizer with custom audio"

Step 1: Discovers available capabilities
Step 2: Plans: audio generation + code + visuals
Step 3: Generates background music
Step 4: Creates visualizer graphics
Step 5: Writes JavaScript for visualization
Step 6: Combines into working demo
```

---

## Architecture

### Tool Registration Flow
```
Chat.tsx
  ├─> MCPRegistry
  │     ├─> workspaceTools (file operations)
  │     ├─> imageTools (image generation)
  │     └─> capabilityTools (NEW: discovery & routing)
  │           ├─> capability_discover
  │           ├─> capability_plan
  │           └─> content_generate
  │
  └─> Hypery API (port 3001)
        ├─> /api/v1/models (discover models)
        ├─> /api/v1/chat/completions (text/code)
        ├─> /api/v1/images/generate (images)
        └─> Future: audio, video, 3D endpoints
```

### Content Generation Routing
```
content_generate
  ├─> type: "image"  → /api/v1/images/generate
  ├─> type: "code"   → /api/v1/chat/completions
  ├─> type: "text"   → /api/v1/chat/completions
  ├─> type: "audio"  → /api/v1/audio/generate (TBD)
  ├─> type: "video"  → /api/v1/video/generate (TBD)
  └─> type: "3d"     → /api/v1/3d/generate (TBD)
```

---

## Extending with New Capabilities

### Adding Audio Generation Support

1. **Create API Endpoint** (`src/app/api/v1/audio/generate/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  // Similar to images/generate
  // Use Replicate or other provider
  // Return audio URL
}
```

2. **No Changes Needed to MCP Tools!**
   - `content_generate` already supports `type: 'audio'`
   - Just implement the endpoint and it works automatically

3. **Test**:
```
User: "Generate background music for my game"
AI: Calls content_generate with type: "audio"
    System routes to /api/v1/audio/generate
    Returns audio URL
    Saves to workspace
```

### Adding 3D Model Support

1. **Create API Endpoint** (`src/app/api/v1/3d/generate/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  // Use Replicate 3D models (shap-e, etc.)
  // Return 3D file URL (.glb, .obj, etc.)
}
```

2. **Test**:
```
User: "Create a 3D model of a spaceship"
AI: Calls content_generate with type: "3d-model"
    System routes to /api/v1/3d/generate
    Returns model URL
    Saves to workspace
```

---

## Implementation Details

### Model Type Mapping
The system recognizes these model types from the database:
- `chat` - Conversational AI models
- `text-to-image` - Image generation
- `image-to-image` - Image transformation
- `audio` - Audio generation
- `video` - Video generation
- `text-to-3d` - 3D model generation
- `other` - Miscellaneous capabilities

### Error Handling
- If a capability isn't implemented, the tool provides guidance:
  ```
  ⚠️ audio generation is not yet fully implemented in the API.
  
  To add support:
  1. Create /api/v1/audio/generate endpoint
  2. Integrate with appropriate providers
  3. Follow the pattern from image generation
  ```

### Cost Awareness
- `capability_discover` shows pricing per model
- Helps AI choose cost-effective models
- Displays as `$X.XX/M tokens` or similar

---

## System Prompt Enhancement

The general mode now has an enhanced system prompt that guides the AI to:
1. Use `capability_discover` to understand available tools
2. Use `capability_plan` for complex requests
3. Use appropriate tools in sequence
4. Think about multi-step orchestration

This enables the AI to handle complex requests like:
- "Create a complete game with assets"
- "Build a product showcase with media"
- "Generate a presentation with images and script"
- And much more!

---

## Benefits

### For Users
✅ Single request for complex tasks
✅ Automatic tool selection
✅ Intelligent orchestration
✅ Clear execution plans

### For Developers
✅ Easy to extend with new capabilities
✅ Clean separation of concerns
✅ Automatic routing
✅ Standardized tool interface

### For AI
✅ Discovers capabilities dynamically
✅ Plans optimal execution paths
✅ Handles multi-step tasks
✅ Provides clear feedback

---

## Testing

### Quick Test Prompts

1. **Discovery Test:**
   ```
   "What capabilities do you have?"
   ```

2. **Planning Test:**
   ```
   "Plan how you would create a 3D game with music"
   ```

3. **Simple Generation:**
   ```
   "Generate a space station image"
   ```

4. **Complex Task:**
   ```
   "Create a product landing page with hero image, feature icons, and demo video"
   ```

5. **Multi-Asset Task:**
   ```
   "Build a music player with custom UI graphics and sample tracks"
   ```

---

## Future Enhancements

### Phase 1 (Current) ✅
- Capability discovery
- Intelligent planning
- Image + code generation
- Flexible routing architecture

### Phase 2 (Next)
- [ ] Audio generation endpoint
- [ ] 3D model generation endpoint
- [ ] Video generation endpoint
- [ ] Batch generation support

### Phase 3 (Future)
- [ ] Real-time progress tracking
- [ ] Asset dependency management
- [ ] Automatic optimization
- [ ] Cost estimation before generation
- [ ] Caching for repeated requests
- [ ] Multi-provider fallback

---

## Conclusion

The capability discovery and routing system transforms the MCP-IDE into a comprehensive AI orchestration platform. Users can now request complex multi-step tasks and the AI will automatically discover, plan, and execute using the best available tools.

The system is designed to be easily extensible - just add new API endpoints and they integrate automatically through the routing system.

**Start using it now:**
1. Run MCP-IDE on port 3004
2. Ensure Hypery is running on port 3001
3. Try: "What can you do?" or "Create a 3D game for me"
4. Watch the AI discover, plan, and execute!

