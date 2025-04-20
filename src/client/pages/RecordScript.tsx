import React, { useState, useRef } from 'react';
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
import { FiRefreshCw, FiEdit2, FiMessageSquare, FiUpload, FiPlay, FiStop } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { API_PATHS, RecordSession } from '../../types/api';

// 构建WebSocket URL
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

interface AIMessage {
  type: 'system' | 'ai';
  content: string;
  timestamp: string;
}

const RecordScript: React.FC = () => {
  const [sessions, setSessions] = useState<RecordSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RecordSession | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customScript, setCustomScript] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

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
        
        // 只处理与当前录制会话相关的消息
        if (recordingId && data.data.recordingId !== recordingId) return;
        
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
          
          case 'recording-start':
            setError(null);
            toast({
              title: "录制开始",
              description: "开始录制脚本",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'recording-complete':
            setIsRecording(false);
            setError(null);
            fetchSessions();
            toast({
              title: "录制完成",
              description: "脚本录制已完成",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            break;
          
          case 'recording-error':
            setIsRecording(false);
            setError(data.data.error);
            toast({
              title: "录制失败",
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
  }, [recordingId]);

  // 自动滚动消息列表
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [aiMessages]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.GET_RECORD_SESSIONS}`);
      if (!response.ok) {
        throw new Error('获取录制会话失败');
      }
      const data = await response.json() as RecordSession[];
      setSessions(data);
    } catch (error) {
      console.error('获取录制会话失败:', error);
      toast({
        title: "错误",
        description: "获取录制会话失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
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

    setIsRecording(true);
    setError(null);
    setAiMessages([{
      type: 'system',
      content: '开始录制脚本...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.START_RECORDING}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          useAds,
          adsUserId
        })
      });

      if (!response.ok) {
        throw new Error('启动录制失败');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '启动录制失败');
      }
      
      setRecordingId(result.recordingId);
      
      toast({
        title: "成功",
        description: "录制已启动",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('启动录制失败:', error);
      setError(error instanceof Error ? error.message : '启动录制失败');
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '启动录制失败',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recordingId) return;

    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.STOP_RECORDING(recordingId)}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('停止录制失败');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '停止录制失败');
      }

      setIsRecording(false);
      setRecordingId(null);
      fetchSessions();
      
      toast({
        title: "成功",
        description: "录制已停止",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('停止录制失败:', error);
      setError(error instanceof Error ? error.message : '停止录制失败');
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '停止录制失败',
        status: "error",
        duration: 5000,
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
    const colorScheme = status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'blue';
    return (
      <Badge colorScheme={colorScheme}>
        {status === 'completed' ? '已完成' : status === 'failed' ? '失败' : '录制中'}
      </Badge>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>脚本录制</Heading>
        
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
                leftIcon={isRecording ? <FiStop /> : <FiPlay />}
                colorScheme={isRecording ? "red" : "blue"}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                isLoading={isRecording}
                loadingText="录制中..."
                isDisabled={!isBrowserConnected || (useAds && !adsUserId)}
              >
                {isRecording ? '停止录制' : '开始录制'}
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex>
                <Heading size="md">录制会话</Heading>
                <Spacer />
                <Button
                  leftIcon={<FiRefreshCw />}
                  size="sm"
                  onClick={fetchSessions}
                  isLoading={loading}
                >
                  刷新
                </Button>
              </Flex>
              
              {sessions.length === 0 ? (
                <Text color="gray.500">暂无录制会话</Text>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>时间</Th>
                      <Th>脚本</Th>
                      <Th>状态</Th>
                      <Th>操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sessions.map((session) => (
                      <React.Fragment key={session.id}>
                        <Tr 
                          cursor="pointer" 
                          onClick={() => toggleRow(session.id)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Td>{new Date(session.timestamp).toLocaleString()}</Td>
                          <Td>
                            <Code>{session.script}</Code>
                          </Td>
                          <Td>{getStatusBadge(session.status)}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="编辑"
                                icon={<FiEdit2 />}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                  setModalVisible(true);
                                }}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td colSpan={4} p={0}>
                            <Collapse in={expandedRows.has(session.id)}>
                              <Box p={4} bg="gray.50">
                                <VStack align="stretch" spacing={2}>
                                  <Text fontWeight="bold">脚本内容</Text>
                                  <Code whiteSpace="pre-wrap">{session.script}</Code>
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
        
        {recordingId && (
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
            <Button colorScheme="blue" onClick={handleCustomFix}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RecordScript; 