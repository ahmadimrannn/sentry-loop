'use server';

import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

// Validation constants
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignUpState {
  error?: string;
  success?: boolean;
}

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
 * Validates password strength
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters` };
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }

  return { valid: true };
}

/**
 * Validates user name
 */
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Full name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { valid: false, error: `Name must be at least ${MIN_NAME_LENGTH} characters` };
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must not exceed ${MAX_NAME_LENGTH} characters` };
  }

  // Basic check for valid name characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Sign up with email - production-level implementation using Neon Auth
 * auth.signUp.email() - Create a new user account with email and password
 */
export async function signUpWithEmail(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState> {
  let email = '';
  try {
    // Extract form data
    email = (formData.get('email') as string)?.trim().toLowerCase() || '';
    const password = (formData.get('password') as string) || '';
    const name = (formData.get('name') as string)?.trim() || '';

    // Validate all inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { error: passwordValidation.error };
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return { error: nameValidation.error };
    }

    // Optionally restrict sign ups based on email domain
    // if (!email.endsWith("@my-company.com")) {
    //   return { error: 'Email must be from a company domain' };
    // }

    // Attempt to sign up using Neon Auth
    // auth.signUp.email(credentials) - Create a new user account
    const { error } = await auth.signUp.email({
      email,
      name,
      password,
    });

    if (error) {
      // Handle specific error cases
      if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
        return { error: 'This email is already registered. Please sign in or use a different email.' };
      }

      if (error.message?.includes('validation')) {
        return { error: 'Invalid account information. Please check your details and try again.' };
      }

      if (error.message?.includes('network') || error.message?.includes('connection')) {
        return { error: 'Network error. Please check your connection and try again.' };
      }

      // Log error for monitoring
      console.error('Sign up error:', {
        email,
        errorMessage: error.message,
        errorCode: (error as { code?: string; message?: string })?.code,
        timestamp: new Date().toISOString(),
      });

      return { error: error.message || 'Failed to create account. Please try again.' };
    }
  } catch (error) {
    // Log unexpected errors
    console.error('Unexpected sign up error:', {
      error,
      timestamp: new Date().toISOString(),
    });

    return { error: 'An unexpected error occurred. Please try again later.' };
  }

  // Account created successfully - redirect to OTP verification page
  redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
}

/**
 * Send verification email to new user
 * auth.sendVerificationEmail(options) - Send email verification to the current user
 */
export async function sendVerificationEmail(
  email: string,
  callbackURL?: string
): Promise<SignUpState> {
  try {
    const { error } = await auth.sendVerificationEmail({
      email,
      callbackURL: callbackURL || '/dashboard',
    });

    if (error) {
      console.error('Send verification email error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to send verification email. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error sending verification email:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}