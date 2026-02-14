/**
 * API Route: /api/generate
 *
 * Handles UI generation, rollback, and history requests.
 *
 * POST body:
 *   { action: "generate", sessionId, message }
 *   { action: "rollback",  sessionId, versionId }
 *   { action: "history",   sessionId }
 */

import { NextResponse } from 'next/server';
import { runAgent, rollback, getHistory } from '../../../agents/agent';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'generate': {
        const { message } = body;
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          return NextResponse.json(
            { error: 'message is required and must be a non-empty string' },
            { status: 400 }
          );
        }

        const result = await runAgent(sessionId, message.trim());
        return NextResponse.json({
          success: true,
          ...result,
        });
      }

      case 'rollback': {
        const { versionId } = body;
        if (!versionId || typeof versionId !== 'number') {
          return NextResponse.json(
            { error: 'versionId (number) is required for rollback' },
            { status: 400 }
          );
        }

        const result = await rollback(sessionId, versionId);
        return NextResponse.json({
          success: true,
          ...result,
        });
      }

      case 'history': {
        const history = getHistory(sessionId);
        return NextResponse.json({
          success: true,
          history,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: "${action}". Must be "generate", "rollback", or "history".` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}