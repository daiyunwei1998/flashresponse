import localFont from "next/font/local";
import "./globals.css";
import { tenantServiceHost, imageHost } from '@/app/config';
import { headers, cookies } from 'next/headers';
import { ChakraProvider, Flex } from '@chakra-ui/react';
import Navbar from "./components/NavBar";
import {GoogleOAuthProvider} from '@react-oauth/google'; 

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Extract tenantAlias from headers
const extractTenantAliasFromHeaders = () => {
  const headersList = headers();
  const host = headersList.get('host'); // Get the Host header
  if (host) {
    const parts = host.split('.');
    if (parts.length > 2) {
      return parts[0]; // Extract tenant alias from subdomain
    }
  }
  return null;
};

const DEFAULT_TENANT_INFO = {
  logo: `${imageHost}/tenant_logos/agent.png`,
  name: '閃應客服平台',
};

async function fetchTenantData(tenantAlias) {
  try {
    const params = new URLSearchParams();
    params.append('alias', tenantAlias);

    const response = await fetch(`${tenantServiceHost}/api/v1/tenants/find?${params.toString()}`, {});
    
    if (!response.ok) {
      console.error(`Tenant not found for alias: ${tenantAlias}. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('Received tenant data:', data);

    return data.data;
  } catch (error) {
    console.error(`Error fetching tenant data for alias: ${tenantAlias}`, error);
    return null;
  }
}

function processTenantData(data) {
  if (!data) return DEFAULT_TENANT_INFO;

  return {
    logo: data.logo ? `${imageHost}/${data.logo}` : DEFAULT_TENANT_INFO.logo,
    name: data.name ? data.name : DEFAULT_TENANT_INFO.name,
  };
}

export default async function RootLayout({ children }) {
  let tenantInfo = DEFAULT_TENANT_INFO;

  const cookieStore = cookies();
  const tenantCookie = cookieStore.get('tenantId');
  const tenantId = tenantCookie?.value;
  const userCookie = cookieStore.get('userId');
  const userId = userCookie?.value; // Fix userId retrieval
  const jwtCookie = cookieStore.get('jwt');
  const jwt = jwtCookie?.value; // Fix jwt retrieval

  // Extract tenantAlias from headers
  const tenantAlias = extractTenantAliasFromHeaders();
  
  const fetchedTenantData = await fetchTenantData(tenantAlias || tenantId); // Use alias or tenantId

  if (fetchedTenantData) {
    tenantInfo = processTenantData(fetchedTenantData);
    console.log(`Using tenant info for alias: ${tenantAlias || tenantId}`, tenantInfo);
  } else {
    console.log('Using default tenant info for main domain');
  }

  return (
    <html lang="en">
    <head>
      <link rel="icon" href={tenantInfo.logo} />
      <title>{`${tenantInfo.name} | 閃應客服平台`}</title>
    </head>
    <body className={`${geistSans.variable} ${geistMono.variable}`}>
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
      <ChakraProvider>
        <Flex direction="column" height="100vh">
          <Navbar logo={tenantInfo.logo} name={tenantInfo.name} userId={userId} initialJwt={jwt} />
          <Flex flex="1" overflow="auto">
            {children}
          </Flex>
        </Flex>
      </ChakraProvider>
    </GoogleOAuthProvider>
    </body>
  </html>
  );
}
