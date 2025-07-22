import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  useToast,
  Badge,
  Divider,
  Select,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Icon,
  Tooltip,
  Progress,
  List,
  ListItem,
  ListIcon,
  Container,
  Spacer,
  Flex,
} from '@chakra-ui/react';
import { FiPlay, FiSquare, FiSettings, FiZap, FiCheckCircle, FiAlertCircle, FiInfo, FiCpu, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../../types/api';
import PageHeader from '../components/PageHeader';

interface AIMessage {
  type: 'system' | 'ai' | 'error';
  content: string;
  timestamp: string;
}

interface AITask {
  id: string;
  instruction: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  timestamp: string;
}

interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  enableScreenshots: boolean;
  enableStepByStep: boolean;
  retryAttempts: number;
}

const AIPilot: React.FC = () => {
  const [url, setUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [taskHistory, setTaskHistory] = useState<AITask[]>([
    {
      id: '1',
      instruction: '登录 PancakeSwap 并连接钱包',
      status: 'completed',
      result: '成功连接 MetaMask 钱包并登录 PancakeSwap',
      timestamp: '2024-01-20 14:30:25',
    },
    {
      id: '2',
      instruction: '在 Uniswap 上交换 ETH 到 USDC',
      status: 'failed',
      result: '交易失败：滑点过高',
      timestamp: '2024-01-20 13:15:10',
    },
    {
      id: '3',
      instruction: '查看 OpenSea 上的 NFT 收藏',
      status: 'completed',
      result: '成功浏览并收藏了 5 个 NFT',
      timestamp: '2024-01-20 11:45:30',
    },
  ]);
  
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    enableScreenshots: true,
    enableStepByStep: true,
    retryAttempts: 3,
  });
  
  const toast = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'running': return '运行中';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  const handleExecute = async () => {
    if (!url || !instruction || !apiKey) {
      toast({
        title: '错误',
        description: '请填写所有必填字段',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setProgress(0);
    setCurrentStep('初始化 AI 助手...');

    // 添加新任务到历史记录
    const newTask: AITask = {
      id: Date.now().toString(),
      instruction,
      status: 'running',
      timestamp: new Date().toLocaleString('zh-CN'),
    };
    setTaskHistory(prev => [newTask, ...prev]);

    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.EXECUTE_AI_PILOT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          instruction,
          apiKey,
          settings: aiSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('执行失败');
      }

      // 模拟 AI 执行过程
      const steps = [
        '分析目标网站结构...',
        '生成执行计划...',
        '启动浏览器实例...',
        '导航到目标页面...',
        '执行 AI 指令...',
        '验证执行结果...',
        '生成执行报告...',
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress((i + 1) / steps.length * 100);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const result = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'system',
        content: '执行成功',
        timestamp: new Date().toISOString(),
      }]);

      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ AI 任务执行成功`]);
      setCurrentStep('任务完成');
      
      // 更新任务状态
      setTaskHistory(prev => prev.map(task => 
        task.id === newTask.id 
          ? { ...task, status: 'completed', result: '任务执行成功' }
          : task
      ));

      toast({
        title: '成功',
        description: '指令执行成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('执行失败:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: error instanceof Error ? error.message : '执行失败',
        timestamp: new Date().toISOString(),
      }]);

      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ 执行失败: ${error}`]);
      setCurrentStep('执行失败');
      
      // 更新任务状态
      setTaskHistory(prev => prev.map(task => 
        task.id === newTask.id 
          ? { ...task, status: 'failed', result: error instanceof Error ? error.message : '未知错误' }
          : task
      ));

      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '执行失败',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleStop = () => {
    setIsProcessing(false);
    setCurrentStep('任务已停止');
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏹️ 任务已被用户停止`]);
    
    toast({
      title: '任务已停止',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
  };

  const predefinedInstructions = [
    '连接 MetaMask 钱包',
    '在 PancakeSwap 上交换代币',
    '在 Uniswap 上添加流动性',
    '在 OpenSea 上浏览 NFT',
    '检查钱包余额',
    '授权代币合约',
  ];

  return (
    <Container maxW="7xl" py={8}>
      <PageHeader
         title="AI 智能助手"
         subtitle="使用 AI 技术自动化执行复杂的网页操作任务"
       >
         <Badge colorScheme="blue" fontSize="sm">
           GPT-4 驱动
         </Badge>
       </PageHeader>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>任务执行</Tab>
          <Tab>执行历史</Tab>
          <Tab>AI 设置</Tab>
        </TabList>
        
        <TabPanels>
          {/* 任务执行面板 */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <HStack>
                    <Icon as={FiZap} color="blue.500" />
                    <Heading size="md">AI 任务配置</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>目标网址</FormLabel>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://pancakeswap.finance"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>AI 指令</FormLabel>
                      <VStack align="stretch" spacing={2}>
                        <Textarea
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          placeholder="详细描述您希望 AI 执行的操作..."
                          rows={4}
                        />
                        <Text fontSize="sm" color="gray.500">快速选择：</Text>
                        <HStack wrap="wrap" spacing={2}>
                          {predefinedInstructions.map((instr, index) => (
                            <Button
                              key={index}
                              size="xs"
                              variant="outline"
                              onClick={() => setInstruction(instr)}
                            >
                              {instr}
                            </Button>
                          ))}
                        </HStack>
                      </VStack>
                    </FormControl>
                    
                    <HStack width="full" spacing={4}>
                      <Button
                        leftIcon={<FiPlay />}
                        colorScheme="blue"
                        onClick={handleExecute}
                        isLoading={isProcessing}
                        loadingText="执行中..."
                        flex={1}
                        isDisabled={!apiKey || !url || !instruction}
                      >
                        开始执行
                      </Button>
                      {isProcessing && (
                        <Button
                          leftIcon={<FiSquare />}
                          colorScheme="red"
                          variant="outline"
                          onClick={handleStop}
                        >
                          停止
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* 执行状态 */}
              {(isProcessing || logs.length > 0) && (
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">执行状态</Heading>
                      {isProcessing && (
                        <Badge colorScheme="blue" variant="subtle">
                          运行中
                        </Badge>
                      )}
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {isProcessing && (
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" fontWeight="medium">
                              {currentStep}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {Math.round(progress)}%
                            </Text>
                          </HStack>
                          <Progress value={progress} colorScheme="blue" size="sm" />
                        </Box>
                      )}
                      
                      <Divider />
                      
                      <Box>
                        <Text fontWeight="medium" mb={2}>执行日志</Text>
                        <Box
                          bg={useColorModeValue('gray.50', 'gray.900')}
                          p={4}
                          borderRadius="md"
                          maxHeight="300px"
                          overflowY="auto"
                          fontFamily="mono"
                          fontSize="sm"
                          border="1px"
                          borderColor={borderColor}
                        >
                          {logs.map((log, index) => (
                            <Text key={index} mb={1} color={useColorModeValue('gray.700', 'gray.300')}>
                              {log}
                            </Text>
                          ))}
                          <div ref={logsEndRef} />
                        </Box>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {/* 原有的消息日志 */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">执行日志</Heading>
                    <Box
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      p={4}
                      maxH="300px"
                      overflowY="auto"
                      bg="gray.50"
                    >
                      {messages.length === 0 ? (
                        <Text color="gray.500">暂无日志</Text>
                      ) : (
                        <List spacing={2}>
                          {messages.map((msg, index) => (
                            <ListItem key={index}>
                              <HStack align="start">
                                <Badge
                                  colorScheme={
                                    msg.type === 'system' ? 'blue' :
                                    msg.type === 'error' ? 'red' : 'purple'
                                  }
                                >
                                  {msg.type === 'system' ? '系统' :
                                   msg.type === 'error' ? '错误' : 'AI'}
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
            </VStack>
          </TabPanel>
          
          {/* 执行历史面板 */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">任务执行历史</Heading>
              </CardHeader>
              <CardBody>
                <List spacing={4}>
                  {taskHistory.map((task) => (
                    <ListItem key={task.id}>
                      <HStack align="start" spacing={4}>
                        <ListIcon
                          as={task.status === 'completed' ? FiCheckCircle : task.status === 'failed' ? FiAlertCircle : FiInfo}
                          color={`${getStatusColor(task.status)}.500`}
                          mt={1}
                        />
                        <Box flex={1}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="medium" fontSize="sm">
                              {task.instruction}
                            </Text>
                            <Badge colorScheme={getStatusColor(task.status)} size="sm">
                              {getStatusText(task.status)}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            {task.timestamp}
                          </Text>
                          {task.result && (
                            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                              {task.result}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                      <Divider mt={4} />
                    </ListItem>
                  ))}
                </List>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* AI 设置面板 */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack>
                  <Icon as={FiSettings} color="blue.500" />
                  <Heading size="md">AI 配置</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>AI 模型</FormLabel>
                    <Select
                      value={aiSettings.model}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                    >
                      <option value="gpt-4">GPT-4 (推荐)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>创造性 (Temperature)</FormLabel>
                    <NumberInput
                      value={aiSettings.temperature}
                      onChange={(_, value) => setAiSettings(prev => ({ ...prev, temperature: value }))}
                      min={0}
                      max={2}
                      step={0.1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>最大令牌数</FormLabel>
                    <NumberInput
                      value={aiSettings.maxTokens}
                      onChange={(_, value) => setAiSettings(prev => ({ ...prev, maxTokens: value }))}
                      min={100}
                      max={4000}
                      step={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>重试次数</FormLabel>
                    <NumberInput
                      value={aiSettings.retryAttempts}
                      onChange={(_, value) => setAiSettings(prev => ({ ...prev, retryAttempts: value }))}
                      min={1}
                      max={5}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text>启用屏幕截图</Text>
                      <Switch
                        isChecked={aiSettings.enableScreenshots}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, enableScreenshots: e.target.checked }))}
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text>分步执行模式</Text>
                      <Switch
                        isChecked={aiSettings.enableStepByStep}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, enableStepByStep: e.target.checked }))}
                      />
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default AIPilot;