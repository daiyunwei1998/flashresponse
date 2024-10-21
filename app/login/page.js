'use client';

import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chatServiceHost, tenantServiceHost, imageHost } from '@/app/config';
import { ChakraProvider } from '@chakra-ui/react';
import {GoogleLoginButton} from '@/app/components/GoogleLoginButton'

export default function LoginPage() {
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Function to extract subdomain
    const getSubdomain = () => {
      if (typeof window === 'undefined') return null;
      const hostname = window.location.hostname;
      
      // Handle localhost or cases without subdomains
      if (
        hostname === 'localhost' ||
        hostname.split('.').length < 3
      ) {
        return null;
      }

      // Extract subdomain (assuming format subdomain.domain.com)
      const parts = hostname.split('.');
      // Adjust the index based on your domain structure
      // For example, for tenant1.flashresponse.net, subdomain is parts[0]
      return parts[0];
    };

    const tenantAliasFromSubdomain = getSubdomain();

    if (tenantAliasFromSubdomain) {
      setAlias(tenantAliasFromSubdomain);
    } else {
      // Fallback to search parameter if needed
      // const tenantAliasFromSearch = searchParams.get('tenantAlias');
      // if (tenantAliasFromSearch) {
      //   setAlias(tenantAliasFromSearch);
      // }

      // Check if there are stored credentials
      const storedCredentials = localStorage.getItem('loginCredentials');
      if (storedCredentials) {
        const { alias, email } = JSON.parse(storedCredentials);
        setAlias(alias);
        setEmail(email);
        setRememberMe(true);
      }
    }
  }, []); // Removed dependency on tenantAlias since it's now derived from hostname

  const handleLogin = async () => {
    // Reset error state
    setError(null);

    // Basic form validation
    if (!email || !password) {
      toast({
        title: '所有欄位都是必填的',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('alias', alias);
      const tenantResponse = await fetch(
        `${tenantServiceHost}/api/v1/tenants/check?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      let tenantId;
      if (tenantResponse.ok) {
        const { data } = await tenantResponse.json();
        tenantId = data.tenant_id;
      } else {
        const data = await tenantResponse.json();
        setError(data.message || '無法驗證商戶');
        toast({
          title: '無法驗證商戶',
          description: data.message || '請檢查商戶別名或註冊商戶',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      console.log('Getting tenant ID:', tenantId);

      const response = await fetch(
        `${chatServiceHost}/api/v1/tenants/${tenantId}/users/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (response.ok) {
        // Login successful
        if (rememberMe) {
          localStorage.setItem(
            'loginCredentials',
            JSON.stringify({ alias, email })
          );
        } else {
          localStorage.removeItem('loginCredentials');
        }

        toast({
          title: '登入成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Redirect to tenant-specific domain if tenantAlias is present
        if (alias) {
          window.location.href = `https://${alias}.flashresponse.net/`;
        } else {
          // Redirect to main domain
          window.location.href = '/';
        }
      } else {
        // Log the response status for debugging
        console.log('Response Status:', response.status);

        let data = null;

        try {
          // Attempt to parse the JSON response
          data = await response.json();
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          // Set data to an empty object if JSON parsing fails
          data = {};
        }

        if (response.status === 403) {
          setError(data.message || '登入失敗');
          toast({
            title: '登入失敗',
            description: data.message || '請檢查您的登入資訊',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } else {
          // Handle other error statuses
          setError(data.message || '發生未知錯誤');
          toast({
            title: '登入失敗',
            description: data.message || '請稍後再試',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('伺服器錯誤，請稍後再試');
      toast({
        title: '伺服器錯誤',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Flex minH={'100vh'} width="100%" justify={'center'} align={'center'}>
        <Flex width="100%" maxW={'md'} direction={'column'} align={'center'}>
          <Stack spacing={4} width="100%" p={6} mt={-40}>
            <Heading fontSize={'4xl'} textAlign={'center'}>
              登入帳戶
            </Heading>
            <Text fontSize={'xl'} color={'gray.600'} textAlign={'center'}>
              沒有帳戶？{' '}
              <Link href="/signup" color={'blue.400'}>
                註冊
              </Link>
            </Text>
            <FormControl id="email">
              <FormLabel>信箱</FormLabel>
              <Input
                type="email"
                placeholder="請輸入信箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>密碼</FormLabel>
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Stack spacing={6}>
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                align={'start'}
                justify={'space-between'}
              >
                <Checkbox
                  isChecked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  記住帳戶
                </Checkbox>
                <Link color={'blue.400'} href="/forgot-password">
                  忘記密碼?
                </Link>
              </Stack>
              <Button
                colorScheme={'blue'}
                variant={'solid'}
                isLoading={loading}
                onClick={handleLogin}
              >
                登入
              </Button>
            </Stack>
            <GoogleLoginButton tenant = {alias}></GoogleLoginButton>
          </Stack>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
}