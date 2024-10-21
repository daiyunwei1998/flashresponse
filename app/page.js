import Chat from "./components/Chat";
import { cookies } from 'next/headers'
import { Flex } from '@chakra-ui/react';

export default function Home() {
  const tenantId = cookies().get('tenantId')?.value
  const userId = cookies().get('userId')?.value
  const jwt = cookies().get('jwt')?.value
  const userName = cookies().get('userName')?.value
  
  return (
    <Flex direction="column" height="100%" width="100%">
      <Chat tenantId={tenantId} userId={userId} userName={userName} jwt={jwt} />
    </Flex>
  );
}
