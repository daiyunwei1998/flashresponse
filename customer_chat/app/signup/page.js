"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Container,
  Divider,
  useToast,
  Spinner,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { ChakraProvider } from '@chakra-ui/react';
import { chatServiceHost, tenantServiceHost } from '@/app/config';
import { useRouter } from 'next/navigation';

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const toast = useToast();
  const [tenantAlias, setTenantAlias] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);

  useEffect(() => {
    const checkTenant = async () => {
      try {
        // Function to extract tenantAlias from subdomain
        const extractTenantAlias = () => {
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            // Adjust based on your domain structure, e.g., subdomain.domain.com
            if (parts.length > 2) {
              return parts[0];
            }
            return null;
          }
          return null;
        };

        const alias = extractTenantAlias();
        console.log("Derived tenantAlias:", alias);
        setTenantAlias(alias);

        if (!alias) {
          toast({
            title: "無效的商戶",
            description: "找不到對應的商戶，請聯繫支援。",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          router.push('/'); // Redirect to home or appropriate page
          return;
        }

        // Construct query parameters
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

        if (tenantResponse.ok) {
          const { data } = await tenantResponse.json();
          
          setTenantId(data.tenant_id);
        } else {
          const errorData = await tenantResponse.json();
          toast({
            title: '無法驗證商戶',
            description: errorData.message || '請檢查網址',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          router.push('/'); // Redirect to home or appropriate page
        }
      } catch (error) {
        console.error("Error checking tenant:", error);
        toast({
          title: '錯誤',
          description: '無法驗證商戶資訊，請稍後再試。',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        router.push('/'); // Redirect to home or appropriate page
      } finally {
        setIsTenantLoading(false);
      }
    };

    checkTenant();
  }, [toast, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    const missingFields = [];
    if (!formData.name) missingFields.push("姓名");
    if (!formData.email) missingFields.push("電子郵件");
    if (!formData.password) missingFields.push("密碼");

    if (missingFields.length > 0) {
      toast({
        title: "用戶註冊資料不完整",
        description: `請填寫以下欄位: ${missingFields.join(", ")}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "無效的商戶",
        description: "商戶資訊尚未加載，請稍後再試。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: "CUSTOMER",
      tenant_id: tenantId,
    };

    try {
      const userResponse = await fetch(`${chatServiceHost}/api/v1/tenants/${tenantId}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || "用戶註冊失敗");
      }

      toast({
        title: "帳戶已創建",
        description: "您的帳戶已成功創建。",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "錯誤",
        description: error.message || "創建帳戶時出現錯誤。請再試一次。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  if (isTenantLoading) {
    return (
      <ChakraProvider>
        <Container maxW="md" py={8} centerContent>
          <Spinner size="xl" />
          <Text mt={4}>正在驗證商戶資訊...</Text>
        </Container>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={2}>註冊帳戶</Heading>
            <Text fontSize="md" color="gray.600">
              創建帳戶
            </Text>
          </Box>

          <VStack as="form" spacing={4} onSubmit={handleSubmitUser}>
            <FormControl isRequired>
              <FormLabel>帳戶名</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="請輸入用戶名"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>信箱</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="請輸入電子信箱"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>密碼</FormLabel>
              <InputGroup>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="請輸入密碼"
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={toggleShowPassword}>
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {/* Optionally, you can add password strength or guidelines here */}
            </FormControl>

            <Button colorScheme="blue" w="full" type="submit" isLoading={isLoading}>
              {isLoading ? <Spinner size="sm" /> : "建立帳戶"}
            </Button>
          </VStack>

          <Divider />

          <Button
            leftIcon={<FcGoogle />}
            variant="outline"
            w="full"
            size="lg"
          >
            使用 Google 登入
          </Button>

          <Text textAlign="center">
            已經有帳戶了?{' '}
            <Button variant="link" colorScheme="blue" onClick={() => router.push('/login')}>
              登入
            </Button>
          </Text>

          <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
            © 2024 閃應 All rights reserved.
          </Text>
        </VStack>
      </Container>
    </ChakraProvider>
  );
};

export default SignUp;
