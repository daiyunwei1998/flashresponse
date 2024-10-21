"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  useToast,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { aiServiceHost } from "@/app/config";
import styles from "./TestQuery.module.css";

// Move FloatingBox outside of TestQuery
const FloatingBox = ({
  children,
  responsivePadding,
  bgColor,
  borderColor,
  shadowColor,
  ...props
}) => (
  <Box
    backgroundColor={bgColor}
    borderRadius="lg"
    p={responsivePadding}
    border="1px"
    borderColor={borderColor}
    boxShadow={`0 4px 6px ${shadowColor}`}
    transition="all 0.3s"
    _hover={{
      boxShadow: `0 6px 8px ${shadowColor}`,
      transform: "translateY(-2px)",
    }}
    {...props}
  >
    {children}
  </Box>
);

const TestQuery = ({ tenantId }) => {
  const [query, setQuery] = useState("");
  const [retrievalResult, setRetrievalResult] = useState("");
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const toast = useToast();

  const handleTestQuery = async () => {
    setIsLoadingQuery(true);

    try {
      const response = await fetch(`${aiServiceHost}/api/v1/rag/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error("AI Service error");
      }

      const data = await response.json();
      setRetrievalResult(data.data);
    } catch (error) {
      console.error("Error:", error);
      setRetrievalResult("Error fetching data. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch query results",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingQuery(false);
    }
  };

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const shadowColor = useColorModeValue(
    "rgba(0, 0, 0, 0.1)",
    "rgba(255, 255, 255, 0.1)"
  );

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        <Heading as="h1" size="xl">
          Test Query
        </Heading>
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
        >
          <VStack spacing={4} align="stretch">
            <Input
              placeholder="Enter your query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              colorScheme="blue"
              onClick={handleTestQuery}
              isLoading={isLoadingQuery}
              isDisabled={isLoadingQuery || query === ""}
            >
              Run Query
            </Button>
          </VStack>
        </FloatingBox>
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
          minHeight="150px"
          overflowY="auto"
        >
          {retrievalResult ? (
            <ReactMarkdown className={styles["markdown-content"]}>
              {retrievalResult}
            </ReactMarkdown>
          ) : (
            <Box color="gray.500">Retrieval results will appear here</Box>
          )}
        </FloatingBox>
      </VStack>
    </Box>
  );
};

export default TestQuery;
