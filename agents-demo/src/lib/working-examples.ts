/**
 * Working examples using @hypery/agents
 */

import {
  TaskGraphBuilder,
  createParallelGraph,
  createSequentialGraph,
  createMapReduceGraph,
  ParallelExecutor,
  eventBus,
  type TaskNode
} from '@hypery/agents';

// Mock tool handlers for demonstration
const mockToolHandlers: Record<string, (args: any) => Promise<any>> = {
  // File operations
  workspace_write: async (args: any) => {
    console.log('📝 Writing file:', args);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, path: args.path, size: args.content?.length || 0 };
  },
  
  workspace_read: async (args: any) => {
    console.log('📖 Reading file:', args);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, content: `// Mock content of ${args.path}` };
  },

  // Image generation
  image_generate: async (args: any) => {
    console.log('🎨 Generating image:', args);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      success: true, 
      url: `https://placeholder.com/generated/${args.prompt.slice(0, 10)}`,
      prompt: args.prompt,
      timestamp: new Date().toISOString()
    };
  },

  // Testing
  run_tests: async (args: any) => {
    console.log('🧪 Running tests:', args);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { 
      success: true, 
      passed: true,
      total: 42,
      failed: 0,
      duration: '1.5s'
    };
  },

  // Deployment
  deploy_to_production: async (args: any) => {
    console.log('🚀 Deploying:', args);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      success: true, 
      environment: 'production',
      version: 'v1.0.0',
      url: 'https://app.example.com'
    };
  },

  // API calls
  api_call: async (args: any) => {
    console.log('🌐 API call:', args);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { 
      success: true, 
      data: { items: [1, 2, 3, 4, 5] },
      status: 200
    };
  },

  // Data transformation
  transform: async (args: any) => {
    console.log('⚙️ Transforming data:', args);
    await new Promise(resolve => setTimeout(resolve, 400));
    return { 
      success: true, 
      transformed: `Transformed: ${JSON.stringify(args.data).slice(0, 50)}...`
    };
  },

  // Web search
  web_search: async (args: any) => {
    console.log('🔍 Searching:', args);
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { 
      success: true,
      results: [
        { title: 'Result 1', snippet: 'Lorem ipsum...' },
        { title: 'Result 2', snippet: 'Dolor sit amet...' },
        { title: 'Result 3', snippet: 'Consectetur adipiscing...' }
      ],
      source: args.source || 'web'
    };
  },

  // Synthesis
  synthesize: async (args: any) => {
    console.log('🔄 Synthesizing:', args);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      success: true,
      summary: 'Synthesized results from all sources. Key findings: AI agents are powerful, parallel execution is fast, task graphs enable complex workflows.'
    };
  },

  // Database operations
  design_schema: async (args: any) => {
    console.log('🗄️ Designing schema:', args);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      success: true,
      tables: args.entities?.map((e: string) => ({
        name: e,
        columns: ['id', 'created_at', 'updated_at']
      }))
    };
  },

  // Code analysis
  analyze_code: async (args: any) => {
    console.log('🔬 Analyzing code:', args);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { 
      success: true,
      issues: [],
      quality: 'A+',
      complexity: 'Low'
    };
  }
};

/**
 * Create a configured ParallelExecutor with mock tools
 */
export function createConfiguredExecutor() {
  const executor = new ParallelExecutor({
    maxConcurrency: 5,
    defaultTimeout: 30000,
    eventBus
  });

  // Register all mock tools
  Object.entries(mockToolHandlers).forEach(([name, handler]) => {
    executor.registerTool(name, handler);
  });

  return executor;
}

/**
 * Example 1: Simple Sequential Tasks
 */
export async function runSequentialExample() {
  console.log('📝 Running Sequential Example...');
  
  const graph = createSequentialGraph('sequential-demo', 'Write, read, and analyze a file', [
    {
      id: 'write',
      type: 'tool',
      executor: 'tool',
      action: 'workspace_write',
      arguments: { path: 'hello.ts', content: 'console.log("Hello World");' }
    },
    {
      id: 'read',
      type: 'tool',
      executor: 'tool',
      action: 'workspace_read',
      arguments: { path: 'hello.ts' }
    },
    {
      id: 'analyze',
      type: 'tool',
      executor: 'tool',
      action: 'analyze_code',
      arguments: { path: 'hello.ts' }
    }
  ]);

  const executor = createConfiguredExecutor();
  const results = await executor.executeGraph(graph);
  
  return {
    graph,
    results: Object.fromEntries(results)
  };
}

/**
 * Example 2: Parallel Image Generation (3x faster!)
 */
export async function runParallelExample() {
  console.log('🎨 Running Parallel Example...');
  
  const graph = createParallelGraph('parallel-images', 'Generate 3 images simultaneously', [
    {
      id: 'sunset',
      type: 'tool',
      executor: 'tool',
      action: 'image_generate',
      arguments: { prompt: 'Beautiful sunset over mountains' }
    },
    {
      id: 'forest',
      type: 'tool',
      executor: 'tool',
      action: 'image_generate',
      arguments: { prompt: 'Mystical forest with fireflies' }
    },
    {
      id: 'ocean',
      type: 'tool',
      executor: 'tool',
      action: 'image_generate',
      arguments: { prompt: 'Calm ocean at sunrise' }
    }
  ]);

  const startTime = Date.now();
  const executor = createConfiguredExecutor();
  const results = await executor.executeGraph(graph);
  const duration = Date.now() - startTime;
  
  return {
    graph,
    results: Object.fromEntries(results),
    duration: `${duration}ms`,
    speedup: 'All 3 images generated in parallel (~2s instead of ~6s sequential)'
  };
}

/**
 * Example 3: Map-Reduce Pattern
 */
export async function runMapReduceExample() {
  console.log('🔍 Running Map-Reduce Example...');
  
  const graph = createMapReduceGraph(
    'research-task',
    'Search multiple sources and synthesize results',
    // Map: Parallel searches
    [
      {
        id: 'search_academic',
        type: 'tool',
        executor: 'tool',
        action: 'web_search',
        arguments: { query: 'AI agents research', source: 'academic' }
      },
      {
        id: 'search_github',
        type: 'tool',
        executor: 'tool',
        action: 'web_search',
        arguments: { query: 'AI agent frameworks', source: 'github' }
      },
      {
        id: 'search_docs',
        type: 'tool',
        executor: 'tool',
        action: 'web_search',
        arguments: { query: 'agent orchestration', source: 'documentation' }
      }
    ],
    // Reduce: Synthesize
    {
      id: 'synthesize_results',
      type: 'tool',
      executor: 'tool',
      action: 'synthesize',
      arguments: {
        sources: [
          '{{search_academic.result}}',
          '{{search_github.result}}',
          '{{search_docs.result}}'
        ]
      }
    }
  );

  const executor = createConfiguredExecutor();
  const results = await executor.executeGraph(graph);
  
  return {
    graph,
    results: Object.fromEntries(results),
    pattern: 'Map-Reduce: 3 parallel searches + 1 synthesis'
  };
}

/**
 * Example 4: Conditional Execution
 */
export async function runConditionalExample() {
  console.log('🔀 Running Conditional Example...');
  
  const graph = new TaskGraphBuilder('conditional-deploy', 'Test and deploy if passed')
    .addNode({
      id: 'run_tests',
      type: 'tool',
      executor: 'tool',
      action: 'run_tests',
      arguments: { suite: 'all' },
      dependencies: [],
      status: 'pending'
    })
    .addNode({
      id: 'deploy',
      type: 'tool',
      executor: 'tool',
      action: 'deploy_to_production',
      arguments: { branch: 'main' },
      dependencies: ['run_tests'],
      status: 'pending',
      condition: {
        type: 'if',
        expression: 'run_tests.result.passed === true'
      }
    })
    .build();

  const executor = createConfiguredExecutor();
  const results = await executor.executeGraph(graph);
  
  return {
    graph,
    results: Object.fromEntries(results),
    pattern: 'Conditional: Deploy only if tests pass'
  };
}

/**
 * Example 5: Template Variables
 */
export async function runTemplateExample() {
  console.log('🔗 Running Template Variables Example...');
  
  const graph = new TaskGraphBuilder('template-demo', 'Fetch data, transform, and save')
    .addNode({
      id: 'fetch',
      type: 'tool',
      executor: 'tool',
      action: 'api_call',
      arguments: { url: 'https://api.example.com/data' },
      dependencies: [],
      status: 'pending'
    })
    .addNode({
      id: 'transform',
      type: 'tool',
      executor: 'tool',
      action: 'transform',
      arguments: {
        data: '{{fetch.result.data}}', // Reference previous result
        format: 'json'
      },
      dependencies: ['fetch'],
      status: 'pending'
    })
    .addNode({
      id: 'save',
      type: 'tool',
      executor: 'tool',
      action: 'workspace_write',
      arguments: {
        path: 'output.json',
        content: '{{transform.result.transformed}}' // Chain results
      },
      dependencies: ['transform'],
      status: 'pending'
    })
    .build();

  const executor = createConfiguredExecutor();
  const results = await executor.executeGraph(graph);
  
  return {
    graph,
    results: Object.fromEntries(results),
    pattern: 'Template Variables: Chain results between tasks'
  };
}

/**
 * Get all available examples
 */
export const WORKING_EXAMPLES = [
  {
    id: 'sequential',
    name: 'Sequential Tasks',
    description: 'Write → Read → Analyze (tasks run in order)',
    run: runSequentialExample
  },
  {
    id: 'parallel',
    name: 'Parallel Execution',
    description: '3 images generated simultaneously (3x faster!)',
    run: runParallelExample
  },
  {
    id: 'map-reduce',
    name: 'Map-Reduce Pattern',
    description: 'Search 3 sources → Synthesize results',
    run: runMapReduceExample
  },
  {
    id: 'conditional',
    name: 'Conditional Execution',
    description: 'Deploy only if tests pass',
    run: runConditionalExample
  },
  {
    id: 'template',
    name: 'Template Variables',
    description: 'Chain results: Fetch → Transform → Save',
    run: runTemplateExample
  }
];


