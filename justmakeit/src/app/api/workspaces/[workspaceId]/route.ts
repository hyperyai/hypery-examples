/**
 * Individual Workspace API - MCP-IDE
 * Backed by the local JSON file store (.data/workspaces.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
} from '@/lib/workspace-store';

function computeFileHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const workspace = await getWorkspace(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Build file manifest (path + hash + size, NO CONTENT!)
    const fileManifest: Record<string, { hash: string; size: number }> = {};
    const files = workspace.files || {};

    for (const [path, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        fileManifest[path] = {
          hash: computeFileHash(content),
          size: Buffer.byteLength(content, 'utf8'),
        };
      }
    }

    // Return workspace with file manifest instead of full content
    return NextResponse.json({
      success: true,
      data: {
        _id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        fileManifest, // Only metadata!
        chatThreads: workspace.chatThreads || [],
        activeChatId: workspace.activeChatId || null,
        settings: workspace.settings || {},
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error('GET workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get workspace' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const updates = await request.json();

    // The store merges file entries by path and metadata keys atomically,
    // matching the previous MongoDB dot-notation update behavior.
    const found = await updateWorkspace(workspaceId, updates);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const deleted = await deleteWorkspace(workspaceId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
