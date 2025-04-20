import React, { useState, useRef, useEffect } from 'react';
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
  TableContainer,
  CardHeader,
} from '@chakra-ui/react';
import { FiRefreshCw, FiEdit2, FiMessageSquare, FiUpload, FiPlay } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../../types/api';

interface ScriptStatus {
  id: string;
  startTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  error?: string;
}

interface AIMessage {
  type: 'system' | 'ai';
  content: string;
  timestamp: string;
}

const ExecuteScript: React.FC = () => {
  const [scriptStatuses, setScriptStatuses] = useState<ScriptStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ScriptStatus | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customScript, setCustomScript] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 初始化WebSocket连接
  useEffect(() => {
    const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      setIsBrowserConnected(true);
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 只处理与当前执行会话相关的消息
        if (executionId && data.data.executionId !== executionId) return;
        
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
          
          case 'execution-start':
            setError(null);
            toast({
              title: "执行开始",
              description: "开始执行脚本",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'execution-complete':
            setIsExecuting(false);
            setError(null);
            fetchStatuses();
            toast({
              title: "执行完成",
              description: "脚本执行已完成",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'execution-error':
            setIsExecuting(false);
            setError(data.data.error);
            toast({
              title: "执行失败",
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

          case 'script_status':
            setScriptStatuses(prev => {
              const newStatus = data.status as ScriptStatus;
              const index = prev.findIndex(s => s.id === newStatus.id);
              if (index === -1) {
                return [...prev, newStatus];
              }
              const updated = [...prev];
              updated[index] = newStatus;
              return updated;
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
  }, [executionId]);

  // 自动滚动消息列表
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [aiMessages]);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.GET_SCRIPT_STATUSES}`);
      if (!response.ok) {
        throw new Error('获取脚本状态失败');
      }
      const data = await response.json() as ScriptStatus[];
      setScriptStatuses(data);
    } catch (error) {
      console.error('获取脚本状态失败:', error);
      toast({
        title: "错误",
        description: "获取脚本状态失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteScript = async () => {
    if (!customScript) {
      toast({
        title: "错误",
        description: "请先输入脚本内容",
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

    setIsExecuting(true);
    setError(null);
    setAiMessages([{
      type: 'system',
      content: '开始执行脚本...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.EXECUTE_SCRIPT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: customScript,
          useAds,
          adsUserId
        })
      });

      if (!response.ok) {
        throw new Error('执行脚本失败');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '执行脚本失败');
      }
      
      setExecutionId(result.executionId);
      
      toast({
        title: "成功",
        description: "脚本执行已启动",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('执行脚本失败:', error);
      setError(error instanceof Error ? error.message : '执行脚本失败');
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '执行脚本失败',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsExecuting(false);
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
    const colorScheme = status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'blue';
    return (
      <Badge colorScheme={colorScheme}>
        {status === 'completed' ? '已完成' : status === 'failed' ? '失败' : '执行中'}
      </Badge>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>脚本执行</Heading>
        
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
                <FormLabel>脚本内容</FormLabel>
                <Input
                  as="textarea"
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  placeholder="输入脚本内容"
                  rows={10}
                />
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
                onClick={handleExecuteScript}
                isLoading={isExecuting}
                loadingText="执行中..."
                isDisabled={!customScript || !isBrowserConnected || (useAds && !adsUserId)}
              >
                执行脚本
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex>
                <Heading size="md">执行记录</Heading>
                <Spacer />
                <Button
                  leftIcon={<FiRefreshCw />}
                  size="sm"
                  onClick={fetchStatuses}
                  isLoading={loading}
                >
                  刷新
                </Button>
              </Flex>
              
              {scriptStatuses.length === 0 ? (
                <Text color="gray.500">暂无执行记录</Text>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>开始时间</Th>
                        <Th>状态</Th>
                        <Th>进度</Th>
                        <Th>当前步骤</Th>
                        <Th>总步骤</Th>
                        <Th>操作</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {scriptStatuses.map((status) => (
                        <Tr 
                          key={status.id}
                          cursor="pointer"
                          onClick={() => setSelectedStatus(status)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Td>{new Date(status.startTime).toLocaleString()}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                status.status === 'completed' ? 'green' :
                                status.status === 'failed' ? 'red' :
                                status.status === 'running' ? 'blue' : 'gray'
                              }
                            >
                              {status.status}
                            </Badge>
                          </Td>
                          <Td>{status.progress}%</Td>
                          <Td>{status.currentStep || '-'}</Td>
                          <Td>{status.totalSteps || '-'}</Td>
                          <Td>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStatus(status);
                              }}
                            >
                              查看详情
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </VStack>
          </CardBody>
        </Card>
        
        {executionId && (
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
          <ModalHeader>编辑脚本</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>脚本内容</FormLabel>
                <Input
                  as="textarea"
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  placeholder="输入脚本内容"
                  rows={10}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleExecuteScript}>
              执行
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Card>
        <CardHeader>
          <Heading size="md">执行详情</Heading>
        </CardHeader>
        <CardBody>
          {selectedStatus ? (
            <VStack align="stretch" spacing={4}>
              <Text>开始时间：{new Date(selectedStatus.startTime).toLocaleString()}</Text>
              <Text>状态：{selectedStatus.status}</Text>
              <Text>进度：{selectedStatus.progress}%</Text>
              {selectedStatus.currentStep && (
                <Text>当前步骤：{selectedStatus.currentStep}</Text>
              )}
              {selectedStatus.totalSteps && (
                <Text>总步骤：{selectedStatus.totalSteps}</Text>
              )}
              {selectedStatus.error && (
                <Text color="red.500">错误：{selectedStatus.error}</Text>
              )}
            </VStack>
          ) : (
            <Text>请选择一个执行记录查看详情</Text>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default ExecuteScript; 