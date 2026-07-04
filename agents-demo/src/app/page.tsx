'use client';

import { useState } from 'react';
import { AgentPlayground } from '@/components/AgentPlayground';
import { ExamplesGallery } from '@/components/ExamplesGallery';
import { TaskGraphVisualizer } from '@/components/TaskGraphVisualizer';
import { EventMonitor } from '@/components/EventMonitor';
import { PatternShowcase } from '@/components/PatternShowcase';
import { Bot, Sparkles, GitBranch, Activity, Lightbulb } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'playground' | 'patterns' | 'examples' | 'visualizer' | 'events'>('playground');

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Hypery Agents
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Advanced multi-agent orchestration with parallel execution, DAG-based task graphs, and intelligent delegation.
          <span className="block mt-2 text-sm text-gray-500">
            🚀 Execute tasks <strong>3-5x faster</strong> with parallel processing
          </span>
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        {[
          { label: '7 Agents', value: 'Specialized', icon: Bot },
          { label: 'Parallel', value: '3-5x Faster', icon: Activity },
          { label: 'Patterns', value: '5 Advanced', icon: GitBranch },
          { label: 'Examples', value: '20+ Ready', icon: Sparkles },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { id: 'playground', label: 'Agent Playground', icon: Bot },
          { id: 'patterns', label: 'Patterns', icon: GitBranch },
          { id: 'examples', label: 'Examples', icon: Lightbulb },
          { id: 'visualizer', label: 'Task Graph', icon: GitBranch },
          { id: 'events', label: 'Event Monitor', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'playground' && <AgentPlayground />}
        {activeTab === 'patterns' && <PatternShowcase />}
        {activeTab === 'examples' && <ExamplesGallery />}
        {activeTab === 'visualizer' && <TaskGraphVisualizer />}
        {activeTab === 'events' && <EventMonitor />}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Built with <span className="text-red-500">❤</span> using{' '}
          <code className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">@hypery/agents</code>
        </p>
        <p className="mt-2">
          <a href="https://github.com/yourusername/hypery" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            View on GitHub
          </a>
          {' • '}
          <a href="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Documentation
          </a>
        </p>
      </footer>
    </main>
  );
}


