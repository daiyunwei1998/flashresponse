// app/auth/callback/route.js

import { NextResponse } from 'next/server';
import {jwtDecode} from 'jwt-decode'; // Correct import for jwt-decode
import { chatServiceHost, tenantServiceHost } from '@/app/config';
import { cookies } from 'next/headers';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Validate presence of code and state
  if (!code || !state) {
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Missing code or state parameter.')}`
    );
  }

  // Decode the state parameter (assuming it's base64-encoded JSON)
  let decodedState;
  try {
    const decodedString = Buffer.from(state, 'base64').toString('utf-8');
    decodedState = JSON.parse(decodedString);
  } catch (error) {
    console.error('Error decoding state:', error);
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Invalid state parameter.')}`
    );
  }

  const { tenant, csrf } = decodedState;

  // Validate CSRF token from cookies
  const cookieStore = cookies();
  const storedCsrf = cookieStore.get('oauth_csrf_token')?.value;

  if (csrf !== storedCsrf) {
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Invalid CSRF token.')}`
    );
  }

  console.log("Google client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://auth.flashresponse.net/auth/callback',
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    console.error('Error exchanging code for tokens:', tokenData.error);
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent(tokenData.error_description || 'Token exchange failed.')}`
    );
  }

  const { id_token, access_token } = tokenData;

  // Decode the ID token to get user information
  let decoded;
  try {
    decoded = jwtDecode(id_token);
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Invalid ID token.')}`
    );
  }

  // Extract necessary user information
  const { sub: googleId, email, name } = decoded;

  // Fetch tenantId using tenant alias (subdomain)
  let tenantId;
  try {
    const params = new URLSearchParams({ alias: tenant });
    console.log("fetching tenant id from " + `${tenantServiceHost}/api/v1/tenants/check?${params.toString()}`);
    const tenantResponse = await fetch(
      `${tenantServiceHost}/api/v1/tenants/check?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (tenantResponse.ok) {
      const tenantData = await tenantResponse.json();
      tenantId = tenantData.data.tenant_id;
    } else {
      const errorData = await tenantResponse.json();
      console.error('Unable to verify tenant:', errorData.message);
      return NextResponse.redirect(
        `/error?message=${encodeURIComponent(errorData.message || 'Unable to verify tenant.')}`
      );
    }
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Error verifying tenant.')}`
    );
  }

  console.log('Fetched tenant ID:', tenantId);

  // Define user data for signup
  const userData = {
    name,
    email,
    password: googleId, // Using googleId as the password
    role: "CUSTOMER",
    tenant_id: tenantId,
  };

  // Attempt to sign up the user
  try {
    const signupResponse = await fetch(
      `${chatServiceHost}/api/v1/tenants/${tenantId}/users/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      }
    );
    console.log('Signup Endpoint:', `${chatServiceHost}/api/v1/tenants/${tenantId}/users/register`);
    console.log('Signup Request Body:', JSON.stringify(userData));
  
    if (!signupResponse.ok) {
      const signupErrorData = await signupResponse.json();
      // Check if the error is due to the user already existing
      console.log("Sign in error " + signupErrorData.error);
      if (signupErrorData.error && signupErrorData.error.includes('already exists')) {
        console.warn('User already exists. Proceeding to login.');
      } else {
        throw new Error(signupErrorData.error || "User registration failed");
      }
    } else {
      console.log('User signed up successfully.');
    }
  } catch (signupError) {
    console.error("Signup error:", signupError);
    // If signup failed due to reasons other than user already existing, redirect with error
    if (!signupError.message.includes('already exists')) {
      return NextResponse.redirect(
        `/error?message=${encodeURIComponent(signupError.message || 'User registration failed')}`
      );
    }
  }

  // Proceed to log in the user
  let backendData;
  try {
    const backendResponse = await fetch(
      `${chatServiceHost}/api/v1/tenants/${tenantId}/users/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: googleId,
          email,
        }),
      }
    );

    if (!backendResponse.ok) {
      const loginErrorData = await backendResponse.json();
      throw new Error(loginErrorData.message || "User login failed");
    }

    backendData = await backendResponse.json();
  } catch (loginError) {
    console.error("Login error:", loginError);
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent(loginError.message || 'User login failed')}`
    );
  }

  // Assume backendData contains a JWT token
  const { data } = backendData;

  if (!data) {
    return NextResponse.redirect(
      `/error?message=${encodeURIComponent('Token not provided by backend.')}`
    );
  }

  // Create a redirect response
  const response = NextResponse.redirect(`https://${tenant}.flashresponse.net/`);

  const cookieSetting = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    domain: '.flashresponse.net', // Note the leading dot for subdomain access
  }

  // Set the JWT token as a cookie
  response.cookies.set('jwt', data,cookieSetting );
  response.cookies.set('tenantId', tenantId, cookieSetting);
  response.cookies.set('userId', googleId, cookieSetting);
  response.cookies.set('userName', name, cookieSetting);

  return response;
}
