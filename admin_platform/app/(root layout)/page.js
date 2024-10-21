"use client"
import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import AISummaryDemo from '../components/AISummaryDemo';
import Page2 from '../(demo)/demo/page2/page2';
import Page1 from '../(demo)/demo/page1/Page1';

const MotionBox = motion(Box);

const Section = ({ children, bg }) => (
  <Box
    minHeight="100vh"
    width="100%"
    bg={bg}
    display="flex"
    alignItems="center"
    justifyContent="center"
    py={20}
  >
    <Container maxW="container.xl" px={{ base: 6, md: 12, lg: 20 }}>
      {children}
    </Container>
  </Box>
);

const DemoChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '您好！我是閃應AI助理。我可以幫您解答關於我們產品的任何問題。您想了解些什麼？' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      setInput('');
      
      // Simulate AI response
      setTimeout(() => {
        let response;
        if (input.toLowerCase().includes('價格')) {
          response = '我們提供多種靈活的定價方案，以適應不同規模的企業需求。基礎版每月¥999起，包含基本的AI客服功能。企業版每月¥2999起，提供更多高級功能和客製化選項。您可以在我們的官網上找到詳細的價格信息。';
        } else if (input.toLowerCase().includes('功能')) {
          response = '閃應AI客服代理具有多項強大功能，包括：1. 自動解析上傳的PDF文檔，快速建立知識庫。2. 使用最先進的RAG（檢索增強生成）技術，無需編碼即可創建AI代理。3. 提供全面的客戶服務分析和報告平台。4. AI輔助人工客服，提高效率和服務質量。這些功能共同幫助企業提升客戶服務體驗和效率。';
        } else {
          response = '感謝您的提問。閃應AI客服代理旨在幫助企業快速構建智能、高效的客戶服務系統。我們的解決方案可以理解和回答客戶的各種查詢，同時不斷學習和改進。您還有其他具體想了解的方面嗎？比如功能特點或價格方案？';
        }
        setMessages(msgs => [...msgs, { role: 'assistant', content: response }]);
      }, 1000);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box 
        bg={useColorModeValue('white', 'gray.700')} 
        borderRadius="md" 
        p={4} 
        height="300px" 
        overflowY="auto"
        boxShadow="md"
      >
        {messages.map((message, index) => (
          <Box 
            key={index} 
            bg={message.role === 'user' ? 'blue.100' : 'gray.100'} 
            color="gray.800"
            borderRadius="md" 
            p={2} 
            mb={2}
            alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
          >
            {message.content}
          </Box>
        ))}
      </Box>
      <Flex>
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="輸入您的問題..."
          mr={2}
        />
        <Button onClick={handleSend} colorScheme="blue">發送</Button>
      </Flex>
    </VStack>
  );
};

const DynamicLandingPage = () => {
  const bgColor1 = useColorModeValue('gray.50', 'gray.800');
  const bgColor2 = useColorModeValue('white', 'gray.700');
  const bgColor3 = useColorModeValue('gray.100', 'gray.600');
  const bgColor4 = useColorModeValue('gray.200', 'gray.500');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <ChakraProvider>
      <VStack spacing={0} align="stretch">
        <Section bg={bgColor2}>
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
              <Box flex="1" mr={{ base: 0, md: 8 }} mb={{ base: 8, md: 0 }}>
                <Heading as="h2" size="xl" mb={4}>
                  體驗閃應AI
                </Heading>
                <Text fontSize="lg" mb={4}>
                  右側是閃應AI客服代理的即時演示。嘗試詢問有關我們的功能、價格或任何其他問題，感受AI如何智能回應您的需求。
                </Text>
                <Text fontSize="lg">
                  閃應讓您能夠快速部署類似的AI代理，為您的客戶提供24/7的即時支援。只需上傳您的文檔，我們的系統就會自動生成一個專屬於您業務的智能客服系統。
                </Text>
              </Box>
              <Box flex="1">
                <DemoChat />
              </Box>
            </Flex>
          </MotionBox>
        </Section>

        <Section bg={bgColor3}>
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
              <Box flex={{ base: 1, md: 2 }} mr={{ base: 0, md: 8 }} mb={{ base: 8, md: 0 }}>
                <AISummaryDemo />
              </Box>
              <Box flex="1">
                <Heading as="h2" size="xl" mb={4}>
                  為客戶服務賦能
                </Heading>
                <Text fontSize="lg" mb={4}>
                  利用生成式模型技術解決傳統客戶服務痛點，為客服工作賦能。
                </Text>
                <Text fontSize="lg">
                  AI即時生成總結，讓客服人員第一時間掌握進度。客戶再也不需要重複自己的問題，享受最自然流暢的服務體驗。
                </Text>
              </Box>
            </Flex>
          </MotionBox>
        </Section>

        <Section bg={bgColor4}>
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
              <Box flex="2" mr={{ base: 0, md: 8 }} mb={{ base: 8, md: 0 }}>
                <Heading as="h2" size="xl" mb={4}>
                  最前沿的AI代理工作流，無需程式碼
                </Heading>
                <Text fontSize="lg" mb={4}>
                  閃應AI使用檢索增強生成(RAG)技術，避免幻覺產生。自動化的資料處理流程，方便管理知識庫。
                </Text>
                <Text fontSize="lg">
                  客製化AI客服需要涉及資料整理、建立向量資料庫、提示詞工程、以及檢索增強生成(RAG)。閃應協助您快速建立AI客服，並提供全托管的客服聊天平台，讓您快速享有 24/7 小時的客戶服務。
                </Text>
              </Box>
              <Box flex={{ base: 1, md: 2 }}>
                <Page2 />
              </Box>
            </Flex>
          </MotionBox>
        </Section>

        <Box bg="blue.500" color="white" py={16}>
          <Container maxW="container.xl" px={{ base: 6, md: 12, lg: 20 }}>
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <VStack spacing={4} align="stretch" p={8} borderRadius="lg">
                <Heading as="h3" size="lg">
                  準備好升級您的客戶服務了嗎？
                </Heading>
                <Text fontSize="lg">
                  上傳您的文檔，在幾分鐘內創建您的AI客戶服務代理。無需編碼，立即體驗智能客服的力量。
                </Text>
                <Box>
                  <Button colorScheme="whiteAlpha" size="lg">
                    開始試用
                  </Button>
                </Box>
              </VStack>
            </MotionBox>
          </Container>
        </Box>
      </VStack>
    </ChakraProvider>
  );
};

export default DynamicLandingPage;