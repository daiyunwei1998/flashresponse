"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  VStack,
  useColorModeValue,
  useToast,
  Button,
  useBreakpointValue,
  Icon,
  Container,
} from "@chakra-ui/react";
import { FaUser, FaChartBar, FaCog, FaHome } from 'react-icons/fa';
import { BsDatabaseAdd } from "react-icons/bs";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { chatServiceHost } from "@/app/config";

import UpdateKnowledgeBase from "./UpdateKnowledgeBase";
import ViewKnowledgeBase from "./ViewKnowledgeBase";
import TestQuery from "./TestQuery";
import BillingPage from "./BillingPage";

const BotManagement = ({ tenantId }) => {
  const [activeSection, setActiveSection] = useState("knowledge");
  const [pendingTasks, setPendingTasks] = useState([]);
  const [refreshKnowledgeBase, setRefreshKnowledgeBase] = useState(0);
  const clientRef = useRef(null);
  const toast = useToast();
   

  const connect = () => {
    if (clientRef.current && clientRef.current.connected) {
      console.log("WebSocket client is already connected.");
      return;
    }

    console.log(`Connecting WebSocket for Tenant ID: ${tenantId}`);

    const socketUrl = chatServiceHost + `/ws`;
    const socket = new SockJS(socketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/queue/${tenantId}.task_complete`,
          onMessageReceived,
          {
            ack: "client-individual",
          }
        );
        console.log("Connected to WebSocket channel.");
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      debug: (str) => {
        console.log(str);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      console.log("Disconnected from WebSocket.");
    }
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received worker message:", message);

    const filename = message.file;

    setPendingTasks((prevTasks) => {
      const newTasks = prevTasks.filter((name) => name !== filename);

      if (newTasks.length === 0) {
        disconnect();
      }

      return newTasks;
    });
    if (message.status == "success") {
      toast({
        title: "Task Complete",
        description: `The task with filename ${filename} has been completed.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setRefreshKnowledgeBase((prev) => prev + 1);
    } else {
      console.log(message.error);
      toast({
        title: "Task Failed",
        description: message.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    payload.ack();
  };


  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const sidebarBgColor = useColorModeValue("white", "gray.700");
  const buttonActiveColor = useColorModeValue("blue.500", "blue.200");
  const buttonHoverBgColor = useColorModeValue("gray.100", "gray.600");
  const shadowColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)");
  
  const isMobile = useBreakpointValue({ base: true, md: false });

  const menuItems = [
    { label: "Data", icon: BsDatabaseAdd, value: "knowledge" },
    { label: "Test", icon: FaCog, value: "test" },
    { label: "Billing", icon: FaChartBar, value: "billing" },
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" p={0}>
        <Flex direction="column" minH="100vh">
          <Flex flex="1">
            {!isMobile && (
              <Box
                w="80px"
                minW="80px"
                bg={sidebarBgColor}
                position="sticky"
                top="20px"
                alignSelf="flex-start"
                borderRadius="xl"
                boxShadow={`0 4px 12px ${shadowColor}`}
                mr={4}
                p={4}
                mt={16}
                display="flex"
                flexDirection="column"
                alignItems="center"
                maxH="calc(100vh - 40px)"
                overflowY="auto"
                overflowX="hidden"
              >
                <VStack spacing={6} align="center" width="100%">
                  {menuItems.map((item) => (
                    <Button
                      key={item.value}
                      onClick={() => setActiveSection(item.value)}
                      color={activeSection === item.value ? buttonActiveColor : "gray.500"}
                      bg="transparent"
                      _hover={{ bg: buttonHoverBgColor }}
                      borderRadius="md"
                      w="100%"
                      h="60px"
                      p={0}
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Icon as={item.icon} boxSize={6} mb={1} />
                      <Box fontSize="xs" textAlign="center" whiteSpace="normal" wordBreak="break-word">{item.label}</Box>
                    </Button>
                  ))}
                </VStack>
              </Box>
            )}

            <Box flex={1} p={8} pb={isMobile ? "100px" : "8"}>
              {activeSection === "knowledge" && (
                <>
                  <UpdateKnowledgeBase
                    tenantId={tenantId}
                    pendingTasks={pendingTasks}
                    setPendingTasks={setPendingTasks}
                    connect={connect}
                    clientRef={clientRef}
                    setRefreshKnowledgeBase={setRefreshKnowledgeBase}
                  />
                  <ViewKnowledgeBase tenantId={tenantId} refreshTrigger={refreshKnowledgeBase}  />
                </>
              )}

              {activeSection === "test" && <TestQuery tenantId={tenantId} />}
              {activeSection === "billing" && <BillingPage tenantId={tenantId} />}
            </Box>
          </Flex>

          {isMobile && (
            <Box
              position="fixed"
              bottom="0"
              width="100%"
              bg={sidebarBgColor}
              boxShadow={`0 -4px 12px ${shadowColor}`}
              p={2}
              display="flex"
              justifyContent="space-around"
              zIndex="10"
            >
              {menuItems.map((item) => (
                <Button
                  key={item.value}
                  onClick={() => setActiveSection(item.value)}
                  color={activeSection === item.value ? buttonActiveColor : "gray.500"}
                  bg="transparent"
                  _hover={{ bg: buttonHoverBgColor }}
                  borderRadius="md"
                  w="100%"
                  h="60px"
                  p={0}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Icon as={item.icon} boxSize={6} mb={1} />
                  <Box fontSize="xs" textAlign="center" whiteSpace="normal" wordBreak="break-word">
                    {item.label}
                  </Box>
                </Button>
              ))}
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default BotManagement;
