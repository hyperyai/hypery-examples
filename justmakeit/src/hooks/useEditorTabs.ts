/**
 * Hook for managing open editor tabs
 */

'use client';

import { useState, useCallback } from 'react';
import type { EditorTab } from '@/types/workspace';

export function useEditorTabs() {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const openTab = useCallback((path: string) => {
    setTabs(prev => {
      // Check if tab already exists
      if (prev.find(tab => tab.path === path)) {
        setActiveTab(path);
        return prev;
      }
      
      // Create new tab
      const fileName = path.split('/').pop() || path;
      const newTab: EditorTab = {
        path,
        title: fileName,
        isDirty: false,
      };
      
      const newTabs = [...prev, newTab];
      setActiveTab(path);
      return newTabs;
    });
  }, []);

  const closeTab = useCallback((path: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.path !== path);
      
      // If closing active tab, switch to another
      if (activeTab === path) {
        const idx = prev.findIndex(tab => tab.path === path);
        if (filtered.length > 0) {
          const newActiveIdx = Math.min(idx, filtered.length - 1);
          setActiveTab(filtered[newActiveIdx].path);
        } else {
          setActiveTab(null);
        }
      }
      
      return filtered;
    });
  }, [activeTab]);

  const markDirty = useCallback((path: string, isDirty: boolean) => {
    setTabs(prev => prev.map(tab =>
      tab.path === path ? { ...tab, isDirty } : tab
    ));
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTab(null);
  }, []);

  return {
    tabs,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
    markDirty,
    closeAllTabs,
  };
}

