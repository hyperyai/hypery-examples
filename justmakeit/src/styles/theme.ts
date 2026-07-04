/**
 * Centralized Theme Configuration
 * Update colors here to change the entire app's appearance
 */

export const theme = {
  // Background colors
  bg: {
    primary: '#1E1E1E',      // Main background
    secondary: '#252526',    // Panels, headers
    tertiary: '#2D2D30',     // Hover states
    elevated: '#333333',     // Elevated elements
  },
  
  // Border colors
  border: {
    primary: '#3E3E42',      // Main borders
    secondary: '#454545',    // Secondary borders
    focus: '#007ACC',        // Focus/active borders
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',      // Primary text
    secondary: '#CCCCCC',    // Secondary text
    tertiary: '#969696',     // Tertiary/muted text
    disabled: '#6B6B6B',     // Disabled text
  },
  
  // Accent colors
  accent: {
    primary: '#007ACC',      // Primary accent (blue)
    hover: '#005A9E',        // Hover state
    success: '#4EC9B0',      // Success/green
    warning: '#CE9178',      // Warning/orange
    error: '#F48771',        // Error/red
    info: '#75BEFF',         // Info/light blue
  },
  
  // Status colors
  status: {
    success: '#89D185',      // Success indicator
    error: '#F14C4C',        // Error indicator
    warning: '#CCA700',      // Warning indicator
    info: '#75BEFF',         // Info indicator
  },
  
  // File tree colors
  fileTree: {
    hover: '#2A2D2E',        // Hover state
    active: '#37373D',       // Active/selected file
    folder: '#C5C5C5',       // Folder text
    file: '#CCCCCC',         // File text
  },
  
  // Terminal colors
  terminal: {
    bg: '#1E1E1E',           // Terminal background
    text: '#CCCCCC',         // Terminal text
    cursor: '#FFFFFF',       // Terminal cursor
  },
  
  // Button colors
  button: {
    primary: {
      bg: '#0E639C',         // Primary button background
      hover: '#1177BB',      // Primary button hover
      text: '#FFFFFF',       // Primary button text
    },
    secondary: {
      bg: '#3E3E42',         // Secondary button background
      hover: '#505050',      // Secondary button hover
      text: '#CCCCCC',       // Secondary button text
    },
    danger: {
      bg: '#C72E0F',         // Danger button background
      hover: '#E03E1C',      // Danger button hover
      text: '#FFFFFF',       // Danger button text
    },
  },
  
  // Input colors
  input: {
    bg: '#3C3C3C',           // Input background
    border: '#454545',       // Input border
    focus: '#007ACC',        // Input focus border
    text: '#CCCCCC',         // Input text
    placeholder: '#767676',  // Placeholder text
  },
  
  // Spacing (can be used for consistent padding/margins)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
  },
  
  // Border radius
  radius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
  },
  
  // Font sizes
  fontSize: {
    xs: '0.688rem',   // 11px
    sm: '0.75rem',    // 12px
    base: '0.813rem', // 13px
    md: '0.875rem',   // 14px
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
  },
  
  // Transitions
  transition: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

// Export as CSS variables for use in Tailwind or plain CSS
export const themeToCSSVariables = () => {
  return {
    '--bg-primary': theme.bg.primary,
    '--bg-secondary': theme.bg.secondary,
    '--bg-tertiary': theme.bg.tertiary,
    '--bg-elevated': theme.bg.elevated,
    
    '--border-primary': theme.border.primary,
    '--border-secondary': theme.border.secondary,
    '--border-focus': theme.border.focus,
    
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-tertiary': theme.text.tertiary,
    '--text-disabled': theme.text.disabled,
    
    '--accent-primary': theme.accent.primary,
    '--accent-hover': theme.accent.hover,
    '--accent-success': theme.accent.success,
    '--accent-warning': theme.accent.warning,
    '--accent-error': theme.accent.error,
    
    '--status-success': theme.status.success,
    '--status-error': theme.status.error,
    '--status-warning': theme.status.warning,
    '--status-info': theme.status.info,
  };
};

// Helper to apply theme as inline styles
export const applyThemeStyles = (element: HTMLElement) => {
  const cssVars = themeToCSSVariables();
  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

