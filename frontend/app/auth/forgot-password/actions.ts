'use server';

import { auth } from '@/lib/auth/server';
import { EMAIL_REGEX } from '@/constants';

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

export async function sendPasswordResetEmail(
  _prevState: ForgotPasswordState | null,
  formData: FormData
): Promise<ForgotPasswordState> {
  try {
    // Extract form data
    const email = (formData.get('email') as string)?.trim().toLowerCase() || '';

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    // Send password reset OTP via email
    const { error } = await auth.emailOtp.sendVerificationOtp({
      email,
      type: 'forget-password',
    });

    if (error) {
      // Log error for monitoring
      console.error('Send password reset email error:', {
        email,
        errorMessage: error.message,
        errorCode: (error as { code?: string; message?: string })?.code,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('network') || error.message?.includes('connection')) {
        return {
          error: 'Network error. Please check your connection and try again.',
        };
      }

      // Use generic message for security (don't reveal if account exists)
      return {
        error: 'If an account exists with this email, you will receive password reset instructions shortly.',
      };
    }

    // Log successful send
    console.info('Password reset email sent:', {
      email,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.',
    };
  } catch (error) {
    // Log unexpected errors
    console.error('Unexpected password reset email error:', {
      error,
      timestamp: new Date().toISOString(),
    });

    return {
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}
