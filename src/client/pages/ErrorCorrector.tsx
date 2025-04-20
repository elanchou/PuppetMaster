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
  Container,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { FiRefreshCw, FiEdit2, FiMessageSquare, FiUpload, FiPlay } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import {
  API_PATHS,
  ErrorRecord,
  StartErrorCorrectionRequest,
  StartErrorCorrectionResponse,
  FixErrorRequest
} from '../../types/api';

// 构建WebSocket URL
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

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
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);

  // 初始化WebSocket连接
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      setIsBrowserConnected(true);
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 只处理与当前纠错会话相关的消息
        if (correctionId && data.data.correctionId !== correctionId) return;
        
        console.log('收到WebSocket消息', data);
        
        switch (data.type) {
          case 'log':
            // 处理日志消息
            if (data.data.level === 'error') {
              setError(data.data.message);
              toast({
                title: "错误",
                description: data.data.message,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            }
            break;
          
          case 'ai-message':
            // 添加AI消息
            setAiMessages(prev => [...prev, {
              type: data.data.type,
              content: data.data.content,
              timestamp: data.data.timestamp
            }]);
            break;
          
          case 'correction-start':
            setError(null);
            toast({
              title: "纠错开始",
              description: "开始自动纠错过程",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'correction-complete':
            setIsRunning(false);
            setError(null);
            fetchErrors();
            toast({
              title: "纠错完成",
              description: `纠错完成，发现 ${data.data.errorCount} 个错误`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'correction-error':
            setIsRunning(false);
            setError(data.data.error);
            toast({
              title: "纠错失败",
              description: data.data.error,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            break;

          case 'browser-disconnected':
            setIsBrowserConnected(false);
            setError('浏览器连接已断开');
            toast({
              title: "连接断开",
              description: "浏览器连接已断开，请重新连接",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            break;
        }
      } catch (error) {
        console.error('解析WebSocket消息失败', error);
        setError('解析消息失败');
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket错误', error);
      setIsBrowserConnected(false);
      setError('WebSocket连接错误');
      toast({
        title: "连接错误",
        description: "无法连接到服务器",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    };
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      setIsBrowserConnected(false);
      setError('WebSocket连接已关闭');
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [correctionId]);

  // 自动滚动消息列表
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [aiMessages]);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.GET_ERRORS}`);
      if (!response.ok) {
        throw new Error('获取错误记录失败');
      }
      const data = await response.json() as ErrorRecord[];
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

      const response = await fetch(`${API_BASE_URL}${API_PATHS.RETRY_ERROR(record.id)}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('重试失败');
      }
      
      const result = await response.json() as ErrorRecord;
      
      // 添加 AI 响应消息
      const aiMessage: AIMessage = {
        type: 'ai',
        content: `分析完成:\n原选择器: ${record.selector}\n新选择器: ${result.attempts[result.attempts.length - 1].selector}\n修复状态: ${result.attempts[result.attempts.length - 1].success ? '成功' : '失败'}`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, aiMessage]);

      // 更新错误记录列表
      setErrors(prev => prev.map(e => e.id === record.id ? result : e));
      
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

      const request: FixErrorRequest = {
        selector: customSelector
      };

      const response = await fetch(`${API_BASE_URL}${API_PATHS.FIX_ERROR(selectedError.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('应用自定义修复失败');
      }

      const result = await response.json() as ErrorRecord;
      
      // 添加 AI 响应消息
      const aiMessage: AIMessage = {
        type: 'ai',
        content: `自定义修复完成:\n原选择器: ${selectedError.selector}\n新选择器: ${customSelector}\n修复状态: 成功`,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, aiMessage]);

      // 更新错误记录列表
      setErrors(prev => prev.map(e => e.id === selectedError.id ? result : e));

      setModalVisible(false);
      setCustomSelector('');
      
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

    if (!isBrowserConnected) {
      toast({
        title: "错误",
        description: "浏览器未连接，请等待连接后再试",
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
    setError(null);
    setAiMessages([{
      type: 'system',
      content: '开始执行自动纠错...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const request: StartErrorCorrectionRequest = {
        script: scriptContent,
        useAds,
        adsUserId
      };

      const response = await fetch(`${API_BASE_URL}${API_PATHS.START_ERROR_CORRECTION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('启动纠错失败');
      }

      const result = await response.json() as StartErrorCorrectionResponse;
      
      if (!result.success) {
        throw new Error(result.error || '启动纠错失败');
      }
      
      setCorrectionId(result.correctionId);
      
      toast({
        title: "成功",
        description: "自动纠错已启动",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('启动纠错失败:', error);
      setError(error instanceof Error ? error.message : '启动纠错失败');
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '启动纠错失败',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsRunning(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>错误纠正</Heading>
        
        {error && (
          <Card bg="red.50">
            <CardBody>
              <Text color="red.500">{error}</Text>
            </CardBody>
          </Card>
        )}
        
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>上传脚本</FormLabel>
                <HStack>
                  <Input
                    type="file"
                    accept=".js,.ts,.txt"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    display="none"
                  />
                  <Button
                    leftIcon={<FiUpload />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择文件
                  </Button>
                  {scriptContent && (
                    <Text>已加载脚本</Text>
                  )}
                </HStack>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">使用 AdsPower</FormLabel>
                <Switch
                  isChecked={useAds}
                  onChange={(e) => setUseAds(e.target.checked)}
                />
              </FormControl>
              
              {useAds && (
                <FormControl>
                  <FormLabel>AdsPower 用户ID</FormLabel>
                  <Input
                    value={adsUserId}
                    onChange={(e) => setAdsUserId(e.target.value)}
                    placeholder="输入用户ID"
                  />
                </FormControl>
              )}
              
              <Button
                leftIcon={<FiPlay />}
                colorScheme="blue"
                onClick={handleStartCorrection}
                isLoading={isRunning}
                loadingText="执行中..."
                isDisabled={!scriptContent || !isBrowserConnected || (useAds && !adsUserId)}
              >
                开始错误纠正
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex>
                <Heading size="md">错误记录</Heading>
                <Spacer />
                <Button
                  leftIcon={<FiRefreshCw />}
                  size="sm"
                  onClick={fetchErrors}
                  isLoading={loading}
                >
                  刷新
                </Button>
              </Flex>
              
              {errors.length === 0 ? (
                <Text color="gray.500">暂无错误记录</Text>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>时间</Th>
                      <Th>选择器</Th>
                      <Th>操作</Th>
                      <Th>错误</Th>
                      <Th>状态</Th>
                      <Th>操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {errors.map((error) => (
                      <React.Fragment key={error.id}>
                        <Tr 
                          cursor="pointer" 
                          onClick={() => toggleRow(error.id)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Td>{new Date(error.timestamp).toLocaleString()}</Td>
                          <Td>
                            <Code>{error.selector}</Code>
                          </Td>
                          <Td>{error.action}</Td>
                          <Td>
                            <Text noOfLines={1} maxW="200px">
                              {error.error}
                            </Text>
                          </Td>
                          <Td>{getStatusBadge(error.status)}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="重试"
                                icon={<FiRefreshCw />}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetry(error);
                                }}
                                isDisabled={error.status === 'fixed'}
                              />
                              <IconButton
                                aria-label="修复"
                                icon={<FiEdit2 />}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedError(error);
                                  setModalVisible(true);
                                }}
                                isDisabled={error.status === 'fixed'}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td colSpan={6} p={0}>
                            <Collapse in={expandedRows.has(error.id)}>
                              <Box p={4} bg="gray.50">
                                <VStack align="stretch" spacing={2}>
                                  <Text fontWeight="bold">错误详情</Text>
                                  <Text>{error.error}</Text>
                                  <Divider />
                                  <Text fontWeight="bold">尝试记录</Text>
                                  {error.attempts.map((attempt, index) => (
                                    <HStack key={index}>
                                      <Badge colorScheme={attempt.success ? 'green' : 'red'}>
                                        {attempt.success ? '成功' : '失败'}
                                      </Badge>
                                      <Text fontSize="sm">
                                        {new Date(attempt.timestamp).toLocaleString()}
                                      </Text>
                                      {!attempt.success && (
                                        <Code>{attempt.selector}</Code>
                                      )}
                                    </HStack>
                                  ))}
                                </VStack>
                              </Box>
                            </Collapse>
                          </Td>
                        </Tr>
                      </React.Fragment>
                    ))}
                  </Tbody>
                </Table>
              )}
            </VStack>
          </CardBody>
        </Card>
        
        {correctionId && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">AI 助手对话</Heading>
                <Box
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={4}
                  maxH="300px"
                  overflowY="auto"
                  bg="gray.50"
                  ref={messageListRef}
                >
                  {aiMessages.length === 0 ? (
                    <Text color="gray.500">暂无对话</Text>
                  ) : (
                    <List spacing={2}>
                      {aiMessages.map((msg, index) => (
                        <ListItem key={index}>
                          <HStack align="start">
                            <Badge
                              colorScheme={msg.type === 'system' ? 'blue' : 'purple'}
                            >
                              {msg.type === 'system' ? '系统' : 'AI'}
                            </Badge>
                            <Text whiteSpace="pre-wrap">{msg.content}</Text>
                            <Spacer />
                            <Text fontSize="xs" color="gray.500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
      
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>修复错误</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                <strong>选择器:</strong> {selectedError?.selector}
              </Text>
              <Text>
                <strong>操作:</strong> {selectedError?.action}
              </Text>
              <Text>
                <strong>错误:</strong> {selectedError?.error}
              </Text>
              <Divider />
              <FormControl>
                <FormLabel>自定义选择器</FormLabel>
                <Input
                  value={customSelector}
                  onChange={(e) => setCustomSelector(e.target.value)}
                  placeholder="输入新的选择器"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleCustomFix}>
              应用修复
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ErrorCorrector; 