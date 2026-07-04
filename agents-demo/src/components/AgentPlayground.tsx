'use client';

import { useState } from 'react';
import { AgentFactory, eventBus, type TaskGraph } from '@hypery/agents';
import { Bot, Sparkles, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const AGENTS = [
  {
    type: 'CodeAgent',
    name: 'Code Agent',
    icon: '👨‍💻',
    description: 'Specializes in software development and code generation',
    examples: [
      'Create a React Button component with TypeScript',
      'Write unit tests for a user authentication service',
      'Refactor a large function into smaller modules',
    ],
  },
  {
    type: 'DesignerAgent',
    name: 'Designer Agent',
    icon: '🎨',
    description: 'Specializes in visual content creation and UI/UX design',
    examples: [
      'Design a modern logo for a tech startup',
      'Create a color palette for a wellness app',
      'Generate three variations of a hero image',
    ],
  },
  {
    type: 'QAAgent',
    name: 'QA Agent',
    icon: '🧪',
    description: 'Specializes in testing and quality assurance',
    examples: [
      'Write integration tests for an API',
      'Find potential security vulnerabilities',
      'Analyze performance bottlenecks',
    ],
  },
  {
    type: 'ResearchAgent',
    name: 'Research Agent',
    icon: '🔬',
    description: 'Specializes in information gathering and analysis',
    examples: [
      'Research AI agent frameworks and compare features',
      'Summarize the latest trends in web development',
      'Find best practices for database optimization',
    ],
  },
  {
    type: 'DatabaseAgent',
    name: 'Database Agent',
    icon: '🗄️',
    description: 'Specializes in database design and optimization',
    examples: [
      'Design a schema for an e-commerce platform',
      'Write a migration to add user roles',
      'Optimize slow queries for a reporting system',
    ],
  },
  {
    type: 'DevOpsAgent',
    name: 'DevOps Agent',
    icon: '🚀',
    description: 'Specializes in deployment and infrastructure',
    examples: [
      'Create a Dockerfile for a Node.js application',
      'Setup CI/CD pipeline with GitHub Actions',
      'Configure Kubernetes deployment manifests',
    ],
  },
  {
    type: 'OrchestratorAgent',
    name: 'Orchestrator Agent',
    icon: '🎭',
    description: 'Coordinates other agents and manages complex workflows',
    examples: [
      'Build a full-stack todo app with React and Node.js',
      'Create a complete authentication system',
      'Setup a microservices architecture',
    ],
  },
];

export function AgentPlayground() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [task, setTask] = useState('');
  const [options, setOptions] = useState('{}');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setEvents([]);

    try {
      // Parse options
      let parsedOptions = {};
      if (options.trim()) {
        try {
          parsedOptions = JSON.parse(options);
        } catch (e) {
          throw new Error('Invalid JSON in options field');
        }
      }

      // Subscribe to events
      const eventListener = (event: any) => {
        setEvents((prev) => [...prev, event]);
      };
      eventBus.on('*', eventListener);

      const startTime = Date.now();

      // Create agent
      const agent = AgentFactory.create(selectedAgent.type, eventBus);
      
      console.log('🤖 Executing task:', { agent: selectedAgent.type, task, options: parsedOptions });

      // Actually use the agent to plan a task
      const taskGraph = await agent.plan(task, parsedOptions);
      
      console.log('📊 Task graph created:', {
        nodes: taskGraph.nodes.size,
        description: taskGraph.description
      });

      // Get real agent capabilities
      const capability = agent.getCapability();
      
      const duration = Date.now() - startTime;

      // Real result with agent details
      const agentResult = {
        status: 'completed',
        agent: selectedAgent.name,
        task,
        capability: {
          specialization: capability.specialization,
          tools: capability.tools,
          costMultiplier: capability.costMultiplier
        },
        graph: {
          nodeCount: taskGraph.nodes.size,
          description: taskGraph.description,
          priority: taskGraph.priority
        },
        output: `✅ Task planned successfully!\n\n` +
                `Agent: ${capability.name}\n` +
                `Specialization: ${capability.specialization}\n` +
                `Tools available: ${capability.tools.join(', ')}\n` +
                `Task nodes: ${taskGraph.nodes.size}\n` +
                `Priority: ${taskGraph.priority}\n\n` +
                `The agent has created a task graph with ${taskGraph.nodes.size} node(s) to accomplish: "${task}"`,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        eventsRecorded: events.length
      };

      setResult(agentResult);

      // Cleanup
      eventBus.off('*', eventListener);
    } catch (err: any) {
      console.error('❌ Error executing task:', err);
      setError(err.message || 'An error occurred during task execution');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Agent Selection */}
      <div className="lg:col-span-1">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          Select Agent
        </h2>
        <div className="space-y-2">
          {AGENTS.map((agent) => (
            <button
              key={agent.type}
              onClick={() => {
                setSelectedAgent(agent);
                setTask('');
                setResult(null);
                setError(null);
              }}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedAgent.type === agent.type
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 dark:border-indigo-400 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Task Input & Execution */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Configure Task
        </h2>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Agent Info */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{selectedAgent.icon}</span>
              <div>
                <h3 className="font-semibold">{selectedAgent.name}</h3>
                <p className="text-sm text-gray-500">{selectedAgent.description}</p>
              </div>
            </div>
          </div>

          {/* Example Tasks */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Example Tasks</label>
            <div className="flex flex-wrap gap-2">
              {selectedAgent.examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setTask(example)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Task Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Task Description</label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
            />
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Advanced Options (JSON)
            </label>
            <textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!task || isRunning}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing Task...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Task
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Task Completed Successfully
                  </h4>
                  <pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Execution Failed
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Execution Events ({events.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {events.map((event, i) => (
                  <div
                    key={i}
                    className="text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {event.name}
                    </span>
                    {' • '}
                    <span className="text-gray-500">{event.timestamp?.toISOString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

