# Hypery Agents Demo

> ⚠️ **Work in progress — this demo does not build yet.** It was written against
> the planned `@hypery/agents` orchestration library, which is **not yet**
> **published**. The code here shows the intended API surface (task graphs,
> parallel executors, agent factory, event bus) and will come alive when the
> library ships. It is excluded from this repo's CI.

🤖 Interactive demonstration of the `@hypery/agents` orchestration system

## Features

- ✨ **7 Specialized Agents** - Code, Designer, QA, Research, Database, DevOps, Orchestrator
- 🔄 **Parallel Execution** - 3-5x faster task execution
- 📊 **Visual Task Graphs** - See DAG execution in real-time
- 🎯 **Pattern Library** - Sequential, Parallel, Map-Reduce, Saga, Actor Model
- 📡 **Event Monitoring** - Real-time execution events
- 🎨 **Interactive UI** - Try agents with custom tasks
- 📚 **Examples** - 20+ pre-built examples to learn from

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:3008
```

## Demo Sections

### 1. Agent Playground
Try each specialized agent with custom tasks:
- **CodeAgent**: Generate components, write tests, refactor code
- **DesignerAgent**: Create logos, design UI, generate images
- **QAAgent**: Write tests, find bugs, analyze performance
- **ResearchAgent**: Gather information, summarize docs
- **DatabaseAgent**: Design schemas, write migrations
- **DevOpsAgent**: Create Dockerfiles, setup CI/CD
- **OrchestratorAgent**: Coordinate complex workflows

### 2. Pattern Demonstrations
See advanced patterns in action:
- **Sequential** - Tasks run in order
- **Parallel** - Tasks run concurrently (3x faster!)
- **Map-Reduce** - Parallel processing + aggregation
- **Conditional** - Dynamic execution based on results
- **Saga** - Distributed transactions with rollback
- **Actor Model** - Agent-to-agent communication

### 3. Real-World Examples
Complete working examples:
- Build a full-stack todo app
- Generate a design system
- Research and summarize topics
- Deploy with Docker
- Create database migrations
- And more...

### 4. Task Graph Visualizer
Interactive visualization showing:
- Node dependencies
- Parallel execution
- Completion progress
- Execution times
- Error states

### 5. Event Monitor
Real-time feed of all system events:
- Task starts/completions
- Agent delegations
- Tool executions
- Budget tracking
- Human input requests

## Architecture

```
┌──────────────────────────────────────────────┐
│         Agent Orchestration Layer            │
│  ┌────────────┬──────────────┬────────────┐  │
│  │ Code Agent │ Design Agent │ QA Agent   │  │
│  └────────────┴──────────────┴────────────┘  │
│  ┌────────────┬──────────────┬────────────┐  │
│  │ Research   │ Database     │ DevOps     │  │
│  └────────────┴──────────────┴────────────┘  │
│  ┌─────────────────────────────────────────┐ │
│  │      Orchestrator Agent                 │ │
│  └─────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│         Execution Engine (DAG-based)         │
│  - Parallel Executor                         │
│  - Event Bus                                 │
│  - Task Graph Builder                        │
├──────────────────────────────────────────────┤
│         Pattern Library                      │
│  - Saga (Rollback)                          │
│  - Actor Model (Communication)              │
│  - Map-Reduce                               │
└──────────────────────────────────────────────┘
```

## Examples

### Simple Task
```typescript
const graph = new TaskGraphBuilder('hello', 'Print hello')
  .addNode({
    id: 'print',
    type: 'tool',
    executor: 'tool',
    action: 'console_log',
    arguments: { message: 'Hello, Agents!' }
  })
  .build();
```

### Parallel Execution
```typescript
const graph = createParallelGraph('images', 'Generate images', [
  { id: 'img1', action: 'image_generate', arguments: { prompt: 'sunset' } },
  { id: 'img2', action: 'image_generate', arguments: { prompt: 'forest' } },
  { id: 'img3', action: 'image_generate', arguments: { prompt: 'ocean' } }
]);
// All 3 images generate simultaneously!
```

### Agent Execution
```typescript
const agent = AgentFactory.create('CodeAgent', eventBus);
await agent.executeAutonomously('Create React component', {
  name: 'Button',
  props: ['onClick', 'children']
});
```

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide** - Icons
- **@hypery/agents** - Agent orchestration

## Key Components

### Agent Panel
Select and configure agents with custom tasks and options.

### Task Graph Builder
Visual builder for creating complex workflows.

### Execution Monitor
Real-time monitoring of task execution with metrics.

### Event Stream
Live feed of all system events.

### Examples Gallery
Browse and run pre-built examples.

## Performance

**Sequential vs Parallel:**
- Sequential: 60s (20s + 20s + 20s)
- Parallel: 20s (20s || 20s || 20s)
- **Result: 3x faster!**

## Use Cases

1. **Development Automation**
   - Generate boilerplate code
   - Write tests
   - Refactor codebases

2. **Content Creation**
   - Generate images
   - Create design systems
   - Build UI prototypes

3. **Research & Analysis**
   - Gather information
   - Summarize documents
   - Compare options

4. **Infrastructure**
   - Setup Docker containers
   - Configure CI/CD
   - Deploy applications

5. **Database Work**
   - Design schemas
   - Write migrations
   - Optimize queries

## Learn More

- **`@hypery/agents`** — the orchestration library this demo previews. Not yet published; watch [hypery.ai](https://hypery.ai) for availability.
- **Hypery docs**: https://docs.hypery.ai

## License

MIT


