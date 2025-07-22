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
  CardHeader,
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
  useColorModeValue,
  Icon,
  Tooltip,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Textarea,
} from '@chakra-ui/react';
import { 
  FiRefreshCw, 
  FiEdit2, 
  FiMessageSquare, 
  FiUpload, 
  FiPlay, 
  FiSquare,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiCode,
  FiZap,
  FiShield,
  FiCpu,
  FiActivity,
  FiTrendingUp,
  FiDownload,
  FiRotateCcw
} from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import {
  API_PATHS,
  ErrorRecord,
  StartErrorCorrectionRequest,
  StartErrorCorrectionResponse,
  FixErrorRequest
} from '../../types/api';
import PageHeader from '../components/PageHeader';

// 构建WebSocket URL
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

interface ErrorItem {
  id: string;
  type: 'syntax' | 'runtime' | 'logic' | 'performance' | 'security';
  message: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
  fixable: boolean;
  category: string;
  impact: string;
  confidence: number;
}

interface AIMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface FixHistory {
  id: string;
  errorId: string;
  originalCode: string;
  fixedCode: string;
  timestamp: Date;
  success: boolean;
  aiExplanation: string;
  confidence: number;
}

interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  enableContextAnalysis: boolean;
  enableCodeSuggestions: boolean;
  autoFix: boolean;
  batchSize: number;
  retryAttempts: number;
}

interface AnalysisStats {
  totalErrors: number;
  fixedErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  fixableErrors: number;
  averageConfidence: number;
}

const ErrorCorrector: React.FC = () => {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [analysisErrors, setAnalysisErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);
  const [selectedAnalysisError, setSelectedAnalysisError] = useState<ErrorItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customSelector, setCustomSelector] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [fixHistory, setFixHistory] = useState<FixHistory[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 2048,
    enableContextAnalysis: true,
    enableCodeSuggestions: true,
    autoFix: false,
    batchSize: 5,
    retryAttempts: 3,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isBrowserConnected, setIsBrowserConnected] = useState(false);
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 初始化WebSocket连接
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      setIsBrowserConnected(true);
      setError(null);
      addSystemMessage('WebSocket 连接已建立');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('解析WebSocket消息失败', error);
        setError('解析消息失败');
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket错误', error);
      setIsBrowserConnected(false);
      setError('WebSocket连接错误');
    };
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      setIsBrowserConnected(false);
      addSystemMessage('WebSocket 连接已断开，尝试重连...');
      // 尝试重连
      setTimeout(() => {
        if (!isBrowserConnected) {
          window.location.reload();
        }
      }, 5000);
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, []);

  // 自动滚动消息列表
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [aiMessages]);

  useEffect(() => {
    fetchErrors();
  }, []);

  const addSystemMessage = (content: string) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date(),
    };
    setAiMessages(prev => [...prev, newMessage]);
  };

  const addAIMessage = (content: string, metadata?: any) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata,
    };
    setAiMessages(prev => [...prev, newMessage]);
  };

  const addFixToHistory = (errorId: string, originalCode: string, fixedCode: string, success: boolean, explanation: string, confidence: number = 0.8) => {
    const newFix: FixHistory = {
      id: Date.now().toString(),
      errorId,
      originalCode,
      fixedCode,
      timestamp: new Date(),
      success,
      aiExplanation: explanation,
      confidence,
    };
    setFixHistory(prev => [...prev, newFix]);
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'correction_start':
        setIsRunning(true);
        addAIMessage('开始错误纠正过程...');
        break;
      case 'correction_complete':
        setIsRunning(false);
        addAIMessage('错误纠正完成！');
        if (data.correctedScript) {
          setScriptContent(data.correctedScript);
          addFixToHistory(data.errorId, data.originalCode, data.correctedScript, true, data.explanation, data.confidence);
        }
        fetchErrors();
        break;
      case 'correction_error':
        setIsRunning(false);
        addAIMessage(`错误: ${data.error}`);
        break;
      case 'browser_connected':
        setIsBrowserConnected(true);
        addAIMessage('浏览器已连接');
        break;
      case 'browser_disconnected':
        setIsBrowserConnected(false);
        addAIMessage('浏览器已断开连接');
        break;
      case 'log':
        addAIMessage(data.message);
        break;
      case 'ai_message':
        addAIMessage(data.message, data.metadata);
        break;
      case 'analysis_progress':
        setAnalysisProgress(data.progress);
        break;
      case 'analysis_result':
        setAnalysisErrors(data.errors);
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        addAIMessage(`分析完成，发现 ${data.errors.length} 个问题`);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setScriptContent(content);
          setOriginalContent(content);
          analyzeScript(content);
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

  const analyzeScript = (content: string) => {
    setIsAnalyzing(true);
    setAnalysisErrors([]);
    setAnalysisProgress(0);
    addAIMessage('开始深度分析脚本...');
    
    // 模拟分析进度
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    
    // 模拟更详细的错误分析
    setTimeout(() => {
      clearInterval(progressInterval);
      const mockErrors: ErrorItem[] = [
        {
          id: '1',
          type: 'syntax',
          message: '缺少分号',
          line: 15,
          column: 23,
          severity: 'medium',
          suggestion: '在第15行第23列添加分号',
          fixable: true,
          category: '语法错误',
          impact: '代码无法正常执行',
          confidence: 0.95,
        },
        {
          id: '2',
          type: 'runtime',
          message: '未定义的变量 "element"',
          line: 23,
          column: 12,
          severity: 'high',
          suggestion: '确保变量 "element" 在使用前已定义',
          fixable: true,
          category: '运行时错误',
          impact: '可能导致脚本崩溃',
          confidence: 0.88,
        },
        {
          id: '3',
          type: 'logic',
          message: '可能的无限循环',
          line: 45,
          column: 8,
          severity: 'critical',
          suggestion: '检查循环条件，确保有退出条件',
          fixable: true,
          category: '逻辑错误',
          impact: '可能导致浏览器卡死',
          confidence: 0.72,
        },
        {
          id: '4',
          type: 'performance',
          message: '频繁的DOM查询',
          line: 67,
          column: 5,
          severity: 'medium',
          suggestion: '缓存DOM元素引用以提高性能',
          fixable: true,
          category: '性能问题',
          impact: '影响脚本执行速度',
          confidence: 0.85,
        },
        {
          id: '5',
          type: 'security',
          message: '使用了eval()函数',
          line: 89,
          column: 15,
          severity: 'high',
          suggestion: '避免使用eval()，考虑更安全的替代方案',
          fixable: false,
          category: '安全问题',
          impact: '存在代码注入风险',
          confidence: 0.92,
        },
      ];
      
      setAnalysisErrors(mockErrors);
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      
      const stats = getAnalysisStats(mockErrors);
      addAIMessage(`深度分析完成！\n\n📊 分析统计：\n- 总问题数: ${stats.totalErrors}\n- 严重: ${stats.criticalErrors}\n- 高危: ${stats.highErrors}\n- 中等: ${stats.mediumErrors}\n- 低危: ${stats.lowErrors}\n- 可修复: ${stats.fixableErrors}\n- 平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    }, 3000);
  };

  const handleRetry = async (record: ErrorRecord) => {
    try {
      addSystemMessage(`开始修复选择器: ${record.selector}`);

      const response = await fetch(`${API_BASE_URL}${API_PATHS.RETRY_ERROR(record.id)}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('重试失败');
      }
      
      const result = await response.json() as ErrorRecord;
      
      addAIMessage(`分析完成:\n原选择器: ${record.selector}\n新选择器: ${result.attempts[result.attempts.length - 1].selector}\n修复状态: ${result.attempts[result.attempts.length - 1].success ? '成功' : '失败'}`);

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
      addSystemMessage(`应用自定义选择器: ${customSelector}`);

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
      
      addAIMessage(`自定义修复完成:\n原选择器: ${selectedError.selector}\n新选择器: ${customSelector}\n修复状态: 成功`);

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

  const handleFixAnalysisError = (error: ErrorItem) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: '连接错误',
        description: 'WebSocket 连接未建立',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedAnalysisError(error);
    setIsRunning(true);
    
    const message = {
      type: 'fix_analysis_error',
      error: error,
      script: scriptContent,
      useAds,
      adsUserId,
      aiConfig,
    };
    
    wsRef.current.send(JSON.stringify(message));
    addAIMessage(`正在修复错误: ${error.message}\n位置: 第${error.line}行${error.column ? `第${error.column}列` : ''}\n置信度: ${(error.confidence * 100).toFixed(1)}%`);
  };

  const handleBatchFix = () => {
    const fixableErrors = analysisErrors.filter(e => e.fixable && e.severity !== 'low');
    if (fixableErrors.length === 0) {
      toast({
        title: '无可修复错误',
        description: '当前没有可自动修复的高优先级错误',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    addAIMessage(`开始批量修复 ${fixableErrors.length} 个错误...`);
    setIsRunning(true);
    
    // 模拟批量修复
    setTimeout(() => {
      const fixedCount = Math.floor(fixableErrors.length * 0.8);
      addAIMessage(`批量修复完成！\n- 尝试修复: ${fixableErrors.length}\n- 成功修复: ${fixedCount}\n- 失败: ${fixableErrors.length - fixedCount}`);
      setIsRunning(false);
    }, 5000);
  };

  const handleRevertChanges = () => {
    setScriptContent(originalContent);
    addAIMessage('已恢复到原始代码');
    toast({
      title: '恢复成功',
      description: '代码已恢复到原始状态',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
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
    addSystemMessage('开始执行自动纠错...');

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
      setIsRunning(false);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'purple';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'syntax': return FiCode;
      case 'runtime': return FiAlertTriangle;
      case 'logic': return FiCpu;
      case 'performance': return FiZap;
      case 'security': return FiShield;
      default: return FiAlertTriangle;
    }
  };

  const getFilteredAnalysisErrors = () => {
    return analysisErrors.filter(error => {
      const severityMatch = filterSeverity === 'all' || error.severity === filterSeverity;
      const typeMatch = filterType === 'all' || error.type === filterType;
      return severityMatch && typeMatch;
    });
  };

  const getAnalysisStats = (errors: ErrorItem[] = analysisErrors): AnalysisStats => {
    const total = errors.length;
    const critical = errors.filter(e => e.severity === 'critical').length;
    const high = errors.filter(e => e.severity === 'high').length;
    const medium = errors.filter(e => e.severity === 'medium').length;
    const low = errors.filter(e => e.severity === 'low').length;
    const fixable = errors.filter(e => e.fixable).length;
    const averageConfidence = errors.length > 0 ? errors.reduce((sum, e) => sum + e.confidence, 0) / errors.length : 0;
    
    return {
      totalErrors: total,
      fixedErrors: 0, // 这里可以根据实际修复状态计算
      criticalErrors: critical,
      highErrors: high,
      mediumErrors: medium,
      lowErrors: low,
      fixableErrors: fixable,
      averageConfidence,
    };
  };

  const stats = getAnalysisStats();
  const filteredAnalysisErrors = getFilteredAnalysisErrors();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <PageHeader
          title="智能错误诊断与修复"
          subtitle="使用 AI 技术自动检测和修复代码中的错误问题"
        >
          <HStack>
            <Badge colorScheme={isBrowserConnected ? 'green' : 'red'}>
              {isBrowserConnected ? '已连接' : '未连接'}
            </Badge>
            <Button
              leftIcon={<FiSettings />}
              size="sm"
              variant="outline"
              onClick={onConfigOpen}
            >
              AI 配置
            </Button>
          </HStack>
        </PageHeader>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>错误！</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>脚本分析</Tab>
            <Tab>错误记录</Tab>
            <Tab>修复历史</Tab>
            <Tab>AI 对话</Tab>
          </TabList>
          
          <TabPanels>
            {/* 脚本分析 Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* 文件上传区域 */}
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">📁 脚本上传与配置</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>上传脚本文件</FormLabel>
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
                            colorScheme="blue"
                            variant="outline"
                          >
                            选择文件
                          </Button>
                          {scriptContent && (
                            <Badge colorScheme="green">已加载脚本</Badge>
                          )}
                        </HStack>
                      </FormControl>
                      
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
                      </Grid>
                      
                      <HStack>
                        <Button
                          leftIcon={<FiCpu />}
                          colorScheme="purple"
                          onClick={() => scriptContent && analyzeScript(scriptContent)}
                          isLoading={isAnalyzing}
                          loadingText="分析中..."
                          isDisabled={!scriptContent}
                        >
                          深度分析
                        </Button>
                        <Button
                          leftIcon={<FiPlay />}
                          colorScheme="blue"
                          onClick={handleStartCorrection}
                          isLoading={isRunning}
                          loadingText="执行中..."
                          isDisabled={!scriptContent || !isBrowserConnected || (useAds && !adsUserId)}
                        >
                          开始纠错
                        </Button>
                        {scriptContent !== originalContent && (
                          <Button
                            leftIcon={<FiRotateCcw />}
                            variant="outline"
                            onClick={handleRevertChanges}
                          >
                            恢复原始代码
                          </Button>
                        )}
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
                
                {/* 分析进度 */}
                {isAnalyzing && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack spacing={3}>
                        <Text fontWeight="bold">正在分析脚本...</Text>
                        <Progress value={analysisProgress} colorScheme="purple" w="100%" />
                        <Text fontSize="sm" color="gray.500">
                          {analysisProgress.toFixed(0)}% 完成
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
                
                {/* 分析统计 */}
                {analysisErrors.length > 0 && (
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="md">📊 分析统计</Heading>
                    </CardHeader>
                    <CardBody>
                      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                        <Stat>
                          <StatLabel>总问题数</StatLabel>
                          <StatNumber>{stats.totalErrors}</StatNumber>
                          <StatHelpText>
                            <Icon as={FiActivity} /> 检测到的问题
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>严重问题</StatLabel>
                          <StatNumber color="red.500">{stats.criticalErrors + stats.highErrors}</StatNumber>
                          <StatHelpText>
                            <Icon as={FiAlertTriangle} /> 需要优先处理
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>可修复</StatLabel>
                          <StatNumber color="green.500">{stats.fixableErrors}</StatNumber>
                          <StatHelpText>
                            <Icon as={FiCheckCircle} /> 自动修复
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>置信度</StatLabel>
                          <StatNumber>{(stats.averageConfidence * 100).toFixed(1)}%</StatNumber>
                          <StatHelpText>
                            <Icon as={FiTrendingUp} /> 平均准确率
                          </StatHelpText>
                        </Stat>
                      </Grid>
                    </CardBody>
                  </Card>
                )}
                
                {/* 错误列表 */}
                {analysisErrors.length > 0 && (
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">🐛 检测到的问题</Heading>
                        <HStack>
                          <Select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            size="sm"
                            w="120px"
                          >
                            <option value="all">所有严重度</option>
                            <option value="critical">严重</option>
                            <option value="high">高危</option>
                            <option value="medium">中等</option>
                            <option value="low">低危</option>
                          </Select>
                          <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            size="sm"
                            w="120px"
                          >
                            <option value="all">所有类型</option>
                            <option value="syntax">语法</option>
                            <option value="runtime">运行时</option>
                            <option value="logic">逻辑</option>
                            <option value="performance">性能</option>
                            <option value="security">安全</option>
                          </Select>
                          <Button
                            leftIcon={<FiZap />}
                            size="sm"
                            colorScheme="orange"
                            onClick={handleBatchFix}
                            isDisabled={isRunning || filteredAnalysisErrors.filter(e => e.fixable).length === 0}
                          >
                            批量修复
                          </Button>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {filteredAnalysisErrors.map((error) => (
                          <Card key={error.id} variant="outline" borderColor={borderColor}>
                            <CardBody>
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={2} flex={1}>
                                  <HStack>
                                    <Icon as={getTypeIcon(error.type)} color={`${getSeverityColor(error.severity)}.500`} />
                                    <Badge colorScheme={getSeverityColor(error.severity)}>
                                      {error.severity.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline">{error.category}</Badge>
                                    <Text fontSize="sm" color="gray.500">
                                      第{error.line}行{error.column && `第${error.column}列`}
                                    </Text>
                                  </HStack>
                                  <Text fontWeight="bold">{error.message}</Text>
                                  <Text fontSize="sm" color="gray.600">{error.suggestion}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    影响: {error.impact} | 置信度: {(error.confidence * 100).toFixed(1)}%
                                  </Text>
                                </VStack>
                                <VStack>
                                  {error.fixable && (
                                    <Button
                                      size="sm"
                                      colorScheme="green"
                                      leftIcon={<FiCheckCircle />}
                                      onClick={() => handleFixAnalysisError(error)}
                                      isDisabled={isRunning}
                                    >
                                      修复
                                    </Button>
                                  )}
                                  <Badge colorScheme={error.fixable ? 'green' : 'gray'}>
                                    {error.fixable ? '可修复' : '需手动处理'}
                                  </Badge>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
            
            {/* 错误记录 Tab */}
            <TabPanel>
              <Card bg={cardBg}>
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
            </TabPanel>
            
            {/* 修复历史 Tab */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">🔄 修复历史记录</Heading>
                </CardHeader>
                <CardBody>
                  {fixHistory.length === 0 ? (
                    <Text color="gray.500">暂无修复记录</Text>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {fixHistory.map((fix) => (
                        <Card key={fix.id} variant="outline">
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack>
                                <Badge colorScheme={fix.success ? 'green' : 'red'}>
                                  {fix.success ? '修复成功' : '修复失败'}
                                </Badge>
                                <Text fontSize="sm" color="gray.500">
                                  {fix.timestamp.toLocaleString()}
                                </Text>
                                <Badge variant="outline">
                                  置信度: {(fix.confidence * 100).toFixed(1)}%
                                </Badge>
                              </HStack>
                              <Text fontWeight="bold">AI 解释:</Text>
                              <Text fontSize="sm">{fix.aiExplanation}</Text>
                              <Divider />
                              <Grid templateColumns="1fr 1fr" gap={4}>
                                <Box>
                                  <Text fontWeight="bold" fontSize="sm">原始代码:</Text>
                                  <Code p={2} display="block" whiteSpace="pre-wrap">
                                    {fix.originalCode}
                                  </Code>
                                </Box>
                                <Box>
                                  <Text fontWeight="bold" fontSize="sm">修复后代码:</Text>
                                  <Code p={2} display="block" whiteSpace="pre-wrap">
                                    {fix.fixedCode}
                                  </Code>
                                </Box>
                              </Grid>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* AI 对话 Tab */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">🤖 AI 助手对话</Heading>
                </CardHeader>
                <CardBody>
                  <Box
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={4}
                    maxH="400px"
                    overflowY="auto"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    ref={messageListRef}
                  >
                    {aiMessages.length === 0 ? (
                      <Text color="gray.500">暂无对话记录</Text>
                    ) : (
                      <List spacing={3}>
                        {aiMessages.map((msg) => (
                          <ListItem key={msg.id}>
                            <HStack align="start" spacing={3}>
                              <Badge
                                colorScheme={
                                  msg.type === 'system' ? 'blue' : 
                                  msg.type === 'ai' ? 'purple' : 'green'
                                }
                                minW="60px"
                                textAlign="center"
                              >
                                {msg.type === 'system' ? '系统' : 
                                 msg.type === 'ai' ? 'AI' : '用户'}
                              </Badge>
                              <VStack align="start" flex={1} spacing={1}>
                                <Text whiteSpace="pre-wrap" fontSize="sm">
                                  {msg.content}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {msg.timestamp.toLocaleTimeString()}
                                </Text>
                              </VStack>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      {/* 自定义修复模态框 */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔧 自定义修复</ModalHeader>
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
      
      {/* AI 配置模态框 */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>⚙️ AI 配置</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl>
                  <FormLabel>AI 模型</FormLabel>
                  <Select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>温度 ({aiConfig.temperature})</FormLabel>
                  <NumberInput
                    value={aiConfig.temperature}
                    onChange={(_, value) => setAiConfig(prev => ({ ...prev, temperature: value }))}
                    min={0}
                    max={1}
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
                    value={aiConfig.maxTokens}
                    onChange={(_, value) => setAiConfig(prev => ({ ...prev, maxTokens: value }))}
                    min={512}
                    max={4096}
                    step={256}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>批处理大小</FormLabel>
                  <NumberInput
                    value={aiConfig.batchSize}
                    onChange={(_, value) => setAiConfig(prev => ({ ...prev, batchSize: value }))}
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
              </Grid>
              
              <VStack align="stretch" spacing={3}>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">启用上下文分析</FormLabel>
                  <Switch
                    isChecked={aiConfig.enableContextAnalysis}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, enableContextAnalysis: e.target.checked }))}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">启用代码建议</FormLabel>
                  <Switch
                    isChecked={aiConfig.enableCodeSuggestions}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, enableCodeSuggestions: e.target.checked }))}
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">自动修复</FormLabel>
                  <Switch
                    isChecked={aiConfig.autoFix}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, autoFix: e.target.checked }))}
                  />
                </FormControl>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfigClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={onConfigClose}>
              保存配置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ErrorCorrector;