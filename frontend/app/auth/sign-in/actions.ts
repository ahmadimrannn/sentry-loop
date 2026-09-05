'use server';

import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { EMAIL_REGEX } from '@/constants';


// Simple in-memory rate limiting (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Validates email format
 */
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validates password presence
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length === 0) {
    return { valid: false, error: 'Password cannot be empty' };
  }

  return { valid: true };
}

/**
 * Check if email is rate limited
 */
function isRateLimited(email: string): { limited: boolean; error?: string } {
  const attempt = loginAttempts.get(email);
  const now = Date.now();

  if (!attempt) {
    return { limited: false };
  }

  // Reset if lockout duration has passed
  if (now - attempt.timestamp > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(email);
    return { limited: false };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION_MS - (now - attempt.timestamp)) / 60000);
    return {
      limited: true,
      error: `Too many login attempts. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
    };
  }

  return { limited: false };
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const attempt = loginAttempts.get(email);
  const now = Date.now();

  if (!attempt || now - attempt.timestamp > LOCKOUT_DURATION_MS) {
    loginAttempts.set(email, { count: 1, timestamp: now });
  } else {
    attempt.count += 1;
    attempt.timestamp = now;
  }
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

/**
 * Sign in with email - production-level implementation using Neon Auth
 * auth.signIn.email(credentials) - Sign in with email and password
 */
export async function signInWithEmail(
  _prevState: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  try {
    // Extract form data
    const email = (formData.get('email') as string)?.trim().toLowerCase() || '';
    const password = (formData.get('password') as string) || '';

    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { error: passwordValidation.error };
    }

    // Check rate limiting
    const rateLimitCheck = isRateLimited(email);
    if (rateLimitCheck.limited) {
      console.warn('Rate limit exceeded for email:', {
        email,
        timestamp: new Date().toISOString(),
      });
      return { error: rateLimitCheck.error };
    }

    // Attempt to sign in using Neon Auth
    // auth.signIn.email(credentials) - Sign in with email and password
    const { error } = await auth.signIn.email({
      email,
      password,
    });

    if (error) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(email);

      // Log security event
      console.warn('Failed sign in attempt:', {
        email,
        errorMessage: error.message,
        errorCode: (error as { code?: string; message?: string })?.code,
        timestamp: new Date().toISOString(),
      });

      // Use generic error message for security (don't reveal if account exists)
      return {
        error: 'Invalid email or password. Please try again.',
      };
    }

    // Clear login attempts on successful login
    clearLoginAttempts(email);

    // Log successful login
    console.info('Successful sign in:', {
      email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log unexpected errors
    console.error('Unexpected sign in error:', {
      error,
      timestamp: new Date().toISOString(),
    });

    return {
      error: 'An unexpected error occurred. Please try again later.',
    };
  }

  // Redirect to dashboard after successful signin
  redirect('/dashboard');
}

/**
 * Sign in with social provider (OAuth)
 * auth.signIn.social(options) - Sign in with OAuth provider
 * Returns authorization URL to redirect to
 */

export async function signInWithSocial(provider: 'google' | 'github'): Promise<never> {
  let targetUrl: string | null = null;

  try {
    const { data, error } = await auth.signIn.social({
      provider,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sentryloop.vercel.app'}/dashboard`,
    });

    if (error || !data) {
      console.error(`Sign in with ${provider} error:`, {
        error: error?.message || 'No data received',
        timestamp: new Date().toISOString(),
      });
      targetUrl = `/auth/sign-in?error=Failed to initiate ${provider} sign in`;
    } else {
      // Handle response structure safely
      targetUrl = (typeof data === 'string' ? data : data?.url) ?? null;
    }
  } catch (error) {
    console.error(`Unexpected ${provider} sign in error:`, {
      error,
      timestamp: new Date().toISOString(),
    });
    targetUrl = `/auth/sign-in?error=An unexpected error occurred`;
  }

  // Execute redirect OUTSIDE the try/catch block
  if (targetUrl) {
    redirect(targetUrl);
  }

  throw new Error('Unhandled auth redirect state');
}

/**
 * Sign in with email OTP (one-time password)
 * auth.signIn.emailOtp(credentials) - Sign in with email OTP
 * First call sendEmailOtp() to send the code
 */
export async function signInWithEmailOtp(
  email: string,
  otp: string
): Promise<SignInState> {
  try {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    if (!otp || otp.length < 4) {
      return { error: 'Please enter a valid OTP' };
    }

    const { error } = await auth.signIn.emailOtp({
      email: email.toLowerCase(),
      otp,
    });

    if (error) {
      console.error('OTP sign in error:', {
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Invalid OTP. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected OTP sign in error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Get current session
 * auth.getSession() - Retrieve current session in Server Actions
 * Returns cached session if available (fast), automatically refreshes expired tokens
 */
export async function getCurrentSession() {
  try {
    const { data: session, error } = await auth.getSession();

    if (error) {
      console.error('Get session error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { session: null, error: 'Failed to get session' };
    }

    return { session, error: null };
  } catch (error) {
    console.error('Unexpected get session error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { session: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out current user
 * auth.signOut() - Sign out the current user, clears session and auth tokens
 */
export async function signOut(): Promise<SignInState> {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'Failed to sign out. Please try again.' };
  }
  // Redirect after signout
  redirect('/auth/sign-in');
}