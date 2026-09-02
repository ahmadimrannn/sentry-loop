import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * OAuth callback handler
 * Receives the authorization code from OAuth provider and exchanges it for a session
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get the code and state from the query parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider') || 'github';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', {
        error,
        errorDescription,
        provider,
        timestamp: new Date().toISOString(),
      });

      const errorMessage = errorDescription || `${provider} authentication failed`;
      return redirect(`/auth/sign-in?error=${encodeURIComponent(errorMessage)}`);
    }

    // Validate that we have the required parameters
    if (!code || !state) {
      console.error('Missing OAuth parameters', {
        hasCode: !!code,
        hasState: !!state,
        provider,
        timestamp: new Date().toISOString(),
      });
      return redirect(`/auth/sign-in?error=Invalid OAuth response`);
    }

    // Get the current session to check if the OAuth flow succeeded
    const { data: session, error: sessionError } = await auth.getSession();

    if (sessionError || !session) {
      console.error('Failed to retrieve session after OAuth:', {
        sessionError: sessionError?.message,
        provider,
        timestamp: new Date().toISOString(),
      });
      return redirect(`/auth/sign-in?error=Failed to establish session`);
    }

    console.info('OAuth sign-in successful:', {
      provider,
      userEmail: session.user?.email,
      timestamp: new Date().toISOString(),
    });

    // Redirect to dashboard on successful authentication
    return redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return redirect(`/auth/sign-in?error=An unexpected error occurred during sign-in`);
  }
}
