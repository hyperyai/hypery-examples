/**
 * Workspace Templates
 * Pre-configured project templates for quick starts
 */

import type { WorkspaceTemplate } from '@/types/workspace';

export const WORKSPACE_TEMPLATES: Record<string, WorkspaceTemplate> = {
  blank: {
    name: 'Blank Project',
    description: 'Start from scratch with an empty workspace',
    files: {
      'README.md': '# New Project\n\nCreated with JustMakeIt.AI - an AI-powered development environment.\n',
    },
  },

  react: {
    name: 'React App',
    description: 'Modern React application with TypeScript',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'react-app',
          version: '1.0.0',
          private: true,
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            typescript: '^5.0.0',
          },
        },
        null,
        2
      ),
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            jsx: 'react-jsx',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
          },
        },
        null,
        2
      ),
      'src/App.tsx': `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>React App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
`,
      'src/index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`,
      'README.md': '# React App\n\nCreated with JustMakeIt.AI\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```\n',
    },
  },

  node: {
    name: 'Node.js Server',
    description: 'Express.js server with TypeScript',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'node-server',
          version: '1.0.0',
          main: 'dist/index.js',
          scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js',
          },
          dependencies: {
            express: '^4.18.0',
          },
          devDependencies: {
            '@types/express': '^4.17.0',
            '@types/node': '^20.0.0',
            typescript: '^5.0.0',
            tsx: '^4.0.0',
          },
        },
        null,
        2
      ),
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
          },
        },
        null,
        2
      ),
      'src/index.ts': `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Node.js server!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`,
      'README.md': '# Node.js Server\n\nExpress.js server with TypeScript\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```\n\n## API Endpoints\n\n- `GET /` - Welcome message\n- `GET /api/health` - Health check\n',
    },
  },

  python: {
    name: 'Python Project',
    description: 'Python application with FastAPI',
    files: {
      'requirements.txt': 'fastapi==0.104.0\nuvicorn[standard]==0.24.0\npydantic==2.5.0\n',
      'main.py': `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Python API")

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float

@app.get("/")
async def root():
    return {"message": "Hello from Python!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/items")
async def create_item(item: Item):
    return {"item": item, "id": 1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
      'README.md': '# Python Project\n\nFastAPI application\n\n## Getting Started\n\n```bash\npip install -r requirements.txt\npython main.py\n```\n\n## API Docs\n\nVisit http://localhost:8000/docs for interactive API documentation.\n',
    },
  },

  html: {
    name: 'Static Website',
    description: 'Simple HTML, CSS, and JavaScript website',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    
    <main>
        <section id="about">
            <h2>About</h2>
            <p>This is a static website created with JustMakeIt.AI.</p>
        </section>
        
        <section id="contact">
            <h2>Contact</h2>
            <p>Get in touch with us!</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2025 My Website</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
`,
      'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #2563eb;
    color: white;
    padding: 2rem;
    text-align: center;
}

nav {
    margin-top: 1rem;
}

nav a {
    color: white;
    margin: 0 1rem;
    text-decoration: none;
}

nav a:hover {
    text-decoration: underline;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin: 2rem 0;
}

h2 {
    color: #2563eb;
    margin-bottom: 1rem;
}

footer {
    background: #f3f4f6;
    padding: 2rem;
    text-align: center;
    margin-top: 4rem;
}
`,
      'script.js': `console.log('Website loaded!');

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
`,
      'README.md': '# Static Website\n\nA simple HTML, CSS, and JavaScript website.\n\n## Usage\n\nOpen `index.html` in your browser to view the website.\n',
    },
  },
};

export function getTemplateNames(): string[] {
  return Object.keys(WORKSPACE_TEMPLATES);
}

export function getTemplate(templateId: string): WorkspaceTemplate | null {
  return WORKSPACE_TEMPLATES[templateId] || null;
}



