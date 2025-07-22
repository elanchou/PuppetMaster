import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Text,
  Progress,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  useToast,
  Divider,
  Select,
  Textarea,
  useColorModeValue,
  Icon,
  Tooltip,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiPlay, FiPause, FiSquare, FiRefreshCw, FiUpload, FiMonitor, FiClock, FiCheckCircle, FiAlertCircle, FiActivity, FiSettings } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import PageHeader from '../components/PageHeader';

interface ExecutionStatus {
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  completedInstances: number;
  totalInstances: number;
  failedInstances: number;
  currentStep: string;
  logs: string[];
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

interface BrowserInstance {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  currentAction: string;
  adsPowerId?: string;
  errors: string[];
}

interface ExecutionConfig {
  retryAttempts: number;
  timeout: number;
  headless: boolean;
  enableScreenshots: boolean;
  enableVideoRecording: boolean;
  proxy?: string;
}

const Execution: React.FC = () => {
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [instanceCount, setInstanceCount] = useState(1);
  const [useAdsPower, setUseAdsPower] = useState(false);
  const [adsPowerUserId, setAdsPowerUserId] = useState('');
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    retryAttempts: 3,
    timeout: 30000,
    headless: false,
    enableScreenshots: true,
    enableVideoRecording: false,
  });
  
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>({
    isRunning: false,
    isPaused: false,
    progress: 0,
    completedInstances: 0,
    totalInstances: 0,
    failedInstances: 0,
    currentStep: '等待开始',
    logs: [],
  });
  
  const [browserInstances, setBrowserInstances] = useState<BrowserInstance[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  
  const toast = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [executionStatus.logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'idle': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'idle': return '空闲';
      default: return '未知';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        setScriptFile(file);
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setScriptContent(content);
        };
        reader.readAsText(file);
        
        toast({
          title: '文件上传成功',
          description: `已选择文件: ${file.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '文件格式错误',
          description: '请选择 .js 或 .ts 文件',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const initializeBrowserInstances = () => {
    const instances: BrowserInstance[] = [];
    for (let i = 0; i < instanceCount; i++) {
      instances.push({
        id: `instance-${i + 1}`,
        status: 'idle',
        progress: 0,
        currentAction: '等待启动',
        adsPowerId: useAdsPower ? `${adsPowerUserId}-${i + 1}` : undefined,
        errors: [],
      });
    }
    setBrowserInstances(instances);
  };

  const handleStart = async () => {
    if (!scriptFile && !scriptContent) {
      toast({
        title: '错误',
        description: '请先上传脚本文件或输入脚本内容',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (useAdsPower && !adsPowerUserId) {
      toast({
        title: '错误',
        description: '使用 AdsPower 时请输入用户 ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      initializeBrowserInstances();
      
      setExecutionStatus({
        isRunning: true,
        isPaused: false,
        progress: 0,
        completedInstances: 0,
        totalInstances: instanceCount,
        failedInstances: 0,
        currentStep: '启动浏览器实例...',
        logs: [`[${new Date().toLocaleTimeString()}] 开始执行脚本`],
        startTime: new Date(),
      });

      // 模拟执行过程
      simulateExecution();

      toast({
        title: '执行开始',
        description: '脚本执行已开始',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '执行失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const simulateExecution = () => {
    let progress = 0;
    let instanceIndex = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      
      // 更新浏览器实例状态
      setBrowserInstances(prev => prev.map((instance, index) => {
        if (index <= instanceIndex) {
          const instanceProgress = Math.min(100, progress + (Math.random() - 0.5) * 20);
          return {
            ...instance,
            status: instanceProgress >= 100 ? 'completed' : 'running',
            progress: instanceProgress,
            currentAction: instanceProgress >= 100 ? '执行完成' : `执行步骤 ${Math.floor(instanceProgress / 10) + 1}`,
          };
        }
        return instance;
      }));
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExecutionStatus(prev => ({
          ...prev,
          isRunning: false,
          progress: 100,
          completedInstances: prev.totalInstances,
          currentStep: '执行完成',
          logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] 所有实例执行完成`],
        }));
        
        setBrowserInstances(prev => prev.map(instance => ({
          ...instance,
          status: 'completed',
          progress: 100,
          currentAction: '执行完成',
        })));
      } else {
        if (progress > (instanceIndex + 1) * (100 / instanceCount)) {
          instanceIndex++;
        }
        
        setExecutionStatus(prev => ({
          ...prev,
          progress,
          completedInstances: Math.floor(progress / (100 / instanceCount)),
          currentStep: `执行中... (${Math.floor(progress)}%)`,
          logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] 执行进度: ${Math.floor(progress)}%`],
          estimatedTimeRemaining: prev.startTime ? Math.floor((100 - progress) * (Date.now() - prev.startTime.getTime()) / progress / 1000) : undefined,
        }));
      }
    }, 1000);
  };

  const handlePause = () => {
    setExecutionStatus(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
      currentStep: '已暂停',
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] 执行已暂停`],
    }));
  };

  const handleResume = () => {
    setExecutionStatus(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStep: '继续执行',
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] 继续执行`],
    }));
    simulateExecution();
  };

  const handleStop = () => {
    setExecutionStatus({
      isRunning: false,
      isPaused: false,
      progress: 0,
      completedInstances: 0,
      totalInstances: 0,
      failedInstances: 0,
      currentStep: '已停止',
      logs: [`[${new Date().toLocaleTimeString()}] 执行已停止`],
    });
    setBrowserInstances([]);
  };

  const handleRefresh = () => {
    setExecutionStatus({
      isRunning: false,
      isPaused: false,
      progress: 0,
      completedInstances: 0,
      totalInstances: 0,
      failedInstances: 0,
      currentStep: '等待开始',
      logs: [],
    });
    setBrowserInstances([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <PageHeader
        title="脚本执行"
        subtitle="批量执行自动化脚本，支持多实例并行处理"
      >
        {executionStatus.isRunning && (
          <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
            运行中
          </Badge>
        )}
      </PageHeader>
      
      <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>执行配置</Tab>
          <Tab>实例监控</Tab>
          <Tab>执行日志</Tab>
          <Tab>高级设置</Tab>
        </TabList>
        
        <TabPanels>
          {/* 执行配置面板 */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* 脚本配置 */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <HStack>
                    <Icon as={FiUpload} color="blue.500" />
                    <Heading size="md">脚本配置</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>脚本文件</FormLabel>
                      <Input
                        type="file"
                        accept=".js,.ts"
                        onChange={handleFileUpload}
                        placeholder="选择脚本文件"
                      />
                      {scriptFile && (
                        <Text fontSize="sm" color="green.500" mt={2}>
                          已选择: {scriptFile.name}
                        </Text>
                      )}
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>或直接输入脚本内容</FormLabel>
                      <Textarea
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        placeholder="在此输入 JavaScript/TypeScript 代码..."
                        rows={8}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                    </FormControl>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                      <GridItem>
                        <FormControl>
                          <FormLabel>实例数量</FormLabel>
                          <NumberInput
                            value={instanceCount}
                            onChange={(_, value) => setInstanceCount(value)}
                            min={1}
                            max={10}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <HStack justify="space-between">
                            <FormLabel mb={0}>使用 AdsPower 浏览器</FormLabel>
                            <Switch
                              isChecked={useAdsPower}
                              onChange={(e) => setUseAdsPower(e.target.checked)}
                            />
                          </HStack>
                          {useAdsPower && (
                            <Input
                              mt={2}
                              value={adsPowerUserId}
                              onChange={(e) => setAdsPowerUserId(e.target.value)}
                              placeholder="输入 AdsPower 用户 ID"
                            />
                          )}
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* 执行控制 */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <HStack>
                    <Icon as={FiActivity} color="green.500" />
                    <Heading size="md">执行控制</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <HStack spacing={4} width="full">
                      {!executionStatus.isRunning && !executionStatus.isPaused ? (
                        <Button
                          leftIcon={<FiPlay />}
                          colorScheme="green"
                          onClick={handleStart}
                          flex={1}
                          size="lg"
                        >
                          开始执行
                        </Button>
                      ) : executionStatus.isPaused ? (
                        <Button
                          leftIcon={<FiPlay />}
                          colorScheme="blue"
                          onClick={handleResume}
                          flex={1}
                          size="lg"
                        >
                          继续执行
                        </Button>
                      ) : (
                        <Button
                          leftIcon={<FiPause />}
                          colorScheme="yellow"
                          onClick={handlePause}
                          flex={1}
                          size="lg"
                        >
                          暂停执行
                        </Button>
                      )}
                      
                      <Tooltip label="停止所有实例">
                        <Button
                          leftIcon={<FiSquare />}
                          colorScheme="red"
                          onClick={handleStop}
                          isDisabled={!executionStatus.isRunning && !executionStatus.isPaused}
                        >
                          停止
                        </Button>
                      </Tooltip>
                      
                      <Tooltip label="重置状态">
                        <Button
                          leftIcon={<FiRefreshCw />}
                          onClick={handleRefresh}
                          isDisabled={executionStatus.isRunning}
                        >
                          重置
                        </Button>
                      </Tooltip>
                    </HStack>
                    
                    {/* 执行状态统计 */}
                    {(executionStatus.isRunning || executionStatus.isPaused || executionStatus.progress > 0) && (
                      <>
                        <Divider />
                        
                        <Grid templateColumns="repeat(4, 1fr)" gap={4} width="full">
                          <GridItem>
                            <Stat>
                              <StatLabel>总进度</StatLabel>
                              <StatNumber>{Math.floor(executionStatus.progress)}%</StatNumber>
                              <StatHelpText>
                                <Progress value={executionStatus.progress} colorScheme="blue" size="sm" />
                              </StatHelpText>
                            </Stat>
                          </GridItem>
                          
                          <GridItem>
                            <Stat>
                              <StatLabel>完成实例</StatLabel>
                              <StatNumber color="green.500">
                                {executionStatus.completedInstances}/{executionStatus.totalInstances}
                              </StatNumber>
                              <StatHelpText>成功完成</StatHelpText>
                            </Stat>
                          </GridItem>
                          
                          <GridItem>
                            <Stat>
                              <StatLabel>失败实例</StatLabel>
                              <StatNumber color="red.500">{executionStatus.failedInstances}</StatNumber>
                              <StatHelpText>执行失败</StatHelpText>
                            </Stat>
                          </GridItem>
                          
                          <GridItem>
                            <Stat>
                              <StatLabel>预计剩余</StatLabel>
                              <StatNumber>
                                {executionStatus.estimatedTimeRemaining ? formatTime(executionStatus.estimatedTimeRemaining) : '--'}
                              </StatNumber>
                              <StatHelpText>时间估算</StatHelpText>
                            </Stat>
                          </GridItem>
                        </Grid>
                        
                        <Alert status={executionStatus.isRunning ? 'info' : executionStatus.isPaused ? 'warning' : 'success'}>
                          <AlertIcon />
                          <AlertTitle>当前状态:</AlertTitle>
                          <AlertDescription>{executionStatus.currentStep}</AlertDescription>
                        </Alert>
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* 实例监控面板 */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">浏览器实例监控</Heading>
              </CardHeader>
              <CardBody>
                {browserInstances.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={8}>
                    暂无运行中的实例
                  </Text>
                ) : (
                  <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                    {browserInstances.map((instance) => (
                      <Card key={instance.id} variant="outline" size="sm">
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="medium">{instance.id}</Text>
                              <Badge colorScheme={getStatusColor(instance.status)} size="sm">
                                {getStatusText(instance.status)}
                              </Badge>
                            </HStack>
                            
                            <Progress value={instance.progress} colorScheme={getStatusColor(instance.status)} size="sm" />
                            
                            <Text fontSize="sm" color="gray.600">
                              {instance.currentAction}
                            </Text>
                            
                            {instance.adsPowerId && (
                              <Text fontSize="xs" color="blue.500">
                                AdsPower ID: {instance.adsPowerId}
                              </Text>
                            )}
                            
                            {instance.errors.length > 0 && (
                              <List spacing={1}>
                                {instance.errors.map((error, index) => (
                                  <ListItem key={index}>
                                    <ListIcon as={FiAlertCircle} color="red.500" />
                                    <Text fontSize="xs" color="red.500">{error}</Text>
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Grid>
                )}
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* 执行日志面板 */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">执行日志</Heading>
              </CardHeader>
              <CardBody>
                <Box
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  p={4}
                  borderRadius="md"
                  maxHeight="500px"
                  overflowY="auto"
                  fontFamily="mono"
                  fontSize="sm"
                  border="1px"
                  borderColor={borderColor}
                >
                  {executionStatus.logs.length === 0 ? (
                    <Text color="gray.500">暂无日志</Text>
                  ) : (
                    executionStatus.logs.map((log, index) => (
                      <Text key={index} mb={1} color={useColorModeValue('gray.700', 'gray.300')}>
                        {log}
                      </Text>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
          
          {/* 高级设置面板 */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack>
                  <Icon as={FiSettings} color="blue.500" />
                  <Heading size="md">高级设置</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <GridItem>
                      <FormControl>
                        <FormLabel>重试次数</FormLabel>
                        <NumberInput
                          value={executionConfig.retryAttempts}
                          onChange={(_, value) => setExecutionConfig(prev => ({ ...prev, retryAttempts: value }))}
                          min={0}
                          max={10}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    
                    <GridItem>
                      <FormControl>
                        <FormLabel>超时时间 (毫秒)</FormLabel>
                        <NumberInput
                          value={executionConfig.timeout}
                          onChange={(_, value) => setExecutionConfig(prev => ({ ...prev, timeout: value }))}
                          min={5000}
                          max={300000}
                          step={5000}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                  </Grid>
                  
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text>无头模式</Text>
                      <Switch
                        isChecked={executionConfig.headless}
                        onChange={(e) => setExecutionConfig(prev => ({ ...prev, headless: e.target.checked }))}
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text>启用屏幕截图</Text>
                      <Switch
                        isChecked={executionConfig.enableScreenshots}
                        onChange={(e) => setExecutionConfig(prev => ({ ...prev, enableScreenshots: e.target.checked }))}
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text>启用视频录制</Text>
                      <Switch
                        isChecked={executionConfig.enableVideoRecording}
                        onChange={(e) => setExecutionConfig(prev => ({ ...prev, enableVideoRecording: e.target.checked }))}
                      />
                    </HStack>
                  </VStack>
                  
                  <FormControl>
                    <FormLabel>代理设置 (可选)</FormLabel>
                    <Input
                      value={executionConfig.proxy || ''}
                      onChange={(e) => setExecutionConfig(prev => ({ ...prev, proxy: e.target.value }))}
                      placeholder="http://proxy.example.com:8080"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Execution;