'use client';

import { Activity } from 'lucide-react';

export function EventMonitor() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="text-center">
        <Activity className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Event Monitor</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          Real-time feed of all system events including task starts, completions, agent delegations,
          and budget tracking.
        </p>
        <div className="inline-block bg-slate-100 dark:bg-slate-900 rounded-lg p-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-gray-500">No events yet</p>
          <p className="text-xs text-gray-400 mt-2">Execute a task to see events stream here in real-time</p>
        </div>
      </div>
    </div>
  );
}


