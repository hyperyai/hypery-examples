/**
 * Workspaces API - MCP-IDE
 * Stores workspaces in a local JSON file (.data/workspaces.json) — no database needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkspace,
  listWorkspaces,
  listWorkspacesWithFiles,
} from '@/lib/workspace-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFiles = searchParams.get('includeFiles') === 'true';

    // Recovery/export path: include full file contents
    if (includeFiles) {
      const workspaces = await listWorkspacesWithFiles();
      return NextResponse.json({ success: true, data: workspaces });
    }

    // Normal operation: only return metadata - NO FILES (too large)!
    const workspaces = await listWorkspaces();
    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    console.error('GET workspaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load workspaces' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await request.json();
    const doc = await createWorkspace(workspace);
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error('POST workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
