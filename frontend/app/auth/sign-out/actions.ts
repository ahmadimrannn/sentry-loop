'use server';

import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function signOut() {
  const { error } = await auth.signOut();
  if (error) {
    return {error: `Failed to sign out the user. ${error}`}
  }
  redirect('/auth/sign-in');
}