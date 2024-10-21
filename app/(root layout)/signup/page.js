"use client"
import React, { useState } from 'react';
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
  Image,
  Divider,
  Progress,
  useToast,
  HStack,
  Spinner,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Providers } from '@/app/components/providers';
import { chatServiceHost, tenantServiceHost, imageHost } from '@/app/config';
import { useRouter } from 'next/navigation';

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    tenant: '',
    tenantAlias: '',
    logo: null,
    name: '',
    email: '',
    password: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const checkTenantExists = async () => {
    const params = new URLSearchParams();
    if (formData.tenant) params.append('name', formData.tenant);
    if (formData.tenantAlias) params.append('alias', formData.tenantAlias);

    try {
      const response = await fetch(`${tenantServiceHost}/api/v1/tenants/check?${params.toString()}`);
      return response.ok;
    } catch (error) {
      console.error("Error checking tenant existence:", error);
      return false;
    }
  };

  const handleNextStep = async () => {
    const missingFields = [];
    if (!formData.tenant) missingFields.push("商戶名稱");
    if (!formData.tenantAlias) missingFields.push("商戶別名");

    if (missingFields.length > 0) {
      toast({
        title: "商戶註冊資料不完整",
        description: `請填寫以下欄位: ${missingFields.join(", ")}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    const tenantExists = await checkTenantExists();
    if (tenantExists) {
      toast({
        title: "商戶已存在",
        description: "該商戶名稱或別名已被註冊，請更換後重試",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    setStep(2);
    setIsLoading(false);
  };


  const deleteUser = async (tenantId, userId) => {
    try {
      await fetch(`${chatServiceHost}/api/v1/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
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

    setIsLoading(true);
    const tenantData = new FormData();
    tenantData.append('name', formData.tenant);
    tenantData.append('alias', formData.tenantAlias);
    if (formData.logo) tenantData.append('logo', formData.logo);

    try {
      const tenantResponse = await fetch(`${tenantServiceHost}/api/v1/tenants/`, {
        method: 'POST',
        body: tenantData,
      });

      if (!tenantResponse.ok) {
        throw new Error("商戶註冊失敗");
      }

      const { tenant_id } = await tenantResponse.json();
      setTenantId(tenant_id);

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "ADMIN",
        tenant_id: tenant_id,
      };

      const userResponse = await fetch(`${chatServiceHost}/api/v1/tenants/${tenant_id}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!userResponse.ok) {
        throw new Error("用戶註冊失敗");
      }

      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push('/admin/bot-management');
      router.refresh();
    } catch (error) {
      console.error("Error creating user:", error);
      console.log(`${tenantServiceHost}/api/v1/tenants/${tenantId}`)
      if (tenantId) {
        console.log(`${tenantServiceHost}/api/v1/tenants/${tenantId}`)
        try {
          await fetch(`${tenantServiceHost}/api/v1/tenants/${tenantId}`, {
            method: 'DELETE',
          });
          console.log("Tenant deleted due to user registration failure");
        } catch (error) {
          console.error("Error deleting tenant:", error);
        }
      }
      
      toast({
        title: "Error",
        description: error.message || "There was an error creating your account. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <Providers>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Progress value={step === 1 ? 50 : 100} size="sm" colorScheme="blue" />
          <Box textAlign="center">
            <Image src={`${imageHost}/tenant_logos/agent.png`} alt="Logo" boxSize="50px" mx="auto" mb={4} />
            <Heading size="xl" mb={2}>註冊帳戶</Heading>
            <Text fontSize="md" color="gray.600">
              {step === 1 ? "第一步: 註冊商戶資料" : "第二步: 新建管理員帳戶"}
            </Text>
          </Box>

          <VStack as="form" spacing={4} onSubmit={step === 2 ? handleSubmitUser : undefined}>
            {step === 1 ? (
              <>
                <FormControl isRequired>
                  <FormLabel>商戶名</FormLabel>
                  <Input name="tenant" value={formData.tenant} onChange={handleInputChange} placeholder="輸入商戶名稱" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>商戶代號</FormLabel>
                  <Input name="tenantAlias" value={formData.tenantAlias} onChange={handleInputChange} placeholder="輸入商戶代號" maxLength={10} />
                </FormControl>

                <FormControl>
                  <FormLabel>商户 Logo</FormLabel>
                  <Button as="label" htmlFor="file-upload" colorScheme="blue" variant="outline" cursor="pointer" w="full">
                    {formData.logo ? '已上傳 Logo' : '上傳 Logo'}
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      display="none"
                    />
                  </Button>
                </FormControl>

                <Button colorScheme="blue" w="full" onClick={handleNextStep} isLoading={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : "下一步"}
                </Button>
              </>
            ) : (
              <>
                <FormControl isRequired>
                  <FormLabel>帳戶名</FormLabel>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="請輸入用戶名" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>信箱</FormLabel>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="請輸入電子信箱" />
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
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    密碼規範（to be implemented）
                  </Text>
                </FormControl>

                <HStack w="full">
                  <Button colorScheme="gray" w="full" onClick={() => setStep(1)} isDisabled={isLoading}>
                    上一步
                  </Button>
                  <Button colorScheme="blue" w="full" type="submit" isLoading={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : "建立帳戶"}
                  </Button>
                </HStack>
              </>
            )}
          </VStack>

          {step === 2 && (
            <>
              <Divider />

              <Text textAlign="center">
                已經有帳戶了?{' '}
                <Button variant="link" colorScheme="blue">
                  登入
                </Button>
              </Text>
            </>
          )}
        
        </VStack>
      </Container>
    </Providers>
  );
};

export default SignUp;
