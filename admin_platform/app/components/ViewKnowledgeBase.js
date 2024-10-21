"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useBreakpointValue,
  useColorModeValue
} from "@chakra-ui/react";
import { tenantServiceHost } from "@/app/config";

// Move FloatingBox outside of ViewKnowledgeBase
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
      transform: 'translateY(-2px)',
    }}
    {...props}
  >
    {children}
  </Box>
);

const ViewKnowledgeBase = ({ tenantId, refreshTrigger }) => {
  const [docNames, setDocNames] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docEntries, setDocEntries] = useState([]);
  const [isLoadingDocNames, setIsLoadingDocNames] = useState(false);
  const [isLoadingDocEntries, setIsLoadingDocEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();
  
  const [entryToDelete, setEntryToDelete] = useState(null);
  const cancelRef = useRef();
  const toast = useToast();

  const fetchDocNames = async () => {
    setIsLoadingDocNames(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/tenant_docs/${tenantId}`
      );

      if (response.status === 404) {
        setDocNames([]);
      }

      if (response.ok) {
        const data = await response.json();
        const docNames = data.map((item) => item.doc_name);
        setDocNames(docNames);
      }
    } catch (error) {
      console.error("Error fetching document names:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document names",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocNames(false);
    }
  };

  const fetchDocEntries = async (docName) => {
    setIsLoadingDocEntries(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries?docName=${encodeURIComponent(
          docName
        )}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch document entries");
      }
      const data = await response.json();
      console.log("doc entries:", data.entries);
      setDocEntries(data.entries);
    } catch (error) {
      console.error("Error fetching document entries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document entries",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocEntries(false);
    }
  };

  const updateEntryContent = async () => {
    if (!editingEntry) return;

    if (editedContent.trim() === "") {
      toast({
        title: "Error",
        description: "Content cannot be empty. Please enter valid content.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    try {
      console.log(`edited ${editingEntry.id}`);
      const response = await fetch(
        `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries/${editingEntry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newContent: editedContent }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update entry content");
      }
      toast({
        title: "Success",
        description: "Entry content updated successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await fetchDocEntries(selectedDoc);
    } catch (error) {
      console.error("Error updating entry content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update entry content",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
      onEditModalClose();
    }
  };

  const deleteDocument = async (docName) => {
    setDocNames(prevDocNames => prevDocNames.filter(name => name !== docName));
    setSelectedDoc(null);
    setDocEntries([]);
  };

  const deleteEntry = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries/${entryToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete entry");
      }
      toast({
        title: "Deleted",
        description: "Entry deleted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      const updatedEntries = docEntries.filter(
        (entry) => entry.id !== entryToDelete.id
      );
      setDocEntries(updatedEntries);

       if (updatedEntries.length === 0) {
        await deleteDocument(selectedDoc);
      }

    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
      onDeleteAlertClose();
    }
  };

  useEffect(() => {
    fetchDocNames();
  }, [refreshTrigger]);

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        <Heading as="h1" size="xl">
          Knowledge Base
        </Heading>
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
        >
          {isLoadingDocNames ? (
            <Text>Loading document names...</Text>
          ) : (
            <Accordion allowToggle>
              {docNames.map((docName, index) => (
                <AccordionItem key={index}>
                  <h2>
                    <AccordionButton
                      onClick={() => {
                        setSelectedDoc(docName);
                        fetchDocEntries(docName);
                      }}
                    >
                      <Box flex="1" textAlign="left">
                        {docName}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {isLoadingDocEntries && selectedDoc === docName ? (
                      <Text>Loading entries...</Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {docEntries.length === 0 ? (
                          <Text>No entries found.</Text>
                        ) : (
                          docEntries.map((entry, entryIndex) => (
                            <Box
                              key={entryIndex}
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor={borderColor}
                            >
                              <Text>{entry.content}</Text>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                mt={2}
                                mr={2}
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setEditedContent(entry.content);
                                  onEditModalOpen();
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                mt={2}
                                onClick={() => {
                                  setEntryToDelete(entry);
                                  onDeleteAlertOpen();
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          ))
                        )}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </FloatingBox>
      </VStack>

      {/* Edit Entry Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={updateEntryContent}
              isLoading={isUpdating}
              loadingText="Saving"
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onEditModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Entry Alert Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Entry
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteEntry}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ViewKnowledgeBase;
