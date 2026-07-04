/**
 * Hook for persisting panel sizes to localStorage
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface PanelSizes {
  chatPanel: number;    // Left chat panel width
  filesPanel: number;   // Right files panel width
  terminalPanel: number; // Bottom terminal height
  sidebar: number;      // Sidebar width (for IDELayout)
  bottomPanel: number;  // Bottom panel height (for IDELayout)
}

const DEFAULT_SIZES: PanelSizes = {
  chatPanel: 25,      // 25% of screen width
  filesPanel: 20,     // 20% of editor area
  terminalPanel: 30,  // 30% of vertical space
  sidebar: 20,        // 20% of screen width
  bottomPanel: 30,    // 30% of vertical space
};

const STORAGE_KEY = 'justmakeit-panel-sizes';

export function usePanelSizes() {
  const [sizes, setSizes] = useState<PanelSizes>(() => {
    if (typeof window === 'undefined') return DEFAULT_SIZES;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SIZES;
    } catch {
      return DEFAULT_SIZES;
    }
  });

  const updateSizes = useCallback((updates: Partial<PanelSizes>) => {
    setSizes(prev => {
      const newSizes = { ...prev, ...updates };
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
      } catch (e) {
        console.warn('Failed to save panel sizes:', e);
      }
      
      return newSizes;
    });
  }, []);

  return {
    sizes,
    updateSizes,
  };
}

