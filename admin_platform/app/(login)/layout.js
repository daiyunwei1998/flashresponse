import { headers } from 'next/headers';
import { host, tenantServiceHost, imageHost } from '@/app/config';
import { getCookie } from 'cookies-next';

const DEFAULT_TENANT_INFO = {
  logo: `${imageHost}/tenant_logos/agent.png`,
  name: '閃應客服平台',
};

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

function processTenantData(data) {
  if (!data) return DEFAULT_TENANT_INFO;

  return {
    logo: data.logo || DEFAULT_TENANT_INFO.logo,
    name: data.name ? data.name : DEFAULT_TENANT_INFO.name,
  };
}

export default async function RootLayout({ children }) {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const currentHost = new URL(`http://${hostname}`).hostname;
  
  console.log(`Current hostname: ${currentHost}`);
  
  let tenantInfo = DEFAULT_TENANT_INFO;
  
  // if (currentHost !== new URL(host).hostname) {
  //   const alias = currentHost.split('.')[0];
  //   console.log(`Extracted alias: ${alias}`);
    
  //   const fetchedTenantData = await fetchTenantData(alias);
  //   tenantInfo = processTenantData(fetchedTenantData);
    
  //   console.log(`Using tenant info for alias: ${alias}`, tenantInfo);
  // } else {
  //   console.log('Using default tenant info for main domain');
  // }

  const tenantId = getCookie('tenantId');
  console.log(tenantId);

  const fetchedTenantData = await fetchTenantData(tenantId);
  

  if (fetchedTenantData) {

    tenantInfo = processTenantData(fetchedTenantData);
    
    console.log(`Using tenant info for alias: ${tenantId}`, tenantInfo);
  } else {
    console.log('Using default tenant info for main domain');
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={tenantInfo.logo} />
        <title>{`${tenantInfo.name} | 閃應客服平台`}</title>
      </head>
      <body>
          {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: '閃應客服平台',
  description: '閃應客服平台',
};