import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Icon, Image, Flex, useBreakpointValue } from '@chakra-ui/react';
import { FaDatabase, FaFileAlt, FaArrowRight } from 'react-icons/fa';
import { BsBodyText } from "react-icons/bs";
import {imageHost} from '@/app/config'

const FloatingIsland = ({ children, isActive, onMouseEnter, onMouseLeave }) => (
  <Box
    borderWidth={1}
    borderRadius="md"
    p={4}
    boxShadow="lg"
    bg="white"
    mb={4}
    transition="all 0.3s"
    opacity={isActive ? 1 : 0.6}
    transform={isActive ? "scale(1.02)" : "scale(1)"}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    _hover={{ boxShadow: "xl" }}
    width="100%"
  >
    {children}
  </Box>
);

const Page2 = () => {
  const [activeSection, setActiveSection] = useState(null);
  const iconSize = useBreakpointValue({ base: 6, md: 7 });
  const arrowSize = useBreakpointValue({ base: 4, md: 5 });
  const stackDirection = useBreakpointValue({ base: "column", md: "row" });

  return (
    <VStack spacing={5} align="stretch" p={3}>
      <FloatingIsland
        isActive={activeSection === 0 || activeSection === null}
        onMouseEnter={() => setActiveSection(0)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Flex align="center" justify="space-between">
          <Text color="rgb(66,153,225)" fontWeight="bold" fontSize="xl">建立知識庫</Text>
          <Flex direction={stackDirection} align="center" wrap="wrap">
            <VStack spacing={2} align="center">
              <Icon as={FaFileAlt} boxSize={iconSize} color="red.500" />
              <Text fontSize="sm">原始資料</Text>
            </VStack>
            <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" mx={2} />
            <VStack spacing={2} align="center">
              <Icon as={BsBodyText} boxSize={iconSize} color="gray.500" />
              <Text fontSize="sm">文字塊</Text>
            </VStack>
            <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" mx={2} />
            <VStack spacing={2} align="center">
              <Icon as={FaDatabase} boxSize={iconSize} color="blue.500" />
              <Text fontSize="sm">向量化</Text>
            </VStack>
          </Flex>
        </Flex>
      </FloatingIsland>

      <FloatingIsland
        isActive={activeSection === 1 || activeSection === null}
        onMouseEnter={() => setActiveSection(1)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Flex align="center" justify="space-between">
          <Text color="rgb(66,153,225)" fontWeight="bold" fontSize="xl">調整LLM</Text>
          <Flex align="center" justify="center">
            <HStack spacing={2} align="center">
              <Text fontSize="sm">query</Text>
              <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" />
            </HStack>
            <Image 
              src={`${imageHost}/demo/openai-logo.png`}
              alt="OpenAI" 
              width="100px"
              height="32px"
              objectFit="contain" 
              mx={3}
            />
            <HStack spacing={2} align="center">
              <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" />
              <Text fontSize="sm">response</Text>
            </HStack>
          </Flex>
        </Flex>
      </FloatingIsland>

      <FloatingIsland
        isActive={activeSection === 2 || activeSection === null}
        onMouseEnter={() => setActiveSection(2)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Flex align="center" justify="space-between" position="relative">
          <Box
            position="absolute"
            left={4}
            top="50%"
            transform="translateY(-50%)"
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <VStack spacing={1}>
              {['串', '接', '服', '務'].map((char, index) => (
                <Text
                  key={index}
                  color="rgb(66,153,225)"
                  fontWeight="bold"
                  fontSize="xl"
                  lineHeight="1"
                >
                  {char}
                </Text>
              ))}
            </VStack>
          </Box>
          <Box flexBasis="100%" pl="50px">
            <Image src={`${imageHost}/demo/chat-example.png`} alt="Chat Example" w="100%" h="auto" />
          </Box>
        </Flex>
      </FloatingIsland>
    </VStack>
  );
};

export default Page2;