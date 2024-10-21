// middleware.js
import { NextResponse } from 'next/server';
import { host } from './app/config';

// Define paths that don't require authentication
const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/auth', // Add any other public API routes here
];

// Function to determine if the path is public
const isPublicPath = (pathname) => {
  return PUBLIC_PATHS.some((path) => {
    // Exact match or starts with the public path followed by a slash
    return pathname === path || pathname.startsWith(`${path}/`);
  });
};

// Function to extract the subdomain from the hostname
const getSubdomain = (hostname) => {
  const parts = hostname.split('.');
  // Adjust based on your domain structure (e.g., abc.flashresponse.net has 3 parts)
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
};

export function middleware(request) {
  let { pathname } = request.nextUrl;
  let hostname = request.headers.get('host')
  let tenantAlias = getSubdomain(hostname)

  // Log the pathname and hostname being processed
  console.log(`Middleware: Processing path - ${pathname}`);
  console.log(`Middleware: Hostname - ${hostname}`);
  console.log(`Middleware: tenant - ${getSubdomain(hostname)}`);

  // Allow Next.js internal paths and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    PUBLIC_FILE.test(pathname)
  ) {
    console.log(`Middleware: Allowed internal/static path - ${pathname}`);
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    console.log(`Middleware: Allowed public path - ${pathname}`);
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('jwt')?.value;
  console.log(`Middleware: JWT Token - ${token ? 'Exists' : 'Missing'}`);

  if (!token) {
    // Redirect to login if token is missing
    const loginUrl = new URL('/login', request.url);
    // Optionally, include the original destination
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('tenantAlias', tenantAlias);
    console.log(`Middleware: Redirecting to login - ${loginUrl}`);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, proceed to set tenantId cookie
  let response = NextResponse.next();

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
};
