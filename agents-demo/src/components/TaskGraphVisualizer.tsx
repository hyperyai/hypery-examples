'use client';

import { GitBranch } from 'lucide-react';

export function TaskGraphVisualizer() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="text-center">
        <GitBranch className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Task Graph Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          Interactive visualization of task dependencies and execution flow.
          Shows parallel execution, dependencies, and real-time progress.
        </p>
        <div className="inline-block bg-slate-100 dark:bg-slate-900 rounded-lg p-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-gray-500">Visualization coming soon...</p>
          <p className="text-xs text-gray-400 mt-2">Run a task in the Agent Playground to see it here</p>
        </div>
      </div>
    </div>
  );
}


