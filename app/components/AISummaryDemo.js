"use client"
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Avatar,
  Spinner,
  Collapse,
  IconButton,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import ReactMarkdown from "react-markdown";
import {imageHost} from '@/app/config';

const AISummaryDemo = () => {
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  useEffect(() => {
    // Simulate API call to get summary
    const fetchSummary = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      const demoSummary = `- Customer Name: John Doe
- Last Interaction: 3 days ago
- Recent Issues:
  - Trouble with account login
  - Questions about new product features
- Sentiment: Slightly frustrated but patient
- Suggested Action: Offer a walkthrough of the new interface and reassure about account security measures.`;
      setSummary(demoSummary);
      setIsLoadingSummary(false);
    };

    fetchSummary();
  }, []);

  const markdownComponents = {
    ul: ({ node, ...props }) => (
      <UnorderedList pl={4} styleType="disc" {...props} />
    ),
    li: ({ node, ...props }) => (
      <ListItem pl={2} {...props} />
    ),
  };

  return (
    <Flex height="400px" width="100%" maxWidth="800px" margin="auto" direction="row" boxShadow="lg" borderRadius="md" overflow="hidden">
      {/* Sidebar */}
      <Box
        width="250px"
        bg="gray.100"
        p={4}
        borderRight="1px"
        borderColor="gray.200"
        overflowY="auto"
      >
        <Text fontSize="xl" mb={4}>
          Connected Customers
        </Text>
        <VStack spacing={4} align="stretch">
          <HStack
            p={2}
            bg="blue.100"
            borderRadius="md"
            cursor="pointer"
          >
            <Avatar
              size="sm"
              name="John Doe"
              src={`${imageHost}/tenant_logos/user.png`}
            />
            <Text fontWeight="bold">John Doe</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Main Chat Area */}
      <Flex flex="1" direction="column">
        {/* Summary Section */}
        <Box
          bg="gray.50"
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Customer Summary
            </Text>
            <IconButton
              icon={isSummaryVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              onClick={() => setIsSummaryVisible(!isSummaryVisible)}
            />
          </Flex>
          <Collapse in={isSummaryVisible} animateOpacity>
            {isLoadingSummary ? (
              <Flex align="center">
                <Spinner size="sm" mr={2} />
                <Text>AI is generating summary...</Text>
              </Flex>
            ) : summary ? (
              <Box
                p={3}
                bg="blue.50"
                borderRadius="md"
                border="1px"
                borderColor="blue.200"
                pl={10}
              >
                <ReactMarkdown components={markdownComponents}>
                  {summary}
                </ReactMarkdown>
              </Box>
            ) : (
              <Text color="gray.500">No summary available.</Text>
            )}
          </Collapse>
        </Box>

        {/* Messages Area (with greeting message from agent) */}
        <Box
          flex="1"
          p={4}
          overflowY="auto"
          bg="white"
        >
          <Flex justify="flex-start">
            <Avatar
              size="sm"
              src={`${imageHost}/tenant_logos/agent.png`}
              name="Customer Agent"
              mr={2}
            />
            <Box
              bg="gray.100"
              p={3}
              borderRadius="md"
              maxW="70%"
            >
              <Text>您好，客服小應正在為您服務</Text>
              <Text fontSize="xs" color="gray.500" textAlign="right">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default AISummaryDemo;