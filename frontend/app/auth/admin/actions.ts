/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from '@/lib/auth/server';

interface AdminActionState {
  error?: string;
  success?: boolean;
  data?: any;
}

/**
 * List all users (admin only)
 * auth.admin.listUsers(options) - List all users
 * Available for users with admin role
 */
export async function listAllUsers(
  limit: number = 100,
  offset: number = 0
): Promise<AdminActionState> {
  try {
    // Validate pagination parameters
    if (limit < 1 || limit > 1000) {
      return { error: 'Limit must be between 1 and 1000' };
    }

    if (offset < 0) {
      return { error: 'Offset must be non-negative' };
    }

    const { data: users, error } = await (auth.admin as any).listUsers({
      limit,
      offset,
    });

    if (error) {
      console.error('List users error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        return { error: 'You do not have permission to list users' };
      }

      return { error: error.message || 'Failed to list users. Please try again.' };
    }

    return { success: true, data: users };
  } catch (error) {
    console.error('Unexpected list users error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Ban a user (admin only)
 * auth.admin.banUser(options) - Ban a user from accessing the app
 * Available for users with admin role
 */
export async function banUser(
  userId: string,
  reason?: string
): Promise<AdminActionState> {
  try {
    if (!userId || userId.trim().length === 0) {
      return { error: 'User ID is required' };
    }

    const { error } = await (auth.admin as any).banUser({
      userId: userId.trim(),
      reason: reason?.trim(),
    });

    if (error) {
      console.error('Ban user error:', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        return { error: 'You do not have permission to ban users' };
      }

      if (error.message?.includes('not found')) {
        return { error: 'User not found' };
      }

      return { error: error.message || 'Failed to ban user. Please try again.' };
    }

    // Log this action for audit purposes
    console.warn('User banned by admin:', {
      userId,
      reason: reason?.trim(),
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Unexpected ban user error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Set a user's role (admin only)
 * auth.admin.setRole(options) - Set a user's role
 * Available for users with admin role
 */
export async function setUserRole(
  userId: string,
  role: string
): Promise<AdminActionState> {
  try {
    if (!userId || userId.trim().length === 0) {
      return { error: 'User ID is required' };
    }

    if (!role || role.trim().length === 0) {
      return { error: 'Role is required' };
    }

    const trimmedRole = role.trim().toLowerCase();

    // Validate role is one of the allowed values
    const validRoles = ['admin', 'user', 'moderator'];
    if (!validRoles.includes(trimmedRole)) {
      return { error: `Role must be one of: ${validRoles.join(', ')}` };
    }

    const { error } = await (auth.admin as any).setRole({
      userId: userId.trim(),
      role: trimmedRole,
    });

    if (error) {
      console.error('Set user role error:', {
        userId,
        role: trimmedRole,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        return { error: 'You do not have permission to set user roles' };
      }

      if (error.message?.includes('not found')) {
        return { error: 'User not found' };
      }

      return { error: error.message || 'Failed to set user role. Please try again.' };
    }

    // Log this action for audit purposes
    console.warn('User role changed by admin:', {
      userId,
      newRole: trimmedRole,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Unexpected set user role error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Create a new organization (if organizations plugin is enabled)
 * auth.organization.create(data) - Create a new organization
 * Available when the organizations plugin is enabled
 */
export async function createOrganization(
  name: string,
  slug?: string
): Promise<AdminActionState> {
  try {
    if (!name || name.trim().length === 0) {
      return { error: 'Organization name is required' };
    }

    if (name.length > 100) {
      return { error: 'Organization name must not exceed 100 characters' };
    }

    if (slug && slug.length > 50) {
      return { error: 'Slug must not exceed 50 characters' };
    }

    // Validate slug format if provided
    if (slug && !/^[a-z0-9-]+$/.test(slug.trim())) {
      return { error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }

    const { data, error } = await (auth.organization as any).create({
      name: name.trim(),
      slug: slug?.trim(),
    });

    if (error) {
      console.error('Create organization error:', {
        name,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('already exists')) {
        return { error: 'Organization with this name or slug already exists' };
      }

      return { error: error.message || 'Failed to create organization. Please try again.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected create organization error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * List current user's organizations
 * auth.organization.list() - List the current user's organizations
 */
export async function listUserOrganizations(): Promise<AdminActionState> {
  try {
    const { data: organizations, error } = await (auth.organization as any).list();

    if (error) {
      console.error('List organizations error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to retrieve organizations. Please try again.' };
    }

    return { success: true, data: organizations };
  } catch (error) {
    console.error('Unexpected list organizations error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

/**
 * Invite a member to an organization
 * auth.organization.inviteMember(options) - Invite a member to an organization
 */
export async function inviteMemberToOrganization(
  organizationId: string,
  email: string,
  role?: string
): Promise<AdminActionState> {
  try {
    if (!organizationId || organizationId.trim().length === 0) {
      return { error: 'Organization ID is required' };
    }

    if (!email || email.trim().length === 0) {
      return { error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { error: 'Please enter a valid email address' };
    }

    const { error } = await (auth.organization as any).inviteMember({
      organizationId: organizationId.trim(),
      email: email.toLowerCase().trim(),
      role: role?.trim().toLowerCase(),
    });

    if (error) {
      console.error('Invite member error:', {
        organizationId,
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      if (error.message?.includes('not found')) {
        return { error: 'Organization not found' };
      }

      return { error: error.message || 'Failed to invite member. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected invite member error:', {
      error,
      timestamp: new Date().toISOString(),
    });
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
