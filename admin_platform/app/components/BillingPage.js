import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useBreakpointValue,
  useToast,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { tenantServiceHost } from '@/app/config';
import { format, parseISO } from 'date-fns';
import getCurrentMonthRange from '@/utils/getCurrentMonthRange';

const BillingPage = ({ tenantId }) => {
  const [usageData, setUsageData] = useState([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [billingHistory, setBillingHistory] = useState([]);
  const [hasBillingHistory, setHasBillingHistory] = useState(true); // Added state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('');
  const [currentUsageAlert, setCurrentUsageAlert] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUsageAlertLoading, setIsUsageAlertLoading] = useState(true);
  const [downloadingInvoices, setDownloadingInvoices] = useState([]); // Added state
  const [showAllUsageData, setShowAllUsageData] = useState(false); // For viewing all days

  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsiveDirection = useBreakpointValue({ base: 'column', md: 'row' });

  // Function to fetch current usage alert
  const fetchUsageAlert = async () => {
    setIsUsageAlertLoading(true);
    try {
      const response = await axios.get(
        `${tenantServiceHost}/api/v1/tenants/${tenantId}/usage-alert`
      );
      // Ensure the usage_alert is a number
      const usageAlertValue =
        response.data.usage_alert != null ? Number(response.data.usage_alert) : null;
      setCurrentUsageAlert(usageAlertValue);
      console.log("Usage alert fetched:", usageAlertValue);
    } catch (error) {
      console.error('Error fetching usage alert:', error);
      setError('Failed to fetch usage alert.');
    } finally {
      setIsUsageAlertLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageAlert();
  }, [tenantId]);

  useEffect(() => {
    const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const today = new Date();
        const response = await axios.get(
          `${tenantServiceHost}/api/v1/usage/monthly/daily/`,
          {
            params: {
              tenant_id: tenantId,
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              timezone_offset_minutes: timezoneOffsetMinutes,
            },
          }
        );

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data received from API');
        }

        const formattedData = response.data.map((item) => ({
          date: format(parseISO(item.date), 'MMM dd'),
          tokens: item.tokens_used,
          price: item.total_price,
        }));

        setUsageData(formattedData);
        const totalTokens = formattedData.reduce(
          (sum, item) => sum + item.tokens,
          0
        );
        const totalCost = formattedData.reduce(
          (sum, item) => sum + item.price,
          0
        );
        setTotalUsage(totalTokens);
        setTotalPrice(totalCost);

        // Fetch real billing history data
        try {
          const billingResponse = await axios.get(
            `${tenantServiceHost}/api/v1/tenants/${tenantId}/billing-history`
          );
          if (Array.isArray(billingResponse.data) && billingResponse.data.length > 0) {
            setBillingHistory(billingResponse.data);
            setHasBillingHistory(true);
          } else {
            setBillingHistory([]);
            setHasBillingHistory(false);
          }
        } catch (billingError) {
          if (billingError.response && billingError.response.status === 404) {
            // No billing history found
            setBillingHistory([]);
            setHasBillingHistory(false);
          } else {
            // Other errors
            throw billingError;
          }
        }
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setError(error.message || 'An error occurred while fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const handleSaveAlertThreshold = async () => {
    const parsedThreshold = parseInt(alertThreshold, 10);

    // Input validation
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid non-negative number for the threshold.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.patch(
        `${tenantServiceHost}/api/v1/tenants/${tenantId}/usage-alert`,
        { usage_alert: parsedThreshold },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setCurrentUsageAlert(parsedThreshold);
      console.log("Usage alert updated to:", parsedThreshold);

      toast({
        title: 'Success',
        description: 'Usage alert threshold updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsAlertModalOpen(false);
    } catch (error) {
      console.error('Error updating usage alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update usage alert threshold.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const FloatingBox = ({ children, ...props }) => (
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

  if (isLoading || isUsageAlertLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        {error && (
          <Alert status="error">
            <AlertIcon />
            Error loading data: {error}
          </Alert>
        )}
        <Heading as="h1" size="xl">
          Billing Dashboard
        </Heading>

        <HStack spacing={responsiveSpacing} align="stretch" flexDirection={responsiveDirection}>
          <FloatingBox flex={1}>
            <Stat>
              <StatLabel>Current Usage</StatLabel>
              <StatNumber>{totalUsage.toLocaleString()} tokens</StatNumber>
              <StatHelpText>{getCurrentMonthRange()}</StatHelpText>
            </Stat>
          </FloatingBox>
          <FloatingBox flex={1}>
            <Stat>
              <StatLabel>Estimated Bill</StatLabel>
              <StatNumber>${totalPrice.toFixed(2)}</StatNumber>
              <StatHelpText>Based on current usage</StatHelpText>
            </Stat>
          </FloatingBox>
          <FloatingBox flex={1}>
            <Stat>
              <StatLabel>Usage Alert Threshold</StatLabel>
              <StatNumber>
                {currentUsageAlert != null ? `${currentUsageAlert.toLocaleString()} tokens` : 'Not Set'}
              </StatNumber>
              <StatHelpText>
                {currentUsageAlert != null ? 'Current threshold' : 'No threshold set'}
              </StatHelpText>
            </Stat>
          </FloatingBox>
        </HStack>

        {usageData.length > 0 ? (
          <FloatingBox>
            <Heading as="h2" size="md" mb={4}>
              Daily Usage This Billing Period
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, dataKey) => {
                    if (dataKey === 'tokens') {
                      return [value.toLocaleString(), 'Tokens'];
                    } else if (dataKey === 'price') {
                      return [`$${value.toFixed(2)}`, 'Price'];
                    }
                    return [value, dataKey];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#3182CE"
                  name="Tokens"
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#38A169"
                  name="Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </FloatingBox>
        ) : (
          <Alert status="warning">
            <AlertIcon />
            No usage data available for the selected period.
          </Alert>
        )}

        {usageData.length > 0 && (
          <FloatingBox>
            <Heading
              as="h2"
              size="md"
              mb={4}
              onClick={() => setShowUsageDetails(!showUsageDetails)}
              cursor="pointer"
            >
              Usage Details {showUsageDetails ? '▲' : '▼'}
            </Heading>
            <Collapse in={showUsageDetails} animateOpacity>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Tokens Used</Th>
                    <Th>Price</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {usageData.slice(0, showAllUsageData ? usageData.length : 5).map((item, index) => (
                    <Tr key={index}>
                      <Td>{item.date}</Td>
                      <Td>{item.tokens.toLocaleString()}</Td>
                      <Td>${item.price.toFixed(4)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {usageData.length > 5 && (
                <Text
                  mt={2}
                  color="blue.500"
                  cursor="pointer"
                  onClick={() => setShowAllUsageData(!showAllUsageData)}
                >
                  {showAllUsageData ? 'View less' : `View all ${usageData.length} days`}
                </Text>
              )}
            </Collapse>
          </FloatingBox>
        )}

        <FloatingBox>
          <Heading as="h2" size="md" mb={4}>
            Billing History
          </Heading>
          {hasBillingHistory ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Period</Th>
                  <Th>Tokens Used</Th>
                  <Th>Total Price</Th>
                  <Th>Invoice</Th>
                </Tr>
              </Thead>
              <Tbody>
                {billingHistory.map((item, index) => (
                  <Tr key={index}>
                    <Td>{item.period}</Td>
                    <Td>{item.tokens_used.toLocaleString()}</Td> {/* Updated property */}
                    <Td>${item.total_price.toFixed(2)}</Td> {/* Updated property */}
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleDownloadInvoice(item.id, item.period)}
                        isLoading={downloadingInvoices.includes(item.id)}
                        loadingText="Downloading"
                      >
                        Download Invoice
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No billing history available.</Text>
          )}
        </FloatingBox>

        <HStack justify="flex-end" flexDirection={responsiveDirection}>
          <Button onClick={() => {
            setAlertThreshold(currentUsageAlert != null ? currentUsageAlert.toString() : '');
            setIsAlertModalOpen(true);
          }}>
            Set Usage Alert
          </Button>
        </HStack>
      </VStack> 

      {/* Usage Alert Modal */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Usage Alert Threshold</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>
              Enter the token usage threshold at which you would like to receive
              an alert:
            </Text>
            <NumberInput
              placeholder="Enter token threshold"
              value={alertThreshold}
              onChange={(valueString) => setAlertThreshold(valueString)}
              min={0}
            >
              <NumberInputField />
            </NumberInput>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSaveAlertThreshold}
              isLoading={isUpdating}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setIsAlertModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );

  // Handler for downloading invoice
  async function handleDownloadInvoice(billingId, period) {
    setDownloadingInvoices((prev) => [...prev, billingId]);
    try {
      const response = await axios.get(
        `${tenantServiceHost}/api/v1/tenants/${tenantId}/billing-history/${billingId}/invoice`,
        {
          responseType: 'blob', // Important for handling binary data
        }
      );

      // Create a link to trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from headers or set a default name
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `Invoice_${period.replace(' ', '_')}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length > 1) {
          fileName = fileNameMatch[1];
        }
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: `Invoice for ${period} has been downloaded.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading the invoice.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloadingInvoices((prev) => prev.filter((id) => id !== billingId));
    }
  }
};

export default BillingPage;
