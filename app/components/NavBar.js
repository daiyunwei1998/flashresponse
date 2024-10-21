'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Button,
  Image,
  Text,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { chatServiceHost } from '@/app/config';


const Navbar = ({ name, logo, userId, tenantId, initialJwt }) => {
  const [jwt, setJwt] = useState(initialJwt);
  const [loggedIn, setLoggedIn] = useState(initialJwt)
  const router = useRouter(); 
  

  useEffect(() => {
    setLoggedIn(initialJwt);
  }, [initialJwt]);


  // Chakra UI color modes
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Responsive font and logo sizes
  const fontSize = useBreakpointValue({ base: 'md', md: 'xl', lg: '2xl' });
  const logoSize = useBreakpointValue({ base: '30px', md: '35px', lg: '40px' });
  
  // Fixed width for Logout button container to reserve space
  const logoutButtonWidth = useBreakpointValue({ base: '60px', md: '80px' });

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${chatServiceHost}/api/v1/tenants/${tenantId}/users/logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        setJwt(null); // Update the jwt state
        setLoggedIn(false);
        router.push('/login');
      } else {
        console.error('Logout failed', response.statusText);
      }
    } catch (error) {
      console.error('An error occurred during logout', error);
    }
  };

  return (
    <Box
      bg={bgColor}
      borderBottom={`1px solid ${borderColor}`}
      height="72px"
      position="relative"
      width="100%"
    >
      {/* Central Content: Logo and Name */}
      <Flex
        align="center"
        justify="center"
        height="100%"
        px={4}
        maxW="calc(100% - 120px)" // Adjust based on Logout button width
        mx="auto"
        overflow="hidden"
      >
        <Image
          src={logo}
          alt="Logo"
          boxSize={logoSize}
          mr={2}
          objectFit="contain"
        />
        <Text
          fontSize={fontSize}
          fontWeight="bold"
          noOfLines={1}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          textAlign="center"
        >
          {name}
        </Text>
      </Flex>

      {/* Logout Button */}
      {loggedIn && (
        <Box
          position="absolute"
          right="20px"
          top="50%"
          transform="translateY(-50%)"
          width={logoutButtonWidth}
        >
          <Button
            onClick={handleLogout}
            colorScheme="red"
            size="sm"
            width="100%"
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
