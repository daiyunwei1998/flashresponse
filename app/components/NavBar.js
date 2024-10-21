'use client'
import { Box, Flex, Button, Menu, MenuButton, MenuList, MenuItem, useBreakpointValue, useColorModeValue, Image } from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { FiSettings, FiMessageSquare, FiLogOut } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { useCookies } from 'react-cookie';
import { chatServiceHost, imageHost } from '@/app/config';


const Navbar = ({ name, logo, initialLoggedIn}) => {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeBgColor = useColorModeValue('blue.100', 'blue.900')
  const activeTextColor = useColorModeValue('blue.700', 'blue.300')
  const inactiveBgColor = useColorModeValue('white', 'gray.800')
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn)
  const [cookies, setCookie, removeCookie] = useCookies(['jwt', 'tenantId']); 

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
  }, [initialLoggedIn]);

  // Use responsive value to hide text on smaller screens
  const showText = useBreakpointValue({ base: false, md: true })

  const navItems = [
    { name: 'Bot Management', icon: RiRobot2Line, href: '/admin/bot-management' },
  //  { name: 'Tenant Settings', icon: FiSettings, href: '/admin/tenant-settings' },
    { name: 'Customer Chat', icon: FiMessageSquare, href: '/admin/customer-chat' },
  ]


  const handleLogout = async () => {
    
    const tenantId = cookies.tenantId;
    const jwt = cookies.jwt;
    
    try {
      const response = await fetch(`${chatServiceHost}/api/v1/tenants/${tenantId}/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials:'include'
      });
  
      if (response.ok) {
        // Clear JWT and tenant cookies here
        document.cookie = 'jwt=; Max-Age=0; path=/;'; // Clear JWT cookie
        document.cookie = 'tenantId=; Max-Age=0; path=/;'; // Clear tenantId cookie
  
        setLoggedIn(false);

        // Optionally redirect to login page
        router.push('/login');
      } else {
        // Handle logout error here (e.g., display a message)
        console.error('Logout failed', response.statusText);
      }
    } catch (error) {
      console.error('An error occurred during logout', error);
    }
  };
  


  const pathname = usePathname()

  return (
    <Box bg={bgColor} borderBottom={`1px solid ${borderColor}`} p={4}>
      <Flex justify="space-between" align="center">
        {/* Admin Dashboard title with icon */}
        <Link href="/admin/bot-management">
          <Flex align="center">
            <Image src={logo} alt="User" boxSize="40px"/>
            <Box fontSize="2xl" fontWeight="bold" ml={4}>
              {name}
            </Box>
          </Flex>
        </Link>

        {/* Navigation Items */}
        <Flex gap={4}>
          {pathname !== '/' && navItems.map((item) => (
            <Button
              key={item.name}
              onClick={() => router.push(item.href)}
              variant="ghost"
              colorScheme="blue"
              size="md"
              fontSize="lg"
              bg={pathname === item.href ? activeBgColor : inactiveBgColor}
              _hover={{ bg: activeBgColor, color: activeTextColor }}
              leftIcon={<item.icon />}
            >
              {showText && item.name}
            </Button>
          ))}
        </Flex>

        {/* User Menu */}
        {loggedIn ? (
          <Menu>
            <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
              <Image src={`${imageHost}/tenant_logos/user.png`} alt="User" boxSize="40px" borderRadius="full" />
            </MenuButton>
            <MenuList zIndex={10}>
              <MenuItem onClick={() => router.push('/admin/bot-management')}>Admin</MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button onClick={() => router.push('/login')} colorScheme="blue">
            Login
          </Button>
        )}
      </Flex>
    </Box>
  )
}

export default Navbar