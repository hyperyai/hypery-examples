/**
 * Filesystem-backed workspace store.
 *
 * Persists workspaces to `.data/workspaces.json` (gitignored) so the demo
 * needs zero database setup. Writes are serialized in-process and performed
 * atomically (temp file + rename) — plenty for a single dev-server demo.
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface WorkspaceDoc {
  _id: string;
  name?: string;
  description?: string;
  files?: Record<string, string>;
  chatThreads?: unknown[];
  activeChatId?: string | null;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'workspaces.json');

// Serialize all read-modify-write cycles so concurrent route handlers
// can't interleave and drop each other's updates.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(op: () => Promise<T>): Promise<T> {
  const run = queue.then(op, op);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<WorkspaceDoc[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // first run — no data file yet
  }
}

async function writeAll(workspaces: WorkspaceDoc[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(workspaces, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

/** Metadata only — never returns file contents (they can be large). */
export function listWorkspaces(): Promise<
  Pick<WorkspaceDoc, '_id' | 'name' | 'description' | 'createdAt' | 'updatedAt'>[]
> {
  return enqueue(async () => {
    const all = await readAll();
    return all.map(({ _id, name, description, createdAt, updatedAt }) => ({
      _id,
      name,
      description,
      createdAt,
      updatedAt,
    }));
  });
}

/** Full documents, files included (recovery/export path). */
export function listWorkspacesWithFiles(): Promise<WorkspaceDoc[]> {
  return enqueue(readAll);
}

export function createWorkspace(
  workspace: Omit<WorkspaceDoc, '_id'>
): Promise<WorkspaceDoc> {
  return enqueue(async () => {
    const all = await readAll();
    const now = new Date().toISOString();
    const doc: WorkspaceDoc = {
      ...workspace,
      _id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    all.push(doc);
    await writeAll(all);
    return doc;
  });
}

export function getWorkspace(id: string): Promise<WorkspaceDoc | null> {
  return enqueue(async () => {
    const all = await readAll();
    return all.find((w) => w._id === id) ?? null;
  });
}

/**
 * Merge metadata and/or files into a workspace. File entries merge by path
 * (matching the previous MongoDB dot-notation behavior); metadata keys
 * overwrite. Returns false if the workspace doesn't exist.
 */
export function updateWorkspace(
  id: string,
  updates: Partial<WorkspaceDoc>
): Promise<boolean> {
  return enqueue(async () => {
    const all = await readAll();
    const doc = all.find((w) => w._id === id);
    if (!doc) return false;

    const { files, _id: _ignored, ...metadata } = updates;
    Object.assign(doc, metadata);
    if (files && Object.keys(files).length > 0) {
      doc.files = { ...(doc.files ?? {}), ...files };
    }
    doc.updatedAt = new Date().toISOString();
    await writeAll(all);
    return true;
  });
}

export function deleteWorkspace(id: string): Promise<boolean> {
  return enqueue(async () => {
    const all = await readAll();
    const next = all.filter((w) => w._id !== id);
    if (next.length === all.length) return false;
    await writeAll(next);
    return true;
  });
}
