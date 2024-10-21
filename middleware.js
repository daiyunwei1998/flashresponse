import { NextResponse } from 'next/server';
import {jwtDecode} from 'jwt-decode';
import { tenantServiceHost } from './app/config';


async function fetchTenantData(tenantId) {
  try {
    const params = new URLSearchParams();
    params.append('tenant_id', tenantId);

    const response = await fetch(`${tenantServiceHost}/api/v1/tenants/find?${params.toString()}`, {});
    
    if (!response.ok) {
      console.error(`Tenant not found for alias: ${tenantId}. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('Received tenant data:', data);

    return data;
  } catch (error) {
    console.error(`Error fetching tenant data for alias: ${tenantId}`, error);
    return null;
  }
}

export async function middleware(request) {
  // Get the JWT from the cookie
  const jwt = request.cookies.get('jwt')?.value;

  console.log(jwt) 

  let userRole = null;
  if (jwt) {
    try {
      const decodedToken = jwtDecode(jwt);
      console.log('JWT decoded successfully:', decodedToken);

      // Extract the role from the decoded token
      userRole = decodedToken.roles[0].authority;
      console.log('User role:', userRole);
    
      // Set the Authorization header
      requestHeaders.set('Authorization', `Bearer ${jwt}`);
    } catch (err) {
      console.log('Error decoding JWT:', err);
    }
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  console.log('Middleware executed');

  // Get the tenant ID from the cookie (if you're using multi-tenancy)
  const tenantId = request.cookies.get('tenantId')?.value;
  if (tenantId) {
    requestHeaders.set('X-Tenant-ID', tenantId);
  }

  if (userRole === "ROLE_CUSTOMER") {
    const fetchedTenantData = await fetchTenantData(tenantId);
    const alias = fetchedTenantData.data.alias;

    if (alias) {
      return NextResponse.redirect(`https://${fetchedTenantData.data.alias}.flashresponse.net`);
    } else {
      return NextResponse.redirect(`/`);
    }
    
  }


  // Get the pathname of the requested URL
  const { pathname } = request.nextUrl;

  // If the user is authenticated and tries to access the login page, redirect to home
  if (jwt && pathname === '/login') {
    console.log('Authenticated user trying to access login page. Redirecting to home.');
    return NextResponse.redirect(new URL('/admin/bot-management', request.url));
  }

  // Protect /admin/* routes based on role
  if (pathname.startsWith('/admin')) {
    if (!jwt) {
      console.log('Unauthenticated access attempt to admin pages. Redirecting to login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (userRole !== 'ROLE_ADMIN') {
      console.log('Unauthorized user attempting to access admin pages. Redirecting to unauthorized page.');
      return NextResponse.redirect(new URL('/unauthorized', request.url));  // Redirect to an unauthorized page
    }
  }


    
    
  
    // Optionally, you can protect certain routes by redirecting unauthenticated users
    // For example, protect all routes except publicPaths
    // const isPublic = publicPaths.includes(pathname);
    // if (!isPublic && !jwt) {
    //   console.log('Unauthenticated user trying to access protected route. Redirecting to login.');
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  
    // Return the response with modified request headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });


  // Optionally, protect all other routes except public paths
  const isPublic = publicPaths.includes(pathname);
  if (!isPublic && !jwtToken) {
    console.log('Unauthenticated user trying to access protected route. Redirecting to login.');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Return the response with modified request headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
