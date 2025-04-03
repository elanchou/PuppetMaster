import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  List,
  ListItem,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Collapse,
  Switch,
  FormControl,
  FormLabel,
  Divider,
} from '@chakra-ui/react';
import { FiRefreshCw, FiEdit2, FiMessageSquare, FiUpload, FiPlay } from 'react-icons/fi';
import { API_BASE_URL } from '../config';

interface ErrorRecord {
  id: string;
  timestamp: string;
  selector: string;
  action: string;
  error: string;
  attempts: Array<{
    selector: string;
    success: boolean;
    timestamp: string;
  }>;
  status: 'pending' | 'fixed' | 'failed';
}

interface AIMessage {
  type: 'system' | 'ai';
  content: string;
  timestamp: string;
}

const ErrorCorrector: React.FC = () => {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customSelector, setCustomSelector] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/errors`);
      if (!response.ok) {
        throw new Error('获取错误记录失败');
      }
      const data = await response.json();
      setErrors(data);
    } catch (error) {
      console.error('获取错误记录失败:', error);
      toast({
        title: "错误",
        description: "获取错误记录失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (record: ErrorRecord) => {
    try {
      // 添加系统消息
      const systemMessage: AIMessage = {
        type: 'system',
        content: `开始修复选择器: ${record.selector}`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, systemMessage]);

      const response = await fetch(`${API_BASE_URL}/errors/${record.id}/retry`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('重试失败');
      }
      
      const result = await response.json();
      
      // 添加 AI 响应消息
      const aiMessage: AIMessage = {
        type: 'ai',
        content: `分析完成:\n原选择器: ${record.selector}\n新选择器: ${result.attempts[result.attempts.length - 1].selector}\n修复状态: ${result.attempts[result.attempts.length - 1].success ? '成功' : '失败'}`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, aiMessage]);

      await fetchErrors();
      toast({
        title: "成功",
        description: "重试成功",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('重试失败:', error);
      toast({
        title: "错误",
        description: "重试失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCustomFix = async () => {
    if (!selectedError || !customSelector) return;

    try {
      // 添加系统消息
      const systemMessage: AIMessage = {
        type: 'system',
        content: `应用自定义选择器: ${customSelector}`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, systemMessage]);

      const response = await fetch(`${API_BASE_URL}/errors/${selectedError.id}/fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selector: customSelector })
      });

      if (!response.ok) {
        throw new Error('应用自定义修复失败');
      }

      const result = await response.json();
      
      // 添加 AI 响应消息
      const aiMessage: AIMessage = {
        type: 'ai',
        content: `自定义修复完成:\n原选择器: ${selectedError.selector}\n新选择器: ${customSelector}\n修复状态: 成功`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, aiMessage]);

      setModalVisible(false);
      setCustomSelector('');
      await fetchErrors();
      toast({
        title: "成功",
        description: "修复成功",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('应用自定义修复失败:', error);
      toast({
        title: "错误",
        description: "应用自定义修复失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const colorScheme = status === 'fixed' ? 'green' : status === 'failed' ? 'red' : 'blue';
    return (
      <Badge colorScheme={colorScheme}>
        {status === 'fixed' ? '已修复' : status === 'failed' ? '失败' : '处理中'}
      </Badge>
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScriptContent(e.target?.result as string);
        toast({
          title: "脚本上传成功",
          description: `已加载脚本: ${file.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleStartCorrection = async () => {
    if (!scriptContent) {
      toast({
        title: "错误",
        description: "请先上传脚本",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (useAds && !adsUserId) {
      toast({
        title: "错误",
        description: "使用 AdsPower 时需要提供用户ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRunning(true);
    setAiMessages([{
      type: 'system',
      content: '开始执行自动纠错...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch(`${API_BASE_URL}/error-correction/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: scriptContent,
          useAds,
          adsUserId
        })
      });

      if (!response.ok) {
        throw new Error('启动纠错失败');
      }

      await fetchErrors();
      toast({
        title: "成功",
        description: "自动纠错已启动",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('启动纠错失败:', error);
      toast({
        title: "错误",
        description: "启动纠错失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsRunning(false);
    }
  };

  return (
    <Box p={6}>
      <Heading mb={6}>错误纠正</Heading>
      
      <HStack spacing={8} align="flex-start">
        <Card flex={2}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>上传Puppet脚本</FormLabel>
                <input
                  type="file"
                  accept=".js,.ts"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Button
                  leftIcon={<FiUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  width="100%"
                >
                  {scriptContent ? '重新上传脚本' : '上传脚本'}
                </Button>
                {scriptContent && (
                  <Text fontSize="sm" color="green.500" mt={2}>
                    ✓ 脚本已加载
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>使用 AdsPower</FormLabel>
                <HStack>
                  <Switch
                    isChecked={useAds}
                    onChange={(e) => setUseAds(e.target.checked)}
                  />
                  {useAds && (
                    <Input
                      placeholder="AdsPower 用户ID"
                      value={adsUserId}
                      onChange={(e) => setAdsUserId(e.target.value)}
                    />
                  )}
                </HStack>
              </FormControl>

              <Button
                leftIcon={<FiPlay />}
                colorScheme="blue"
                onClick={handleStartCorrection}
                isLoading={loading}
                isDisabled={!scriptContent || isRunning}
              >
                开始纠错
              </Button>

              <Divider />

              <HStack justify="space-between" mb={4}>
                <Heading size="md">错误列表</Heading>
                <Button
                  leftIcon={<FiRefreshCw />}
                  onClick={fetchErrors}
                  isLoading={loading}
                >
                  刷新
                </Button>
              </HStack>
              
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>时间</Th>
                    <Th>选择器</Th>
                    <Th>操作</Th>
                    <Th>错误信息</Th>
                    <Th>状态</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {errors.map(error => (
                    <React.Fragment key={error.id}>
                      <Tr>
                        <Td>{new Date(error.timestamp).toLocaleString()}</Td>
                        <Td><Code>{error.selector}</Code></Td>
                        <Td>{error.action}</Td>
                        <Td color="red.500">{error.error}</Td>
                        <Td>
                          <Badge colorScheme={error.status === 'fixed' ? 'green' : error.status === 'failed' ? 'red' : 'blue'}>
                            {error.status === 'fixed' ? '已修复' : error.status === 'failed' ? '失败' : '处理中'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="重试"
                              icon={<FiRefreshCw />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleRetry(error)}
                              isDisabled={error.status === 'fixed'}
                            />
                            <IconButton
                              aria-label="自定义修复"
                              icon={<FiEdit2 />}
                              size="sm"
                              onClick={() => {
                                setSelectedError(error);
                                setModalVisible(true);
                              }}
                              isDisabled={error.status === 'fixed'}
                            />
                            {error.attempts.length > 0 && (
                              <IconButton
                                aria-label="查看历史"
                                icon={<FiMessageSquare />}
                                size="sm"
                                onClick={() => toggleRow(error.id)}
                              />
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td colSpan={6} p={0}>
                          <Collapse in={expandedRows.has(error.id)}>
                            <Box bg="gray.50" p={4}>
                              <Table size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>尝试时间</Th>
                                    <Th>尝试的选择器</Th>
                                    <Th>结果</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {error.attempts.map((attempt, index) => (
                                    <Tr key={index}>
                                      <Td>{new Date(attempt.timestamp).toLocaleString()}</Td>
                                      <Td><Code>{attempt.selector}</Code></Td>
                                      <Td>
                                        <Badge colorScheme={attempt.success ? 'green' : 'red'}>
                                          {attempt.success ? '成功' : '失败'}
                                        </Badge>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                          </Collapse>
                        </Td>
                      </Tr>
                    </React.Fragment>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>

        <Card flex={1}>
          <CardBody>
            <Heading size="md" mb={4}>AI 交互记录</Heading>
            <List spacing={3} maxH="calc(100vh - 300px)" overflowY="auto">
              {aiMessages.map((message, index) => (
                <ListItem
                  key={index}
                  p={3}
                  bg={message.type === 'system' ? 'blue.50' : 'green.50'}
                  borderRadius="md"
                >
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    [{new Date(message.timestamp).toLocaleTimeString()}]
                    {message.type === 'system' ? ' 系统' : ' AI 助手'}
                  </Text>
                  <Text whiteSpace="pre-wrap">{message.content}</Text>
                </ListItem>
              ))}
              {aiMessages.length === 0 && (
                <Text color="gray.500">暂无交互记录</Text>
              )}
            </List>
          </CardBody>
        </Card>
      </HStack>

      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>自定义修复</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box>
                <Text mb={2}>当前选择器:</Text>
                <Code>{selectedError?.selector}</Code>
              </Box>
              <Input
                placeholder="输入新的选择器"
                value={customSelector}
                onChange={(e) => setCustomSelector(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCustomFix}
              isDisabled={!customSelector}
            >
              应用
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ErrorCorrector; 