import localFont from 'next/font/local';
import './globals.css';
import NavBar from '@/app/components/NavBar';
import { Providers } from '@/app/components/providers';
import { headers, cookies } from 'next/headers';
import { host, tenantServiceHost, imageHost} from '@/app/config';
import NavbarWrapper from '../components/CookieProvider';


const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

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

    return data.data;
  } catch (error) {
    console.error(`Error fetching tenant data for alias: ${tenantId}`, error);
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
  // const headersList = headers();
  // const hostname = headersList.get('host') || '';
  // const currentHost = new URL(`http://${hostname}`).hostname;
  
  // console.log(`Current hostname: ${currentHost}`);
  
  let tenantInfo = DEFAULT_TENANT_INFO;

  const cookieStore = cookies();
  const tenantCookie = cookieStore.get('tenantId');
  const tenantId = tenantCookie?.value;

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
        <NavbarWrapper logo={tenantInfo.logo} name={tenantInfo.name}/>
          {children}

          <footer style={{ backgroundColor:"rgb(248, 250, 252)", textAlign: 'center', padding: '20px', marginTop: 'auto' }}>
            <a
              href="/demo/infra"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              © 2024 閃應 All rights reserved.
            </a>
          </footer>

        </Providers>
      </body>
    </html>
  );
}

export const metadata = {
  title: '閃應客服平台',
  description: '閃應客服平台',
};