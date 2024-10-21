"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Flex, Text, Spinner, VStack } from "@chakra-ui/react";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = searchParams.get('tenant');
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAndRedirect = async () => {
      setIsValidating(true);
      if (tenant) {
        const csrfToken = uuidv4();
        document.cookie = `oauth_csrf_token=${csrfToken}; path=/; secure; SameSite=Lax`;
        const state = btoa(JSON.stringify({ tenant, csrf: csrfToken }));

        const oauthParams = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          redirect_uri: 'https://auth.flashresponse.net/auth/callback',
          response_type: 'code',
          scope: 'openid email profile',
          state,
          access_type: 'offline',
          prompt: 'consent',
        });

        // Simulate a delay to show the loading state (remove in production)
        await new Promise(resolve => setTimeout(resolve, 1500));

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams.toString()}`;
      } else {
        setIsValidating(false);
        alert('Missing tenant information.');
        router.push('/');
      }
    };

    validateAndRedirect();
  }, [tenant, router]);

  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="flex-start" 
      width="100%" 
      height="100vh" 
      pt="20vh" // Adjust this value to move content up or down
      bg="gray.50"
    >
      <VStack spacing={4} align="center" width="100%" maxWidth="400px">
        {isValidating ? (
          <>
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="lg" fontWeight="medium" textAlign="center">Preparing for authentication...</Text>
            <Text color="gray.500" textAlign="center">Please wait while we redirect you to Google.</Text>
          </>
        ) : (
          <Text fontSize="lg" color="red.500" textAlign="center">Authentication failed. Redirecting to home...</Text>
        )}
      </VStack>
    </Flex>
  );
};

export default AuthPage;