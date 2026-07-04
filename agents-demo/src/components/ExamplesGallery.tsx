'use client';

import { useState } from 'react';
import { Lightbulb, Play, Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { WORKING_EXAMPLES } from '@/lib/working-examples';

export function ExamplesGallery() {
  const [runningExample, setRunningExample] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRunExample = async (exampleId: string) => {
    setRunningExample(exampleId);
    setErrors({ ...errors, [exampleId]: '' });

    try {
      const example = WORKING_EXAMPLES.find(e => e.id === exampleId);
      if (!example) throw new Error('Example not found');

      console.log(`🚀 Running example: ${example.name}`);
      const startTime = Date.now();
      
      const result = await example.run();
      const duration = Date.now() - startTime;

      console.log(`✅ Example completed in ${duration}ms:`, result);

      setResults({
        ...results,
        [exampleId]: {
          ...result,
          executionTime: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error(`❌ Example failed:`, err);
      setErrors({
        ...errors,
        [exampleId]: err.message || 'Execution failed'
      });
    } finally {
      setRunningExample(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-indigo-600" />
          Working Examples
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real demonstrations using <code className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-sm">@hypery/agents</code> with actual task graph execution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WORKING_EXAMPLES.map((example) => {
          const isRunning = runningExample === example.id;
          const result = results[example.id];
          const error = errors[example.id];

          return (
            <div
              key={example.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{example.name}</h3>
                  {example.id === 'parallel' && (
                    <Zap className="w-5 h-5 text-yellow-500" title="3x faster!" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {example.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRunExample(example.id)}
                disabled={isRunning}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mb-4"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Example
                  </>
                )}
              </button>

              {/* Result */}
              {result && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                        Completed
                      </h4>
                      <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {result.executionTime}
                        </p>
                        {result.graph && (
                          <p>
                            📊 {result.graph.nodes?.size || Object.keys(result.results || {}).length} tasks executed
                          </p>
                        )}
                        {result.speedup && (
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            ⚡ {result.speedup}
                          </p>
                        )}
                        {result.pattern && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {result.pattern}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show results summary */}
                  {result.results && Object.keys(result.results).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-green-700 dark:text-green-300 hover:underline">
                        View detailed results ({Object.keys(result.results).length} tasks)
                      </summary>
                      <pre className="mt-2 text-xs bg-green-900/10 dark:bg-green-900/20 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.results, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-1">
                        Failed
                      </h4>
                      <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> These examples use real task graphs with mock tools. 
          Watch your browser console to see the execution flow and event stream in real-time!
        </p>
      </div>
    </div>
  );
}
