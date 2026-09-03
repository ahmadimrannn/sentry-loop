import { auth } from '@/lib/auth/server';
import { NextResponse, type NextRequest } from 'next/server';

// 1. Define routes that unauthenticated users can access
const PUBLIC_PATHS = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/verify-otp',
  '/auth/forgot-password',
];

// 2. Initialize the default Neon Auth middleware instance
const authMiddleware = auth.middleware({
  loginUrl: '/auth/sign-in',
});

// 3. Export custom middleware logic wrapper
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass Neon Auth middleware for explicit public routes
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Execute standard Neon Auth middleware for protected routes
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};