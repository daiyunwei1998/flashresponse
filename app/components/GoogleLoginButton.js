"use client"
import { Button } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';

export const GoogleLoginButton = ({tenant}) => {

  const initiateGoogleOAuth = () => {
    console.log("Redirecting to Google auth page for " + tenant)
    // Redirect to the central OAuth handler with tenant information

    window.location.href = `https://auth.flashresponse.net/auth?tenant=${tenant}`;
  };

  return (
    <Button
      w={'full'}
      variant={'outline'}
      leftIcon={<FcGoogle />}
      onClick={initiateGoogleOAuth}
    >
      使用 Google 登入
    </Button>
  );
};
