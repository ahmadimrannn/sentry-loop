/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth/server';

interface SessionActionState {
  error?: string;
  success?: boolean;
  sessions?: any[];
}

/**
 * List all active sessions for the current user
 * auth.listSessions() - List all active sessions for the current user
 */
export async function listActiveSessions(): Promise<SessionActionState> {
  try {
    const { data: sessions, error } = await auth.listSessions();

    if (error) {
      console.error('List sessions error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to retrieve sessions. Please try again.' };
    }

    return { success: true, sessions: sessions || [] };
  } catch (error) {
    console.error('Unexpected list sessions error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Revoke a specific session by ID
 * auth.revokeSession(options) - Revoke a specific session by ID
 * Useful for signing out a session on another device
 */
export async function revokeSpecificSession(
  sessionId: string
): Promise<SessionActionState> {
  try {
    if (!sessionId || sessionId.trim().length === 0) {
      return { error: 'Session ID is required' };
    }

    const { error } = await auth.revokeSession({
      token: sessionId.trim(),
    });

    if (error) {
      console.error('Revoke session error:', {
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('not found')) {
        return { error: 'Session not found' };
      }

      return { error: error.message || 'Failed to revoke session. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected revoke session error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Revoke all sessions except the current one
 * auth.revokeOtherSessions() - Revoke all sessions except the current one
 * Useful for logging out from all other devices
 */
export async function revokeAllOtherSessions(): Promise<SessionActionState> {
  try {
    const { error } = await auth.revokeOtherSessions();

    if (error) {
      console.error('Revoke other sessions error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to revoke sessions. Please try again.' };
    }

    // Log this action for security
    console.warn('All other sessions revoked by user:', {
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Unexpected revoke other sessions error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
