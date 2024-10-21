// components/Chat.jsx

"use client";
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  Spinner,
  Avatar,
  VStack,
  useToast,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { chatServiceHost, imageHost } from "@/app/config";
import styles from './Chat.module.css'; // Ensure this does not contain conflicting styles
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chat = ({ tenantId, userId, userName, jwt }) => {
  // State Variables
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isComposing, setIsComposing] = useState(false); // New state for composition
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  // Connect to WebSocket
  const connectWebSocket = () => {
    const socketUrl = `${chatServiceHost}/ws?user=${userId}`;
    const socket = new SockJS(socketUrl);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to WebSocket");

        client.subscribe("/user/queue/messages", onMessageReceived);

        client.publish({
          destination: "/app/chat.addUser",
          body: JSON.stringify({
            sender: userId,
            type: "JOIN",
            tenant_id: tenantId,
            user_type: "customer",
            sender_name: userName,
            content: `${userName} joined the chat.`,
          }),
        });

        setIsConnected(true);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        toast({
          title: "WebSocket Error",
          description: frame.headers["message"],
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
      debug: (str) => {
        console.log(str);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  // Handle Incoming Messages
  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received message:", message);
    if (message.type === "CHAT") {
      setMessages((prevMessages) => [...prevMessages, message]);
    }
    setIsReplying(message.type === "ACKNOWLEDGEMENT");
  };

  // Send Message Function
  const sendMessage = () => {
    if (messageInput.trim() !== "" && clientRef.current) {
      const chatMessage = {
        sender: userId,
        content: messageInput,
        type: "CHAT",
        tenant_id: tenantId,
        receiver: null,
        user_type: "customer",
        timestamp: new Date().toISOString(),
        sender_name: userName,
      };

      setMessages((prevMessages) => [...prevMessages, chatMessage]);

      clientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      setMessageInput("");
    }
  };

  // Format Timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initialize WebSocket Connection
  useEffect(() => {
    if (tenantId && userId) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, userId]);

  // Handle Copy Event to Strip HTML
  useEffect(() => {
    const handleCopy = (e) => {
      const text_only = document.getSelection().toString();

      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", text_only);
        e.clipboardData.setData("text/html", text_only);
        e.preventDefault();
      } else if (window.clipboardData) {
        window.clipboardData.setData("text", text_only);
        e.preventDefault();
      }
    };

    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  // Define custom components for ReactMarkdown to style markdown content
  const markdownComponents = {
    ul: ({ node, ...props }) => (
      <UnorderedList pl={4} styleType="disc" {...props} />
    ),
    li: ({ node, ...props }) => <ListItem pl={2} {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Box overflowX="auto" borderRadius="md" my={2}>
          <SyntaxHighlighter
            style={solarizedlight}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <Flex direction="column" flex="1" width="100%" height="calc(100vh - 72px)" bg="gray.50"> {/* Set Chat background color */}
      {/* Main Chat Area */}
      <Box flex="1" direction="column" p={4} overflowY="scroll">
        <VStack spacing={4} align="stretch">
          {messages.map((msg, idx) => {
            const isOutgoing = msg.sender === userId || msg.sender === "AI";
            return (
              <Flex
                key={idx}
                justify={isOutgoing ? "flex-end" : "flex-start"}
                align="flex-end"
              >
                {!isOutgoing && (
                  <Avatar
                    size="sm"
                    src={`${imageHost}/tenant_logos/agent.png`}
                    name={msg.sender_name || "Support"}
                    mr={2}
                  />
                )}
                <Box
                  bg={isOutgoing ? "blue.100" : "gray.100"}
                  p={3}
                  borderRadius="md"
                  maxW="70%"
                >
                  <ReactMarkdown components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                  <Text fontSize="xs" color="gray.500" textAlign="right">
                    {formatTimestamp(msg.timestamp)}
                  </Text>
                </Box>
                {isOutgoing && (
                  <Avatar
                    size="sm"
                    src={`${imageHost}/tenant_logos/user.png`}
                    name={userName}
                    ml={2}
                  />
                )}
              </Flex>
            );
          })}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Typing Indicator */}
      {isReplying && (
        <Flex alignItems="center" p={2} bg="gray.100">
          <Spinner size="sm" mr={2} />
          <Text>Support is typing...</Text>
        </Flex>
      )}

      {/* Message Input */}
      <Box
        p={4}
        bg="white" // Different background for input area
        borderTop="1px solid"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
      >
        <Input
          placeholder="Type your message here..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isComposing) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
        <Button
          colorScheme="blue"
          ml={2}
          onClick={sendMessage}
          isDisabled={!messageInput.trim()}
        >
          Send
        </Button>
      </Box>
    </Flex>
  );
};

export default Chat;
