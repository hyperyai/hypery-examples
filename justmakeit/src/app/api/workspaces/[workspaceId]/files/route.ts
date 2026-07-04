/**
 * Workspace Files API - Lazy load file content
 * GET /api/workspaces/[workspaceId]/files?paths=file1.js,file2.js
 * Backed by the local JSON file store (.data/workspaces.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/workspace-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const pathsParam = searchParams.get('paths');

    if (!pathsParam) {
      return NextResponse.json(
        { success: false, error: 'Missing paths parameter' },
        { status: 400 }
      );
    }

    const paths = pathsParam.split(',');
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Extract requested file contents
    const files: Record<string, string> = {};
    const workspaceFiles = workspace.files || {};

    for (const path of paths) {
      if (workspaceFiles[path]) {
        files[path] = workspaceFiles[path];
      }
    }

    return NextResponse.json({ success: true, data: files });
  } catch (error) {
    console.error('GET files error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load files' },
      { status: 500 }
    );
  }
}
