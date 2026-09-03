import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly mark public routes (Home, API callbacks, Public Auth)
  const isHomePage = pathname === '/';
  const isAuthCallback = pathname.startsWith('/auth/callback') || pathname.startsWith('/api/auth');
  const isPublicAuthRoute = 
    pathname.startsWith('/auth/sign-in') ||
    pathname.startsWith('/auth/sign-up') ||
    pathname.startsWith('/auth/verify-otp');

  // Allow home page and OAuth callbacks to load freely for ALL users
  if (isHomePage || isAuthCallback) {
    return NextResponse.next();
  }

  // 2. Handle Public Auth Pages (Sign-In / Sign-Up)
  if (isPublicAuthRoute) {
    const session = await auth.getSession({
      fetchOptions: { headers: request.headers },
    });

    // If user is ALREADY logged in, send them to /dashboard
    if (session?.data?.user && !pathname.includes('verify-otp')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 3. Protect Dashboard & Private Routes
  const isProtectedRoute = pathname.startsWith('/dashboard')

  if (isProtectedRoute) {
    const session = await auth.getSession({
      fetchOptions: { headers: request.headers },
    });

    if (!session?.data?.user) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    return NextResponse.next();
  }

  // 4. Default fallthrough for any other unrecognized route
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};