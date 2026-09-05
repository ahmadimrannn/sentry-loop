'use server';

import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Send email OTP (one-time password) for passwordless authentication
 * auth.emailOtp.sendVerificationOtp(options) - Send OTP via email
 * Available when Email OTP authentication is enabled
 */
export async function sendEmailOtp(
  email: string,
  type: 'sign-in' | 'change-email' | 'email-verification' | 'forget-password' = 'sign-in'
): Promise<SendOtpState> {
  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    const { error } = await auth.emailOtp.sendVerificationOtp({
        email: email.toLowerCase(),
        type,
    });

    if (error) {
      console.error('Send OTP error:', {
        email,
        error: error.message,
        errorCode: (error as { code?: string; message?: string })?.code,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error cases
      if (error.message?.includes('too many')) {
        return { error: 'Too many OTP requests. Please try again later.' };
      }

      return { error: error.message || 'Failed to send OTP. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected send OTP error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Verify email with OTP code
 * auth.emailOtp.verifyEmail(credentials) - Verify email with OTP code
 */
export async function verifyEmailOtp(
  email: string,
  otp: string
): Promise<SendOtpState> {
  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    // Validate OTP
    if (!otp || otp.length < 4) {
      return { error: 'Please enter a valid OTP' };
    }

    const { error } = await auth.emailOtp.verifyEmail({
      email: email.toLowerCase(),
      otp,
    });

    if (error) {
      console.error('Verify OTP error:', {
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error cases
      if (error.message?.includes('expired')) {
        return { error: 'OTP has expired. Please request a new one.' };
      }

      if (error.message?.includes('invalid') || error.message?.includes('incorrect')) {
        return { error: 'Invalid OTP. Please check and try again.' };
      }

      if (error.message?.includes('not found')) {
        return { error: 'No OTP found for this email. Please request a new one.' };
      }

      return { error: error.message || 'Failed to verify OTP. Please try again.' };
    }
  } catch (error) {
    console.error('Unexpected verify OTP error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }

  // Redirect to dashboard after successful OTP verification
  redirect('/dashboard');
}

/**
 * Resend email OTP
 * Helper function to resend OTP to user's email
 */
export async function resendEmailOtp(email: string): Promise<SendOtpState> {
  return sendEmailOtp(email, 'sign-in');
}
