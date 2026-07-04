# MCP-IDE Plugin System

## Overview

The MCP-IDE now features a fully modular plugin system that allows you to add support for new content types (images, 3D models, audio, video, PDF, etc.) **without modifying core code**. Each plugin is self-contained and can provide viewers, editors, and tools.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Plugin System                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Image Plugin │    │  3D Plugin   │    │ Audio Plugin │ │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤ │
│  │ • Viewer     │    │ • Viewer     │    │ • Viewer     │ │
│  │ • Editor     │    │ •            │    │ •            │ │
│  │ • Tools      │    │ •            │    │ •            │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Video Plugin │    │  PDF Plugin  │    │ YOUR PLUGIN  │ │
│  │              │    │              │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Plugin Registry                         │
│  • Registers plugins                                        │
│  • Routes content to appropriate plugin                     │
│  • Manages plugin lifecycle                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Universal Content Viewer                       │
│  • Automatically selects correct plugin                     │
│  • Renders content using plugin component                   │
│  • Handles fallbacks                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

### ✅ **Modular**
- Add new content types without touching existing code
- Each plugin is self-contained
- No risk of breaking other plugins

### ✅ **Extensible**
- Support any content type (images, 3D, audio, video, PDFs, etc.)
- Add viewers, editors, generators, analyzers
- Plugins can provide their own MCP tools

### ✅ **Type-Safe**
- Full TypeScript support
- Clear plugin interfaces
- Compile-time checks

### ✅ **Hot-Swappable**
- Plugins can be registered/unregistered dynamically
- No need to restart the IDE

---

## Plugin Types

### 1. **Viewer Plugin**
Displays content in read-only mode.

**Use cases:**
- Image viewer
- 3D model viewer
- Audio player
- Video player
- PDF viewer

### 2. **Editor Plugin**
Allows modifying content with tools/operations.

**Use cases:**
- Photo editor (crop, resize, filters)
- 3D model editor (rotate, texture, lighting)
- Audio editor (trim, effects)
- Video editor (cut, effects)

### 3. **Generator Plugin**
Creates new content from prompts.

**Use cases:**
- AI image generator
- 3D model generator
- Music generator
- Video generator

---

## Creating a Plugin

### Example: PDF Viewer Plugin

```typescript
// src/lib/plugins/custom/pdf-plugin.tsx

'use client';

import React from 'react';
import { FileText, Download, ZoomIn, ZoomOut } from 'lucide-react';
import type { ViewerPlugin, ViewerComponentProps } from '../types';

/**
 * PDF Viewer Component
 */
function PDFViewer({ url, metadata, onLoad, onError }: ViewerComponentProps) {
  return (
    <div className="bg-gray-50 rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium">PDF Viewer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ZoomOut className="w-4 h-4" />
          </button>
          <a href={url} download className="p-1 hover:bg-gray-100 rounded">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Content */}
      <iframe
        src={url}
        className="w-full h-[600px]"
        onLoad={onLoad}
        onError={() => onError?.(new Error('Failed to load PDF'))}
      />
    </div>
  );
}

/**
 * PDF Viewer Plugin
 */
export const pdfViewerPlugin: ViewerPlugin = {
  id: 'pdf-viewer',
  name: 'PDF Viewer',
  description: 'View PDF documents',
  version: '1.0.0',
  contentTypes: ['pdf', 'document'],
  capabilities: ['viewer'],
  ViewerComponent: PDFViewer,
  supportedExtensions: ['.pdf'],
  canHandle: (url: string, contentType: string) => {
    return contentType === 'pdf' || /\.pdf$/i.test(url);
  },
};
```

### Register the Plugin

```typescript
// In Chat.tsx or wherever you initialize plugins

import { pdfViewerPlugin } from '@/lib/plugins/custom/pdf-plugin';

// Register during initialization
pluginRegistry.register(pdfViewerPlugin);
```

**That's it!** Your PDF viewer is now available system-wide. No changes to core code needed.

---

## Plugin Interfaces

### Viewer Plugin Interface

```typescript
interface ViewerPlugin extends Plugin {
  // Required
  ViewerComponent: React.ComponentType<ViewerComponentProps>;
  supportedExtensions: string[];
  
  // Optional
  canHandle?: (url: string, contentType: string) => boolean;
}
```

### Editor Plugin Interface

```typescript
interface EditorPlugin extends Plugin {
  // Required
  EditorComponent: React.ComponentType<EditorComponentProps>;
  operations: EditorOperation[];
  executeOperation: (
    operation: string,
    parameters: Record<string, any>,
    content: ContentData
  ) => Promise<ContentData>;
}
```

### Component Props

```typescript
// Viewer Component Props
interface ViewerComponentProps {
  url: string;
  contentId?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  actions?: ViewerAction[];
}

// Editor Component Props
interface EditorComponentProps extends ViewerComponentProps {
  content: ContentData;
  onChange?: (content: ContentData) => void;
  operations?: EditorOperation[];
  onExecuteOperation?: (operation: string, parameters: Record<string, any>) => void;
  readOnly?: boolean;
}
```

---

## Built-in Plugins

The MCP-IDE comes with several built-in plugins:

### 🎨 Image Plugin
- **Viewer**: Display images with zoom/pan
- **Editor**: Crop, resize, filters, AI tools
- **Content types**: `image`, `text-to-image`
- **Extensions**: `.jpg`, `.png`, `.gif`, `.webp`, `.svg`

### 🧊 3D Model Plugin
- **Viewer**: Display 3D models (placeholder for React Three Fiber)
- **Content types**: `3d-model`, `text-to-3d`
- **Extensions**: `.glb`, `.gltf`, `.obj`, `.fbx`, `.stl`

### 🎵 Audio Plugin
- **Viewer**: Audio player with waveform
- **Content types**: `audio`, `text-to-audio`
- **Extensions**: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`

---

## Advanced: Editor with Operations

### Example: Image Editor Plugin

```typescript
const imageOperations: EditorOperation[] = [
  {
    id: 'resize',
    name: 'Resize',
    description: 'Change image dimensions',
    icon: '↔️',
    category: 'transform',
    parameters: [
      { id: 'width', name: 'Width', type: 'number', default: 512 },
      { id: 'height', name: 'Height', type: 'number', default: 512 },
    ],
  },
  {
    id: 'crop',
    name: 'Crop',
    description: 'Cut out a portion',
    icon: '✂️',
    category: 'transform',
  },
  {
    id: 'brightness',
    name: 'Brightness',
    description: 'Adjust brightness',
    icon: '☀️',
    category: 'adjust',
    parameters: [
      { 
        id: 'value', 
        name: 'Value', 
        type: 'range', 
        default: 0, 
        min: -100, 
        max: 100 
      },
    ],
  },
];

export const imageEditorPlugin: EditorPlugin = {
  id: 'image-editor',
  name: 'Image Editor',
  description: 'Edit images with filters and adjustments',
  version: '1.0.0',
  contentTypes: ['image'],
  capabilities: ['editor', 'transformer'],
  EditorComponent: ImageEditor,
  operations: imageOperations,
  executeOperation: async (operation, parameters, content) => {
    // Call API to perform operation
    const response = await fetch('/api/v1/images/modify', {
      method: 'POST',
      body: JSON.stringify({
        imageId: content.metadata?.id,
        operation,
        parameters,
      }),
    });
    
    const result = await response.json();
    return {
      ...content,
      url: result.modifiedUrl,
    };
  },
};
```

---

## Providing MCP Tools

Plugins can provide their own MCP tools:

```typescript
import type { MCPToolHandler } from '@/lib/mcp/registry';

const pdfExtractTextTool: MCPToolHandler = {
  name: 'pdf_extract_text',
  description: 'Extract text from a PDF document',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL of the PDF' },
    },
    required: ['url'],
  },
  handler: async (args, context) => {
    // Extract text logic
    return {
      content: [{
        type: 'text',
        text: 'Extracted text here...',
      }],
      isError: false,
    };
  },
};

export const pdfPlugin: Plugin = {
  id: 'pdf-plugin',
  name: 'PDF Plugin',
  description: 'Handle PDF documents',
  version: '1.0.0',
  contentTypes: ['pdf'],
  capabilities: ['viewer', 'analyzer'],
  // Provide MCP tools
  tools: [pdfExtractTextTool],
};
```

These tools are automatically registered and available to the AI!

---

## Plugin Lifecycle

### 1. **Initialize**
```typescript
export const myPlugin: Plugin = {
  // ... plugin config ...
  initialize: async () => {
    console.log('Plugin initializing...');
    // Load resources, connect to services, etc.
  },
};
```

### 2. **Register**
```typescript
await pluginRegistry.register(myPlugin);
```

### 3. **Use**
```typescript
// Automatic! The system routes content to your plugin
```

### 4. **Cleanup**
```typescript
export const myPlugin: Plugin = {
  // ... plugin config ...
  cleanup: async () => {
    console.log('Plugin cleaning up...');
    // Release resources, disconnect services, etc.
  },
};
```

### 5. **Unregister**
```typescript
await pluginRegistry.unregister('my-plugin-id');
```

---

## Plugin Discovery

The system automatically discovers the right plugin for content:

```typescript
// Find viewer for an image
const plugin = pluginRegistry.findViewerForContent(
  'https://example.com/photo.jpg',
  'image'
);

// Find editor for 3D model
const editor = pluginRegistry.findEditorForContent('3d-model');

// Get all plugins with 'generator' capability
const generators = pluginRegistry.getPluginsByCapability('generator');
```

---

## Universal Content Viewer

The `UniversalContentViewer` component automatically selects and renders the appropriate plugin:

```typescript
// In your component
<UniversalContentViewer
  contentView={{
    type: '3d-model',
    url: 'https://example.com/spaceship.glb',
    mode: 'view',
    metadata: { format: 'glb', polyCount: 5000 },
  }}
  pluginRegistry={pluginRegistry}
/>
```

The viewer:
1. Finds the plugin that can handle `'3d-model'`
2. Renders it using the plugin's ViewerComponent
3. Shows a fallback if no plugin is found

---

## Integration with MCP Tools

Editor tools work seamlessly with the plugin system:

### Using `editor_open`
```
AI: "Let me open that 3D model for you"
[Calls editor_open tool]
Result: 3D model displayed using 3D plugin
```

### Using `editor_modify`
```
AI: "I'll rotate the model 90 degrees"
[Calls editor_modify tool]
Result: Plugin's executeOperation is called
```

### Using `editor_compare`
```
AI: "Let's compare the original and edited versions"
[Calls editor_compare tool]
Result: Two viewers displayed side-by-side
```

---

## Adding New Content Types

### Step 1: Create the Plugin

```bash
# Create your plugin file
touch src/lib/plugins/custom/video-plugin.tsx
```

### Step 2: Implement the Interface

```typescript
export const videoViewerPlugin: ViewerPlugin = {
  id: 'video-viewer',
  name: 'Video Player',
  description: 'Play video files',
  version: '1.0.0',
  contentTypes: ['video', 'text-to-video'],
  capabilities: ['viewer'],
  ViewerComponent: VideoViewer,
  supportedExtensions: ['.mp4', '.webm', '.mov'],
};
```

### Step 3: Register It

```typescript
// In Chat.tsx
import { videoViewerPlugin } from '@/lib/plugins/custom/video-plugin';

pluginRegistry.register(videoViewerPlugin);
```

### Step 4: Use It!

```
User: "Generate a product demo video"
AI: [Generates video using content_generate]
    [Video is displayed using your plugin automatically!]
```

**No changes to core code. No risk of breaking existing functionality.**

---

## Best Practices

### ✅ **Do's**

1. **Use TypeScript** - Full type safety prevents errors
2. **Handle errors gracefully** - Use onError callback
3. **Provide fallbacks** - Show loading/error states
4. **Follow naming conventions** - `contentType-capability` (e.g., `image-viewer`)
5. **Document your plugin** - Add comments and README
6. **Test independently** - Plugins are isolated
7. **Version your plugins** - Use semantic versioning

### ❌ **Don'ts**

1. **Don't modify core files** - Keep plugins self-contained
2. **Don't assume other plugins exist** - Each plugin should work independently
3. **Don't use global state** - Use plugin context instead
4. **Don't hardcode URLs** - Use configuration
5. **Don't ignore errors** - Always handle and report errors

---

## Plugin Examples

### Minimal Plugin (100 lines)

```typescript
import type { ViewerPlugin, ViewerComponentProps } from '../types';

function SimpleViewer({ url }: ViewerComponentProps) {
  return <div>Content: {url}</div>;
}

export const simplePlugin: ViewerPlugin = {
  id: 'simple',
  name: 'Simple Viewer',
  description: 'Minimal example',
  version: '1.0.0',
  contentTypes: ['text'],
  capabilities: ['viewer'],
  ViewerComponent: SimpleViewer,
  supportedExtensions: ['.txt'],
};
```

### Full-Featured Plugin (500+ lines)

See `src/lib/plugins/builtin/image-plugin.tsx` for a complete example with:
- Viewer with zoom/pan
- Editor with operations
- Custom toolbar
- Metadata display
- Error handling
- Loading states

---

## Future Enhancements

### Phase 1 (Current) ✅
- Plugin system architecture
- Viewer plugins
- Editor plugins
- Built-in plugins (image, 3D, audio)
- Universal content viewer
- MCP tool integration

### Phase 2 (Next)
- [ ] Plugin marketplace
- [ ] Plugin hot-reloading
- [ ] Plugin settings/configuration UI
- [ ] Plugin dependencies
- [ ] Plugin sandboxing

### Phase 3 (Future)
- [ ] Remote plugins (load from URL)
- [ ] Plugin analytics
- [ ] Plugin A/B testing
- [ ] Plugin monetization
- [ ] Community plugins

---

## Troubleshooting

### Plugin Not Found

**Problem:** Content shows "No viewer available"

**Solution:**
1. Check plugin is registered: `pluginRegistry.getAllPlugins()`
2. Verify contentTypes match exactly
3. Check canHandle logic if provided

### Plugin Not Rendering

**Problem:** Plugin registered but component doesn't show

**Solution:**
1. Check for TypeScript errors
2. Verify React component is valid
3. Check console for errors
4. Use React DevTools to inspect

### Operation Not Working

**Problem:** Editor operation fails

**Solution:**
1. Check executeOperation implementation
2. Verify API endpoint exists
3. Check parameters are correct
4. Add error logging

---

## Summary

The plugin system makes the MCP-IDE **truly extensible**:

- ✅ Add new content types without touching core code
- ✅ Each plugin is isolated and self-contained
- ✅ No risk of breaking other plugins
- ✅ Type-safe with TypeScript
- ✅ Automatic routing and discovery
- ✅ Seamless integration with MCP tools

**Start building your plugin today!** 🚀

---

## Resources

- **Plugin Types**: `/src/lib/plugins/types.ts`
- **Plugin Registry**: `/src/lib/plugins/registry.ts`
- **Built-in Plugins**: `/src/lib/plugins/builtin/`
- **Universal Viewer**: `/src/components/content/UniversalContentViewer.tsx`
- **Editor Tools**: `/src/lib/mcp/editor-tools.ts`

For questions or contributions, see our main README.

