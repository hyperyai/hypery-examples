/**
 * Agentic Orchestration Layer
 * Enables autonomous multi-step task execution with TODO lists and parallel reasoning
 */

export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  steps: AgentStep[];
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentStep {
  id: string;
  description: string;
  tool: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
  dependencies: string[]; // Step IDs that must complete first
  parallel?: boolean; // Can run in parallel with siblings
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  waitFor?: {
    type: 'poll' | 'time';
    pollInterval?: number;
    pollTool?: string;
    arguments?: Record<string, any>; // Arguments for the poll tool (can use templates)
    duration?: number;
    condition?: string; // JavaScript condition to evaluate
  };
}

export interface AgentContext {
  workspace: any;
  taskHistory: AgentTask[];
  sharedState: Record<string, any>;
  capabilities: string[];
}

/**
 * Task Planner - Uses LLM to break down complex requests
 */
export class TaskPlanner {
  async plan(
    userRequest: string,
    context: AgentContext,
    callLLM: (messages: any[]) => Promise<any>
  ): Promise<AgentTask> {
    const planPrompt = `You are a task planning AI. Break down the user's request into executable steps.

User Request: "${userRequest}"

Available Tools: ${context.capabilities.join(', ')}

Create a JSON plan with this structure:
{
  "description": "Overall task description",
  "steps": [
    {
      "id": "step_1",
      "description": "What this step does",
      "tool": "tool_name",
      "arguments": { /* tool args with exact parameter names, use "{{step_N.result.field}}" for dependencies */ },
      "dependencies": [], // Array of step IDs that must complete first
      "parallel": false // Can run in parallel?
    }
  ]
}

CRITICAL RULES:
1. Use {{step_N.result.field}} syntax to reference previous step results
2. For image_generate tool: use "prompt" parameter (NOT "description")
3. For image_status tool: use "imageId" parameter with {{step_N.result.metadata.imageId}}
4. For saving images: use workspace_save_generated with filename, contentUrl={{imageUrl}}, contentType="image"
5. Mark steps as parallel: true if they can run concurrently
6. Keep steps atomic and focused
7. Image generation is ASYNC - use image_status to check completion before saving

Example for image tasks:
{
  "description": "Generate and save an image",
  "steps": [
    {
      "id": "step_1",
      "tool": "image_generate",
      "arguments": { "prompt": "detailed description here" },
      "dependencies": []
    },
    {
      "id": "step_2",
      "tool": "image_status",
      "arguments": { "imageId": "{{step_1.result.metadata.imageId}}" },
      "dependencies": ["step_1"]
    },
    {
      "id": "step_3",
      "tool": "workspace_save_generated",
      "arguments": {
        "filename": "image.png",
        "contentUrl": "{{step_2.result.imageUrl}}",
        "contentType": "image"
      },
      "dependencies": ["step_2"]
    }
  ]
}

NOTE: For images, use workspace_save_generated with the image URL. The IDE will display it as an actual image.

Return ONLY the JSON, no explanation.`;

    const response = await callLLM([
      {
        role: 'system',
        content: 'You are a task planning assistant. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: planPrompt
      }
    ]);

    // Parse the plan from the LLM response
    let planData: any;
    try {
      // Try to extract JSON from the response
      const content = response.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse plan:', error);
      // Fallback to simple single-step plan
      planData = {
        description: userRequest,
        steps: [{
          id: 'step_1',
          description: userRequest,
          tool: 'general_response',
          arguments: { message: userRequest },
          dependencies: [],
          parallel: false
        }]
      };
    }

    // Create the task
    const task: AgentTask = {
      id: `task_${Date.now()}`,
      description: planData.description || userRequest,
      status: 'pending',
      steps: planData.steps.map((step: any, index: number) => ({
        id: step.id || `step_${index + 1}`,
        description: step.description,
        tool: step.tool,
        arguments: step.arguments || {},
        status: 'pending' as const,
        dependencies: step.dependencies || [],
        parallel: step.parallel || false,
        retryCount: 0,
        maxRetries: step.maxRetries || 2,
        waitFor: step.waitFor
      })),
      createdAt: new Date()
    };

    return task;
  }
}

/**
 * Task Executor - Runs tasks autonomously with parallel execution
 */
export class TaskExecutor {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  async execute(
    task: AgentTask,
    context: AgentContext,
    executeTool: (tool: string, args: any) => Promise<any>,
    onStepUpdate?: (step: AgentStep) => void,
    onTaskUpdate?: (task: AgentTask) => void
  ): Promise<AgentTask> {
    task.status = 'in_progress';
    onTaskUpdate?.(task);

    try {
      // Execute steps in dependency order
      await this.executeSteps(task, context, executeTool, onStepUpdate);

      // Check if all steps completed
      const allCompleted = task.steps.every(s => s.status === 'completed');
      const anyFailed = task.steps.some(s => s.status === 'failed');

      if (allCompleted) {
        task.status = 'completed';
        task.completedAt = new Date();
        // Collect results from all steps
        task.result = task.steps.reduce((acc, step) => {
          acc[step.id] = step.result;
          return acc;
        }, {} as Record<string, any>);
      } else if (anyFailed) {
        task.status = 'failed';
        task.error = 'One or more steps failed';
      }

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      // Clean up any polling intervals
      this.pollingIntervals.forEach(interval => clearInterval(interval));
      this.pollingIntervals.clear();
      onTaskUpdate?.(task);
    }

    return task;
  }

  private async executeSteps(
    task: AgentTask,
    context: AgentContext,
    executeTool: (tool: string, args: any) => Promise<any>,
    onStepUpdate?: (step: AgentStep) => void
  ): Promise<void> {
    // Group steps by dependency level
    const levels = this.topologicalSort(task.steps);

    // Execute each level (parallel within level, sequential across levels)
    for (const level of levels) {
      const parallelSteps = level.filter(s => s.parallel);
      const sequentialSteps = level.filter(s => !s.parallel);

      // Execute parallel steps concurrently
      if (parallelSteps.length > 0) {
        await Promise.all(
          parallelSteps.map(step => 
            this.executeStep(step, task, context, executeTool, onStepUpdate)
          )
        );
      }

      // Execute sequential steps one by one
      for (const step of sequentialSteps) {
        await this.executeStep(step, task, context, executeTool, onStepUpdate);
      }
    }
  }

  private async executeStep(
    step: AgentStep,
    task: AgentTask,
    context: AgentContext,
    executeTool: (tool: string, args: any) => Promise<any>,
    onStepUpdate?: (step: AgentStep) => void
  ): Promise<void> {
    step.status = 'running';
    onStepUpdate?.(step);

    try {
      // Resolve template arguments ({{step_N.result.field}})
      const resolvedArgs = this.resolveArguments(step.arguments, task.steps);

      // Execute the tool
      const result = await executeTool(step.tool, resolvedArgs);
      step.result = result;

      // Handle async operations (polling)
      if (step.waitFor) {
        step.status = 'waiting';
        onStepUpdate?.(step);
        await this.handleWaitFor(step, task, context, executeTool, onStepUpdate);
      }

      step.status = 'completed';
      onStepUpdate?.(step);

    } catch (error) {
      step.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (step.retryCount < step.maxRetries) {
        step.retryCount++;
        console.log(`Retrying step ${step.id} (attempt ${step.retryCount}/${step.maxRetries})`);
        await this.executeStep(step, task, context, executeTool, onStepUpdate);
      } else {
        step.status = 'failed';
        onStepUpdate?.(step);
        throw error;
      }
    }
  }

  private async handleWaitFor(
    step: AgentStep,
    task: AgentTask,
    context: AgentContext,
    executeTool: (tool: string, args: any) => Promise<any>,
    onStepUpdate?: (step: AgentStep) => void
  ): Promise<void> {
    if (!step.waitFor) return;

    if (step.waitFor.type === 'time') {
      // Simple time-based wait
      await new Promise(resolve => setTimeout(resolve, step.waitFor!.duration || 1000));
    } else if (step.waitFor.type === 'poll') {
      // Poll until condition is met
      await this.pollUntilComplete(step, task, executeTool, onStepUpdate);
    }
  }

  private async pollUntilComplete(
    step: AgentStep,
    task: AgentTask,
    executeTool: (tool: string, args: any) => Promise<any>,
    onStepUpdate?: (step: AgentStep) => void
  ): Promise<void> {
    const pollInterval = step.waitFor?.pollInterval || 2000;
    const pollTool = step.waitFor?.pollTool;
    const condition = step.waitFor?.condition;

    if (!pollTool) return;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          // Resolve poll tool arguments - pass the entire step result for reference
          const pollArgs = this.resolveArguments(
            step.waitFor?.arguments || { imageId: step.result?.metadata?.imageId || step.result?.imageId || step.result?.id },
            task.steps
          );

          // Validate required arguments before calling tool
          if (pollTool === 'image_status' && !pollArgs.imageId) {
            console.error('[Polling] Missing imageId for image_status. Step result:', step.result);
            clearInterval(interval);
            this.pollingIntervals.delete(step.id);
            reject(new Error('Missing imageId for polling'));
            return;
          }

          const pollResult = await executeTool(pollTool, pollArgs);

          // Check condition
          let conditionMet = true;
          if (condition) {
            try {
              // Safely evaluate condition
              const evalFunc = new Function('result', `return ${condition}`);
              conditionMet = evalFunc(pollResult);
            } catch (error) {
              console.error('Condition evaluation failed:', error);
            }
          }

          if (conditionMet) {
            clearInterval(interval);
            this.pollingIntervals.delete(step.id);
            step.result = pollResult;
            resolve();
          }
        } catch (error) {
          clearInterval(interval);
          this.pollingIntervals.delete(step.id);
          reject(error);
        }
      }, pollInterval);

      this.pollingIntervals.set(step.id, interval);
    });
  }

  private resolveArguments(
    args: Record<string, any>,
    completedSteps: AgentStep[]
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Template string: {{step_1.result.imageUrl}}
        resolved[key] = this.resolveTemplate(value, completedSteps);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively resolve nested objects
        resolved[key] = this.resolveArguments(value, completedSteps);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private resolveTemplate(template: string, steps: AgentStep[]): any {
    // Extract {{step_1.result.field}} patterns
    const matches = template.matchAll(/\{\{(.+?)\}\}/g);
    let result = template;

    for (const match of matches) {
      const path = match[1].trim();
      const value = this.getValueFromPath(path, steps);
      result = result.replace(match[0], value !== undefined ? String(value) : '');
    }

    return result;
  }

  private getValueFromPath(path: string, steps: AgentStep[]): any {
    // Path format: step_1.result.field
    const parts = path.split('.');
    const stepId = parts[0];
    const step = steps.find(s => s.id === stepId);

    if (!step) return undefined;

    let current: any = step;
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object') {
        current = current[parts[i]];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private topologicalSort(steps: AgentStep[]): AgentStep[][] {
    const levels: AgentStep[][] = [];
    const visited = new Set<string>();
    const stepMap = new Map(steps.map(s => [s.id, s]));

    // Find steps with no dependencies (level 0)
    let currentLevel = steps.filter(s => s.dependencies.length === 0);

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      currentLevel.forEach(s => visited.add(s.id));

      // Find next level (steps whose dependencies are all visited)
      const nextLevel = steps.filter(step => {
        if (visited.has(step.id)) return false;
        return step.dependencies.every(depId => visited.has(depId));
      });

      currentLevel = nextLevel;
    }

    return levels;
  }
}

