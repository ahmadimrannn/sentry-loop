import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ALLOW PUBLIC AUTH PATHS (Sign in, Sign up, OTP verification)
  const isPublicAuthRoute = 
    pathname.startsWith('/auth/sign-in') ||
    pathname.startsWith('/auth/sign-up') ||
    pathname.startsWith('/auth/verify-otp')

  // If the user is navigating to an allowed public auth page, skip session checks
  if (isPublicAuthRoute) {
    // Read session to see if already logged in
    const session = await auth.getSession({
      fetchOptions: { headers: request.headers },
    });
    
    // ONLY redirect if user is ALREADY fully authenticated and tries to visit sign-in/sign-up
    if (session?.data?.user && !pathname.includes('verify-otp')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 2. CHECK SESSION FOR PROTECTED ROUTES
  const session = await auth.getSession({
    fetchOptions: { headers: request.headers },
  });

  const isAuthenticated = Boolean(session?.data?.user);

  // 3. REDIRECT UNAUTHENTICATED USERS TO SIGN-IN
  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // 4. DELEGATE TO NEON AUTH MIDDLEWARE
  return auth.middleware({
    loginUrl: '/auth/sign-in',
  })(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};