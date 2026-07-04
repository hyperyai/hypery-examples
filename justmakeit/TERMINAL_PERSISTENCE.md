# Terminal Persistence Across Chat Threads

## Problem

When switching between chat threads, the Terminal (and WebContainer) was reloading unnecessarily. This caused:
- ❌ Loss of terminal state
- ❌ Reinstalling packages
- ❌ Losing running processes
- ❌ Poor user experience

## Architecture

### Correct Hierarchy:

```
Workspace (e.g., "My React App")
  ├── Files (shared across all chats)
  ├── Terminal/WebContainer (shared across all chats)
  └── Chat Threads (multiple conversations)
      ├── Thread 1: "Build homepage"
      ├── Thread 2: "Fix bugs"
      └── Thread 3: "Add tests"
```

### Key Concept:

**Chat threads are workspace-level features**, not separate workspaces. Multiple chats should:
- ✅ Edit the same files
- ✅ Share the same terminal session
- ✅ See each other's changes
- ✅ Work on the same project

Think of it like:
- **Workspace** = Your VS Code window
- **Chat Threads** = Different conversations with AI about the same project
- **Terminal** = Persistent shell that stays open regardless of which conversation you're in

## Solution

### 1. Added Key to Terminal Component

**File:** `/apps/justmakeit/src/components/layout/SimpleLayout.tsx`

```tsx
<Terminal 
  key={workspace.id}  // ← Key by workspace ID, not chat ID!
  onReady={() => {
    console.log('🎉 Terminal ready - files will be mounted');
  }} 
/>
```

### Why This Works:

React uses the `key` prop to determine component identity:

```tsx
// ❌ Without key: Terminal remounts on ANY SimpleLayout re-render
<Terminal />

// ✅ With workspace key: Terminal only remounts when workspace changes
<Terminal key={workspace.id} />
```

### When Terminal Remounts:

| Event | Workspace ID Changes? | Terminal Remounts? |
|-------|----------------------|-------------------|
| Switch chat thread | ❌ No | ❌ No |
| Edit files | ❌ No | ❌ No |
| Update chat messages | ❌ No | ❌ No |
| **Switch workspace** | ✅ Yes | ✅ Yes |

## File Syncing Still Works

The file mounting effect is already correctly scoped:

```tsx
useEffect(() => {
  // Mount files to WebContainer
  mountWorkspaceFiles();
}, [workspace.id]); // ← Only re-mounts files when workspace changes
```

This means:
- ✅ Files sync when workspace changes
- ✅ Files don't re-sync when chat changes
- ✅ File edits in one chat are visible in all chats (same workspace)

## Testing

### Test 1: Chat Persistence

1. **Open workspace** with files
2. **Open terminal** - note the session ID or run a command
3. **Switch to different chat thread**
4. **Check terminal** - should still have same session!

```bash
# In terminal
echo $$ # Note the process ID
```

Switch chats, check again:
```bash
echo $$ # Should be SAME process ID
```

### Test 2: Running Processes

1. **Start a dev server:**
   ```bash
   npm run dev
   ```

2. **Switch chat threads**

3. **Server should still be running!**
   - Check terminal - server logs continue
   - Open browser - app still accessible

### Test 3: Multi-Chat Collaboration

1. **Thread 1:** Create file `app.js`
   ```
   Ask AI: "Create a simple Express app in app.js"
   ```

2. **Switch to Thread 2**

3. **Check terminal:**
   ```bash
   cat app.js  # File exists!
   node app.js # Can run the file created in Thread 1
   ```

4. **Thread 2:** Add tests
   ```
   Ask AI: "Add tests for app.js"
   ```

5. **Switch back to Thread 1**

6. **Both files exist** - threads share workspace!

## Implementation Details

### Component Lifecycle:

```
IDEContent Component (workspace state)
  └── SimpleLayout Component
      ├── Chat Component (reads workspace.activeChatId)
      │   └── Messages for active thread only
      ├── Editor Component (reads workspace.files)
      │   └── Shows all files (shared)
      └── Terminal Component [key=workspace.id]
          └── WebContainer persists across chat switches
```

### State Management:

```typescript
// In IDEContent (page.tsx)
const activeWorkspace = workspaces[0]; // Has multiple threads

// In Chat component
const activeThread = workspace.chatThreads?.find(
  t => t.id === workspace.activeChatId
);
// Different thread = different messages
// Same workspace = same files, terminal
```

## Benefits

### Before Fix (Terminal Reloads):

```
User: [Thread 1] "npm install"
Terminal: Installing...
User: [Switch to Thread 2]
Terminal: ❌ REBOOTING... (loses progress)
User: [Back to Thread 1]
Terminal: ❌ REBOOTING AGAIN...
```

### After Fix (Terminal Persists):

```
User: [Thread 1] "npm install"
Terminal: Installing...
User: [Switch to Thread 2]
Terminal: ✅ STILL INSTALLING (persists)
User: [Back to Thread 1]
Terminal: ✅ INSTALLED (same session)
```

## Production Considerations

### Memory Management:

Since terminals persist per workspace, consider:

1. **Cleanup on workspace close:**
   ```tsx
   useEffect(() => {
     return () => {
       // Cleanup WebContainer when workspace unmounts
       if (webcontainerInstance) {
         webcontainerInstance.teardown?.();
       }
     };
   }, [workspace.id]);
   ```

2. **Max workspace limit:**
   - Limit active workspaces (e.g., 5 max)
   - Unload inactive workspaces after timeout
   - Show warning if too many open

3. **Resource monitoring:**
   - Monitor WebContainer memory usage
   - Show indicator if terminal becomes slow
   - Allow manual restart if needed

## Related Files

- ✅ `/apps/justmakeit/src/components/layout/SimpleLayout.tsx` - Terminal with workspace key
- ✅ `/apps/justmakeit/src/lib/terminal/webcontainer.ts` - Singleton WebContainer
- ✅ `/apps/justmakeit/src/components/chat/Chat.tsx` - Reads active thread from workspace
- ✅ `/apps/justmakeit/src/app/ide/page.tsx` - Manages workspace state

## Summary

**Problem:** Terminal reloaded when switching chat threads  
**Root Cause:** React remounting Terminal component unnecessarily  
**Solution:** Added `key={workspace.id}` to Terminal component  
**Result:** Terminal persists across chat switches, only resets on workspace change ✅

---

**Key Insight:** Chat threads are conversations about a workspace, not separate workspaces themselves. They should share the environment (files, terminal, etc.) to enable collaborative multi-threaded development.

Last Updated: October 19, 2025

