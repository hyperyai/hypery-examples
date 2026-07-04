# JustMakeIt.AI Theme System

## Overview

JustMakeIt.AI uses a centralized theme system that makes it easy to customize colors, spacing, and other design tokens across the entire application.

## Quick Start

### Changing Colors

To change the color scheme, edit `/src/styles/theme.ts` or `/src/app/globals.css`:

```typescript
// In theme.ts
export const theme = {
  bg: {
    primary: '#1E1E1E',    // Change this to your desired background color
    secondary: '#252526',  // Panel backgrounds
    // ...
  },
  // ...
};
```

```css
/* In globals.css */
:root {
  --bg-primary: #1E1E1E;  /* Change here for immediate effect */
  --accent-primary: #007ACC;
  /* ... */
}
```

## Usage

### In React Components

#### Option 1: Use Tailwind classes with CSS variables

```tsx
<div className="bg-[var(--bg-primary)] text-[var(--text-secondary)]">
  Hello World
</div>
```

#### Option 2: Use utility classes

```tsx
<div className="ide-bg-primary ide-text-secondary">
  Hello World
</div>
```

#### Option 3: Use TypeScript theme object

```tsx
import { theme } from '@/styles/theme';

<div style={{ 
  backgroundColor: theme.bg.primary,
  color: theme.text.secondary 
}}>
  Hello World
</div>
```

### Button Styles

```tsx
// Primary button
<button className="ide-btn ide-btn-primary">
  Click me
</button>

// Danger button
<button className="ide-btn ide-btn-danger">
  Delete
</button>

// Custom button with theme colors
<button className="px-4 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)]">
  Custom
</button>
```

### Panel Styles

```tsx
<div className="ide-panel">
  <div className="ide-panel-header">
    Panel Title
  </div>
  <div className="p-4">
    Panel content
  </div>
</div>
```

## Theme Structure

### Colors

- **Background**: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-elevated`
- **Border**: `--border-primary`, `--border-secondary`, `--border-focus`
- **Text**: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`
- **Accent**: `--accent-primary`, `--accent-hover`, `--accent-success`, `--accent-warning`, `--accent-error`
- **Status**: `--status-success`, `--status-error`, `--status-warning`, `--status-info`

### Spacing

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 24px

### Border Radius

- `--radius-sm`: 2px
- `--radius-md`: 4px
- `--radius-lg`: 6px

### Transitions

- `--transition-fast`: 100ms
- `--transition-normal`: 200ms
- `--transition-slow`: 300ms

## Pre-made Themes

### VS Code Dark (Current)

```css
:root {
  --bg-primary: #1E1E1E;
  --bg-secondary: #252526;
  --accent-primary: #007ACC;
  /* ... see globals.css for full theme */
}
```

### VS Code Light (Example)

```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F3F3F3;
  --bg-tertiary: #E8E8E8;
  --border-primary: #CCCCCC;
  --text-primary: #000000;
  --text-secondary: #333333;
  --accent-primary: #005FB8;
  /* ... */
}
```

### GitHub Dark (Example)

```css
:root {
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;
  --border-primary: #30363D;
  --text-primary: #C9D1D9;
  --text-secondary: #8B949E;
  --accent-primary: #58A6FF;
  /* ... */
}
```

## Migrating Existing Components

### Before (Hardcoded colors)

```tsx
<div className="bg-[#1E1E1E] border-[#3E3E42] text-gray-400">
  Content
</div>
```

### After (Using theme)

```tsx
<div className="bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-tertiary)]">
  Content
</div>
```

Or even better:

```tsx
<div className="ide-bg-primary ide-border ide-text-tertiary">
  Content
</div>
```

## Best Practices

1. **Always use theme variables** instead of hardcoded colors
2. **Use semantic color names** (e.g., `--accent-primary` instead of `--blue`)
3. **Test theme changes** across all components
4. **Document custom colors** if you add new ones
5. **Keep theme.ts and globals.css in sync**

## Creating a New Theme

1. Copy the current `:root` section in `globals.css`
2. Create a new CSS class (e.g., `.theme-light`)
3. Replace all color values
4. Apply the class to `<body>` or root element

```css
.theme-light {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F3F3F3;
  /* ... all other variables */
}
```

```tsx
<body className="theme-light">
  {/* Your app */}
</body>
```

