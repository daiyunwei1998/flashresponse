'use client'

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
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Providers } from '@/app/components/providers'
import { chatServiceHost, tenantServiceHost, imageHost } from '@/app/config'

export default function LoginPage() {
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    // Check if there are stored credentials
    const storedCredentials = localStorage.getItem('loginCredentials')
    if (storedCredentials) {
      const { alias, email } = JSON.parse(storedCredentials)
      setAlias(alias)
      setEmail(email)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async () => {
    // Reset error state
    setError(null)

    // Basic form validation
    if (!alias || !email || !password) {
      toast({
        title: '所有欄位都是必填的',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('alias', alias)
      const tenantResponse = await fetch(
        `${tenantServiceHost}/api/v1/tenants/check?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      let tenantId
      if (tenantResponse.ok) {
        const { data } = await tenantResponse.json()
        tenantId = data.tenant_id
      } else {
        const data = await tenantResponse.json()
        setError(data.message || '無法驗證商戶')
        toast({
          title: '無法驗證商戶',
          description: data.message || '請檢查商戶別名或註冊商戶',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        setLoading(false)
        return
      }

      console.log('Getting tenant ID:', tenantId)

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
      )

      if (response.ok) {
        // Login successful
        if (rememberMe) {
          localStorage.setItem(
            'loginCredentials',
            JSON.stringify({ alias, email })
          )
        } else {
          localStorage.removeItem('loginCredentials')
        }

        toast({
          title: '登入成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        // Redirect to domain
        window.location.href = '/admin/bot-management'
      } else {
        // Log the response status for debugging
        console.log('Response Status:', response.status)

        let data = null

        try {
          // Attempt to parse the JSON response
          data = await response.json()
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError)
          // Set data to an empty object if JSON parsing fails
          data = {}
        }

        if (response.status === 403) {
          setError(data.message || '登入失敗')
          toast({
            title: '登入失敗',
            description: data.message || '請檢查您的登入資訊',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        } else {
          // Handle other error statuses
          setError(data.message || '發生未知錯誤')
          toast({
            title: '登入失敗',
            description: data.message || '請稍後再試',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('伺服器錯誤，請稍後再試')
      toast({
        title: '伺服器錯誤',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Providers>
      <Flex minH={'100vh'} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW={'7xl'} p={0}>
          <Stack direction={{ base: 'column', md: 'row' }} h={'100vh'}>
            {/* Left side content */}
            <Flex
              flex={1}
              bg={'blue.400'}
              color={'white'}
              p={10}
              align={'center'}
              justify={'center'}
            >
              <Stack spacing={6} w={'full'} maxW={'lg'}>
                <Box as="img" src={`${imageHost}/tenant_logos/agent.png`} alt="閃應" w={40} />
                <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>
                  屬於你的 AI 客服機器人
                </Heading>
                <Text fontSize={{ base: 'md', lg: 'lg' }}>
                  彈指間即享自動化的客戶服務
                </Text>
                <Text
                  textAlign={'center'}
                  mt={4}
                  position="absolute"
                  bottom={4}
                >
                  © 2024 閃應 All rights reserved.
                </Text>
              </Stack>
            </Flex>
            {/* Right side login form */}
            <Flex flex={1} p={10} align={'center'} justify={'center'}>
              <Stack spacing={4} w={'full'} maxW={'md'}>
                <Heading fontSize={'4xl'} textAlign={'center'}>
                  登入帳戶
                </Heading>
                <Text
                  fontSize={'xl'}
                  color={'gray.600'}
                  textAlign={'center'}
                >
                  沒有帳戶？{' '}
                  <Link href="/signup" color={'blue.400'}>
                    註冊
                  </Link>
                </Text>
                <FormControl id="alias">
                  <FormLabel>商戶代號</FormLabel>
                  <Input
                    type="text"
                    placeholder="請輸入商戶代號"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </FormControl>
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
              </Stack>
            </Flex>
          </Stack>
        </Container>
      </Flex>
    </Providers>
  )
}
