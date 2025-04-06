import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Select,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Progress,
  Text,
  Card,
  CardBody,
  Badge,
  Divider,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Input,
  useToast,
  Switch,
  Flex,
  Spacer,
  Container
} from '@chakra-ui/react';
import { FiUpload, FiPlay, FiRefreshCw } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { 
  API_PATHS, 
  ExecuteScriptRequest, 
  ExecuteScriptResponse,
  ScriptStatus
} from '../../types/api';

// 构建WebSocket URL
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

interface LogMessage {
  type: 'info' | 'error' | 'success' | 'command';
  message: string;
  timestamp: string;
}

const Executer: React.FC = () => {
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [statuses, setStatuses] = useState<ScriptStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 初始化WebSocket连接
  useEffect(() => {
    if (!executionId) return;

    const ws = new WebSocket(`${WS_URL}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      // 建立连接后订阅执行ID的消息
      if (executionId) {
        ws.send(JSON.stringify({ type: 'subscribe', executionId }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'log') {
          const logMessage: LogMessage = {
            type: data.logType || 'info',
            message: data.message,
            timestamp: new Date().toISOString()
          };
          
          setLogs(prevLogs => [...prevLogs, logMessage]);
        } else if (data.type === 'status') {
          if (data.status === 'completed' || data.status === 'failed') {
            setIsRunning(false);
            fetchStatuses();  // 刷新状态列表
          }
        }
      } catch (error) {
        console.error('处理WebSocket消息时出错:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
    };
    
    wsRef.current = ws;
    
    // 组件卸载时关闭WebSocket连接
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [executionId]);

  // 自动滚动到日志底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // 组件加载时获取状态列表
  useEffect(() => {
    fetchStatuses();
  }, []);

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

  const executeScript = async () => {
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
    setLogs([{
      type: 'info',
      message: '开始执行脚本...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const request: ExecuteScriptRequest = {
        script: scriptContent,
        useAds,
        adsUserId
      };

      const response = await fetch(`${API_BASE_URL}${API_PATHS.EXECUTE_SCRIPT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('执行脚本失败');
      }

      const result = await response.json() as ExecuteScriptResponse;
      
      if (!result.success) {
        throw new Error(result.error || '执行脚本失败');
      }
      
      setExecutionId(result.executionId);
      
      toast({
        title: "成功",
        description: "脚本开始执行",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('执行脚本失败:', error);
      toast({
        title: "错误",
        description: "执行脚本失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsRunning(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.GET_SCRIPT_STATUSES}`);
      if (!response.ok) {
        throw new Error('获取状态失败');
      }
      const data = await response.json() as ScriptStatus[];
      setStatuses(data);
    } catch (error) {
      console.error('获取状态失败:', error);
      toast({
        title: "错误",
        description: "获取状态失败",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: ScriptStatus['status']) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getLogColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'error':
        return 'red.500';
      case 'success':
        return 'green.500';
      case 'command':
        return 'blue.500';
      default:
        return 'gray.700';
    }
  };

  return (
    <Container maxW="container.xl" p={5}>
      <Heading as="h1" size="xl" mb={5}>脚本执行器</Heading>
      
      <Flex direction={{ base: 'column', md: 'row' }} gap={5}>
        <Box flex="1" p={5} boxShadow="md" borderRadius="md" bg="white">
          <Heading as="h2" size="md" mb={4}>脚本控制</Heading>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>上传脚本</FormLabel>
              <Flex>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.js,.json"
                  style={{ display: 'none' }}
                />
                <Button 
                  leftIcon={<FiUpload />} 
                  onClick={() => fileInputRef.current?.click()}
                  colorScheme="blue"
                  size="md"
                >
                  选择文件
                </Button>
                <Text ml={2} alignSelf="center">
                  {scriptContent ? '已上传脚本' : '未选择文件'}
                </Text>
              </Flex>
            </FormControl>
            
            <FormControl>
              <FormLabel>使用 AdsPower</FormLabel>
              <HStack>
                <Switch 
                  colorScheme="blue"
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
            
            <Divider />
            
            <HStack spacing={4}>
              <Button
                leftIcon={<FiPlay />}
                colorScheme="green"
                onClick={executeScript}
                isDisabled={isRunning || !scriptContent}
              >
                执行脚本
              </Button>
              
              <IconButton
                aria-label="刷新状态"
                icon={<FiRefreshCw />}
                onClick={fetchStatuses}
                colorScheme="blue"
                variant="outline"
              />
            </HStack>
          </VStack>
        </Box>
        
        <Box flex="2" p={5} boxShadow="md" borderRadius="md" bg="white">
          <Heading as="h2" size="md" mb={4}>执行日志</Heading>
          
          <Box 
            height="400px" 
            overflowY="auto" 
            border="1px" 
            borderColor="gray.200" 
            borderRadius="md" 
            p={3}
          >
            {logs.length === 0 ? (
              <Text color="gray.500" textAlign="center" mt={5}>
                暂无日志信息
              </Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} color={getLogColor(log.type)} mb={1} fontSize="sm">
                  <Text as="span" color="gray.500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </Text>{' '}
                  {log.message}
                </Text>
              ))
            )}
            <div ref={logsEndRef} />
          </Box>
          
          {isRunning && (
            <Box mt={4}>
              <Progress size="xs" isIndeterminate colorScheme="blue" />
              <Text mt={2} textAlign="center" fontSize="sm" color="blue.500">
                脚本正在执行中...
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
      
      <Box mt={8} p={5} boxShadow="md" borderRadius="md" bg="white">
        <Heading as="h2" size="md" mb={4}>执行历史</Heading>
        
        {statuses.length === 0 ? (
          <Text color="gray.500" textAlign="center">
            暂无执行历史
          </Text>
        ) : (
          <List spacing={3}>
            {statuses.map((status) => (
              <ListItem key={status.id}>
                <Card variant="outline">
                  <CardBody>
                    <Flex alignItems="center">
                      <Box>
                        <Badge colorScheme={getStatusColor(status.status)} mb={1}>
                          {status.status === 'running' ? '运行中' : 
                           status.status === 'completed' ? '完成' : 
                           status.status === 'failed' ? '失败' : '等待中'}
                        </Badge>
                        <HStack>
                          <Text fontSize="sm">ID: {status.id}</Text>
                          <Text fontSize="sm">
                            开始时间: {new Date(status.startTime).toLocaleString()}
                          </Text>
                          {status.endTime && (
                            <Text fontSize="sm">
                              结束时间: {new Date(status.endTime).toLocaleString()}
                            </Text>
                          )}
                        </HStack>
                        {status.status === 'running' && (
                          <Progress 
                            size="xs" 
                            value={status.progress} 
                            mt={2}
                            colorScheme={getStatusColor(status.status)}
                          />
                        )}
                      </Box>
                      <Spacer />
                      <Box>
                        {status.status === 'running' && (
                          <Text fontSize="sm">
                            进度: {status.currentStep}/{status.totalSteps} 步骤
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  </CardBody>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default Executer; 