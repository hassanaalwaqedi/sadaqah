import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that do not require authentication
const publicPaths = [
  '/',
  '/about',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const publicPrefixes = [
  '/programs/',
  '/campaigns/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public path or starts with a public prefix
  const isPublicPath = publicPaths.includes(pathname) || 
                       publicPrefixes.some(prefix => pathname.startsWith(prefix));

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Allow static files and API routes to pass through
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication token in cookies (if applicable in this architecture)
  // If the app relies solely on localStorage, this middleware can be bypassed 
  // or adjusted. Assuming an 'access_token' cookie might be used in the future:
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    // We are on a protected route and missing a token cookie.
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
