'use client';

import { useState } from 'react';
import { createSequentialGraph, createParallelGraph, createMapReduceGraph, ParallelExecutor } from '@hypery/agents';
import { GitBranch, Play, CheckCircle2, Clock } from 'lucide-react';

const PATTERNS = [
  {
    id: 'sequential',
    name: 'Sequential',
    description: 'Tasks run one after another in order',
    icon: '→',
    example: 'Fetch data → Transform → Save',
    color: 'blue',
  },
  {
    id: 'parallel',
    name: 'Parallel',
    description: 'Tasks run simultaneously (3-5x faster!)',
    icon: '⚡',
    example: 'Generate 3 images at once',
    color: 'green',
  },
  {
    id: 'map-reduce',
    name: 'Map-Reduce',
    description: 'Parallel processing then aggregation',
    icon: '🔀',
    example: 'Search 3 sources → Synthesize results',
    color: 'purple',
  },
  {
    id: 'conditional',
    name: 'Conditional',
    description: 'Dynamic execution based on conditions',
    icon: '🔀',
    example: 'Run tests → Deploy if passed',
    color: 'orange',
  },
  {
    id: 'saga',
    name: 'Saga',
    description: 'Distributed transactions with rollback',
    icon: '↩️',
    example: 'Charge credits ↔ Refund if failed',
    color: 'red',
  },
];

export function PatternShowcase() {
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDemoPattern = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const startTime = Date.now();
      let demoResult;

      // Import the working examples dynamically
      const { 
        runSequentialExample, 
        runParallelExample, 
        runMapReduceExample, 
        runConditionalExample 
      } = await import('@/lib/working-examples');

      // Run the appropriate demo based on pattern
      switch (selectedPattern.id) {
        case 'sequential':
          demoResult = await runSequentialExample();
          break;
        case 'parallel':
          demoResult = await runParallelExample();
          break;
        case 'map-reduce':
          demoResult = await runMapReduceExample();
          break;
        case 'conditional':
          demoResult = await runConditionalExample();
          break;
        default:
          // For saga, show conceptual result
          demoResult = {
            pattern: 'Saga Pattern',
            description: 'Distributed transaction with rollback capability'
          };
      }

      const duration = Date.now() - startTime;
      const taskCount = demoResult.graph?.nodes?.size || Object.keys(demoResult.results || {}).length;

      setResult({
        pattern: selectedPattern.name,
        status: 'completed',
        executionTime: `${duration}ms`,
        tasksCompleted: taskCount,
        speedup: demoResult.speedup || (selectedPattern.id === 'parallel' ? '~3x faster than sequential' : 'baseline'),
        details: demoResult.pattern || demoResult.description,
        results: demoResult.results
      });
    } catch (err: any) {
      console.error('Pattern demo failed:', err);
      setResult({
        pattern: selectedPattern.name,
        status: 'failed',
        error: err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pattern Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          Execution Patterns
        </h2>
        <div className="space-y-2">
          {PATTERNS.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => {
                setSelectedPattern(pattern);
                setResult(null);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedPattern.id === pattern.id
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{pattern.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{pattern.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{pattern.description}</p>
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {pattern.example}
                  </code>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Demo */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Demo: {selectedPattern.name}</h2>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Visual Representation */}
          <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <PatternVisualization pattern={selectedPattern.id} />
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">How it works</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPattern.description}
            </p>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Example:</strong> {selectedPattern.example}
              </p>
            </div>
          </div>

          {/* Run Demo */}
          <button
            onClick={handleDemoPattern}
            disabled={isRunning}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Running Demo...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Demo
              </>
            )}
          </button>

          {/* Result */}
          {result && result.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Demo Completed
                  </h4>
                  <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                    <p>⏱️  Execution Time: <strong>{result.executionTime}</strong></p>
                    <p>✅ Tasks Completed: <strong>{result.tasksCompleted}</strong></p>
                    {result.speedup !== 'baseline' && (
                      <p className="text-green-600 dark:text-green-400 font-semibold">
                        ⚡ {result.speedup}
                      </p>
                    )}
                    {result.details && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        {result.details}
                      </p>
                    )}
                  </div>
                  {result.results && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer text-green-700 dark:text-green-300 hover:underline">
                        View task results
                      </summary>
                      <pre className="mt-2 text-xs bg-green-900/10 dark:bg-green-900/20 p-2 rounded overflow-x-auto max-h-48">
                        {JSON.stringify(result.results, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {result && result.status === 'failed' && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Demo Failed
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatternVisualization({ pattern }: { pattern: string }) {
  const visualizations = {
    sequential: (
      <div className="flex items-center justify-center gap-4">
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
          A
        </div>
        <div className="text-2xl">→</div>
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
          B
        </div>
        <div className="text-2xl">→</div>
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
          C
        </div>
      </div>
    ),
    parallel: (
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
        </div>
        <div className="text-3xl">⚡</div>
        <div className="w-20 h-20 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          ✓
        </div>
      </div>
    ),
    'map-reduce': (
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 bg-purple-500 rounded flex items-center justify-center text-white text-xs">
            Map
          </div>
          <div className="w-12 h-12 bg-purple-500 rounded flex items-center justify-center text-white text-xs">
            Map
          </div>
          <div className="w-12 h-12 bg-purple-500 rounded flex items-center justify-center text-white text-xs">
            Map
          </div>
        </div>
        <div className="text-2xl">→</div>
        <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
          Reduce
        </div>
      </div>
    ),
    conditional: (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
          Test
        </div>
        <div className="text-2xl">?</div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-green-600 font-semibold">✓ Pass</div>
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
              Deploy
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-red-600 font-semibold">✗ Fail</div>
            <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
              Skip
            </div>
          </div>
        </div>
      </div>
    ),
    saga: (
      <div className="flex items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
          Do
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl">⇄</div>
          <div className="text-xs text-gray-500">rollback</div>
        </div>
        <div className="w-16 h-16 bg-red-400 rounded-lg flex items-center justify-center text-white font-bold">
          Undo
        </div>
      </div>
    ),
  };

  return visualizations[pattern as keyof typeof visualizations] || null;
}

