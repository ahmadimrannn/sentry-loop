'use server';

import { auth } from '@/lib/auth/server';

interface AccountActionState {
  error?: string;
  success?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

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
 * Change password for current user
 * auth.changePassword(passwords) - Change the current user's password
 * Requires current password for security verification
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  revokeOtherSessions: boolean = false
): Promise<AccountActionState> {
  try {
    // Validate current password
    if (!currentPassword) {
      return { error: 'Current password is required' };
    }

    // Validate new password
    const newPasswordValidation = validatePassword(newPassword);
    if (!newPasswordValidation.valid) {
      return { error: newPasswordValidation.error };
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return { error: 'New passwords do not match' };
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      return { error: 'New password must be different from current password' };
    }

    const { error } = await auth.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions,
    });

    if (error) {
      console.error('Change password error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error cases
      if (error.message?.includes('incorrect') || error.message?.includes('invalid')) {
        return { error: 'Current password is incorrect' };
      }

      return { error: error.message || 'Failed to change password. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected change password error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Update current user's profile
 * auth.updateUser(data) - Update the current user's profile
 * Password updates require the password reset flow for security
 */
export async function updateProfile(
  name?: string,
  image?: string
): Promise<AccountActionState> {
  try {
    // Validate name if provided
    if (name !== undefined && name !== null) {
      if (name.trim().length === 0) {
        return { error: 'Name cannot be empty' };
      }

      if (name.length > 100) {
        return { error: 'Name must not exceed 100 characters' };
      }

      if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
        return { error: 'Name contains invalid characters' };
      }
    }

    // Validate image URL if provided
    if (image !== undefined && image !== null && image.length > 0) {
      try {
        new URL(image);
      } catch {
        return { error: 'Invalid image URL' };
      }
    }

    const { error } = await auth.updateUser({
      name: name?.trim(),
      image: image && image.length > 0 ? image : undefined,
    });

    if (error) {
      console.error('Update profile error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: error.message || 'Failed to update profile. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected update profile error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Delete current user account
 * auth.deleteUser() - Delete the current user account (irreversible)
 * This action is permanent and cannot be undone
 */
export async function deleteAccount(): Promise<AccountActionState> {
  try {
    const { error } = await auth.deleteUser();

    if (error) {
      console.error('Delete account error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: error.message || 'Failed to delete account. Please try again.' };
    }

    // Log account deletion for audit purposes
    console.warn('User account deleted:', {
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Unexpected delete account error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Send email verification
 * auth.sendVerificationEmail(options) - Send email verification to the current user
 * Used for verifying user's email address
 */
export async function sendEmailVerification(
  callbackURL?: string
): Promise<AccountActionState> {
  try {
    // Get current user session to retrieve email
    const { data: session, error: sessionError } = await auth.getSession();

    if (sessionError || !session?.user?.email) {
      console.error('Get session error:', {
        error: sessionError?.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to retrieve current user. Please sign in and try again.' };
    }

    const { error } = await auth.sendVerificationEmail({
      email: session.user.email,
      callbackURL: callbackURL || '/dashboard',
    });

    if (error) {
      console.error('Send verification email error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('already verified')) {
        return { error: 'Your email is already verified.' };
      }

      return { error: error.message || 'Failed to send verification email. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected send verification email error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
