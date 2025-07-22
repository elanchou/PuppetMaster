import React, { useState } from 'react';
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
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  useToast,
  Container,
  Divider,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Textarea,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code,
  List,
  ListItem,
  ListIcon,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import PageHeader from '../components/PageHeader';
import { 
  FiSave, 
  FiRefreshCw, 
  FiSettings, 
  FiGlobe, 
  FiCpu, 
  FiShield, 
  FiMonitor,
  FiDatabase,
  FiCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiEdit3,
  FiShuffle,
  FiLock,
  FiZap,
  FiBell,
  FiRotateCcw
} from 'react-icons/fi';

interface Settings {
  // 浏览器设置
  metamaskPath: string;
  browserInstances: number;
  browserTimeout: number;
  headlessMode: boolean;
  enableScreenshots: boolean;
  enableVideoRecording: boolean;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  
  // 随机化设置
  enableMouseMovement: boolean;
  mouseMovementDelay: number;
  clickOffset: number;
  minWaitTime: number;
  maxWaitTime: number;
  enableTypingRandomization: boolean;
  typingSpeed: number;
  enableScrollRandomization: boolean;
  
  // AI设置
  enableAI: boolean;
  aiModel: string;
  apiKey: string;
  aiTemperature: number;
  aiMaxTokens: number;
  enableContextAnalysis: boolean;
  enableAutoFix: boolean;
  aiRetryAttempts: number;
  
  // 代理设置
  enableProxy: boolean;
  proxyType: string;
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  proxyPassword: string;
  
  // 安全设置
  enableEncryption: boolean;
  sessionTimeout: number;
  enableLogging: boolean;
  logLevel: string;
  maxLogSize: number;
  
  // 性能设置
  enableCache: boolean;
  cacheSize: number;
  enableCompression: boolean;
  maxConcurrentTasks: number;
  resourceTimeout: number;
  
  // 通知设置
  enableNotifications: boolean;
  notificationSound: boolean;
  emailNotifications: boolean;
  webhookUrl: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    // 浏览器设置
    metamaskPath: '/path/to/metamask',
    browserInstances: 1,
    browserTimeout: 30000,
    headlessMode: false,
    enableScreenshots: true,
    enableVideoRecording: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewportWidth: 1920,
    viewportHeight: 1080,
    
    // 随机化设置
    enableMouseMovement: true,
    mouseMovementDelay: 100,
    clickOffset: 5,
    minWaitTime: 500,
    maxWaitTime: 2000,
    enableTypingRandomization: true,
    typingSpeed: 50,
    enableScrollRandomization: true,
    
    // AI设置
    enableAI: true,
    aiModel: 'gpt-4',
    apiKey: '',
    aiTemperature: 0.3,
    aiMaxTokens: 2048,
    enableContextAnalysis: true,
    enableAutoFix: false,
    aiRetryAttempts: 3,
    
    // 代理设置
    enableProxy: false,
    proxyType: 'http',
    proxyHost: '',
    proxyPort: 8080,
    proxyUsername: '',
    proxyPassword: '',
    
    // 安全设置
    enableEncryption: true,
    sessionTimeout: 3600,
    enableLogging: true,
    logLevel: 'info',
    maxLogSize: 100,
    
    // 性能设置
    enableCache: true,
    cacheSize: 500,
    enableCompression: true,
    maxConcurrentTasks: 5,
    resourceTimeout: 10000,
    
    // 通知设置
    enableNotifications: true,
    notificationSound: true,
    emailNotifications: false,
    webhookUrl: '',
  });

  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 这里可以添加保存设置到后端的逻辑
      console.log('保存设置:', settings);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      toast({
        title: "设置已保存",
        description: "您的设置已成功保存",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "保存设置时发生错误，请重试",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      // 重置为默认值
      metamaskPath: '/path/to/metamask',
      browserInstances: 1,
      browserTimeout: 30000,
      headlessMode: false,
      enableScreenshots: true,
      enableVideoRecording: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewportWidth: 1920,
      viewportHeight: 1080,
      enableMouseMovement: true,
      mouseMovementDelay: 100,
      clickOffset: 5,
      minWaitTime: 500,
      maxWaitTime: 2000,
      enableTypingRandomization: true,
      typingSpeed: 50,
      enableScrollRandomization: true,
      enableAI: true,
      aiModel: 'gpt-4',
      apiKey: '',
      aiTemperature: 0.3,
      aiMaxTokens: 2048,
      enableContextAnalysis: true,
      enableAutoFix: false,
      aiRetryAttempts: 3,
      enableProxy: false,
      proxyType: 'http',
      proxyHost: '',
      proxyPort: 8080,
      proxyUsername: '',
      proxyPassword: '',
      enableEncryption: true,
      sessionTimeout: 3600,
      enableLogging: true,
      logLevel: 'info',
      maxLogSize: 100,
      enableCache: true,
      cacheSize: 500,
      enableCompression: true,
      maxConcurrentTasks: 5,
      resourceTimeout: 10000,
      enableNotifications: true,
      notificationSound: true,
      emailNotifications: false,
      webhookUrl: '',
    });
    setHasUnsavedChanges(false);
    onResetClose();
    toast({
      title: "设置已重置",
      description: "所有设置已恢复为默认值",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'puppetmaster-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    onExportClose();
    toast({
      title: "设置已导出",
      description: "设置文件已下载到本地",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          setHasUnsavedChanges(true);
          toast({
            title: "设置已导入",
            description: "设置文件已成功导入，请保存以应用更改",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          toast({
            title: "导入失败",
            description: "设置文件格式错误，请检查文件内容",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  return (
    <Container maxW="7xl" py={8}>
      <PageHeader
        title="系统设置"
        subtitle="配置和管理您的自动化系统参数"
      >
        <HStack spacing={3}>
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            size="md"
            onClick={onExportOpen}
          >
            导出设置
          </Button>
          <Button
            leftIcon={<FiUpload />}
            variant="outline"
            size="md"
            as="label"
            htmlFor="import-settings"
          >
            导入设置
            <Input
              id="import-settings"
              type="file"
              accept=".json"
              onChange={handleImport}
              display="none"
            />
          </Button>
          <Button
            leftIcon={<FiRotateCcw />}
            variant="outline"
            size="md"
            onClick={onResetOpen}
          >
            重置
          </Button>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            size="md"
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="保存中..."
            isDisabled={!hasUnsavedChanges}
          >
            保存设置
          </Button>
        </HStack>
      </PageHeader>

      {hasUnsavedChanges && (
        <Alert 
          status="warning" 
          mb={6} 
          borderRadius="md"
        >
          <AlertIcon color="orange.500" />
          <Box>
            <AlertTitle fontSize="md" fontWeight="bold">
              有未保存的更改！
            </AlertTitle>
            <AlertDescription fontSize="sm">
              您有未保存的设置更改，请记得保存以应用更改。
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        variant="enclosed"
        colorScheme="blue"
      >
        <TabList>
          <Tab><Icon as={FiGlobe} mr={2} />浏览器</Tab>
          <Tab><Icon as={FiShuffle} mr={2} />随机化</Tab>
          <Tab><Icon as={FiCpu} mr={2} />AI 设置</Tab>
          <Tab><Icon as={FiShield} mr={2} />代理</Tab>
          <Tab><Icon as={FiLock} mr={2} />安全</Tab>
          <Tab><Icon as={FiZap} mr={2} />性能</Tab>
          <Tab><Icon as={FiBell} mr={2} />通知</Tab>
        </TabList>

        <TabPanels>
          {/* 浏览器设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel>MetaMask 扩展路径</FormLabel>
                  <Input
                    value={settings.metamaskPath}
                    onChange={(e) => updateSetting('metamaskPath', e.target.value)}
                    placeholder="请输入 MetaMask 扩展路径"
                  />
                </FormControl>
              </GridItem>

              <FormControl>
                <FormLabel>浏览器实例数量</FormLabel>
                <NumberInput
                  value={settings.browserInstances}
                  onChange={(value) => updateSetting('browserInstances', parseInt(value) || 1)}
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

              <FormControl>
                <FormLabel>浏览器超时时间 (毫秒)</FormLabel>
                <NumberInput
                  value={settings.browserTimeout}
                  onChange={(value) => updateSetting('browserTimeout', parseInt(value) || 30000)}
                  min={5000}
                  max={300000}
                  step={1000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>无头模式</FormLabel>
                <Switch
                  isChecked={settings.headlessMode}
                  onChange={(e) => updateSetting('headlessMode', e.target.checked)}
                />
                <FormHelperText>启用后浏览器将在后台运行</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>启用截图</FormLabel>
                <Switch
                  isChecked={settings.enableScreenshots}
                  onChange={(e) => updateSetting('enableScreenshots', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>启用视频录制</FormLabel>
                <Switch
                  isChecked={settings.enableVideoRecording}
                  onChange={(e) => updateSetting('enableVideoRecording', e.target.checked)}
                />
              </FormControl>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel>User Agent</FormLabel>
                  <Input
                    value={settings.userAgent}
                    onChange={(e) => updateSetting('userAgent', e.target.value)}
                    placeholder="浏览器 User Agent"
                  />
                </FormControl>
              </GridItem>

              <FormControl>
                <FormLabel>视口宽度</FormLabel>
                <NumberInput
                  value={settings.viewportWidth}
                  onChange={(value) => updateSetting('viewportWidth', parseInt(value) || 1920)}
                  min={800}
                  max={3840}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>视口高度</FormLabel>
                <NumberInput
                  value={settings.viewportHeight}
                  onChange={(value) => updateSetting('viewportHeight', parseInt(value) || 1080)}
                  min={600}
                  max={2160}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Grid>
          </TabPanel>

          {/* 随机化设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用鼠标移动</FormLabel>
                <Switch
                  isChecked={settings.enableMouseMovement}
                  onChange={(e) => updateSetting('enableMouseMovement', e.target.checked)}
                />
                <FormHelperText>模拟真实的鼠标移动轨迹</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>鼠标移动延迟 (毫秒)</FormLabel>
                <Slider
                  value={settings.mouseMovementDelay}
                  onChange={(value) => updateSetting('mouseMovementDelay', value)}
                  min={50}
                  max={500}
                  step={10}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color={mutedColor}>{settings.mouseMovementDelay}ms</Text>
              </FormControl>

              <FormControl>
                <FormLabel>点击偏移量 (像素)</FormLabel>
                <Slider
                  value={settings.clickOffset}
                  onChange={(value) => updateSetting('clickOffset', value)}
                  min={0}
                  max={20}
                  step={1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color={mutedColor}>{settings.clickOffset}px</Text>
              </FormControl>

              <FormControl>
                <FormLabel>最小等待时间 (毫秒)</FormLabel>
                <NumberInput
                  value={settings.minWaitTime}
                  onChange={(value) => updateSetting('minWaitTime', parseInt(value) || 500)}
                  min={100}
                  max={5000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>最大等待时间 (毫秒)</FormLabel>
                <NumberInput
                  value={settings.maxWaitTime}
                  onChange={(value) => updateSetting('maxWaitTime', parseInt(value) || 2000)}
                  min={500}
                  max={10000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>启用打字随机化</FormLabel>
                <Switch
                  isChecked={settings.enableTypingRandomization}
                  onChange={(e) => updateSetting('enableTypingRandomization', e.target.checked)}
                />
                <FormHelperText>模拟真实的打字速度变化</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>打字速度 (字符/分钟)</FormLabel>
                <Slider
                  value={settings.typingSpeed}
                  onChange={(value) => updateSetting('typingSpeed', value)}
                  min={20}
                  max={200}
                  step={5}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color={mutedColor}>{settings.typingSpeed} 字符/分钟</Text>
              </FormControl>

              <FormControl>
                <FormLabel>启用滚动随机化</FormLabel>
                <Switch
                  isChecked={settings.enableScrollRandomization}
                  onChange={(e) => updateSetting('enableScrollRandomization', e.target.checked)}
                />
                <FormHelperText>模拟真实的滚动行为</FormHelperText>
              </FormControl>
            </Grid>
          </TabPanel>

          {/* AI 设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用 AI 功能</FormLabel>
                <Switch
                  isChecked={settings.enableAI}
                  onChange={(e) => updateSetting('enableAI', e.target.checked)}
                />
                <FormHelperText>启用 AI 辅助功能</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>AI 模型</FormLabel>
                <Select
                  value={settings.aiModel}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                </Select>
              </FormControl>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel>API Key</FormLabel>
                  <Input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => updateSetting('apiKey', e.target.value)}
                    placeholder="请输入 AI 服务的 API Key"
                  />
                </FormControl>
              </GridItem>

              <FormControl>
                <FormLabel>AI 温度</FormLabel>
                <Slider
                  value={settings.aiTemperature}
                  onChange={(value) => updateSetting('aiTemperature', value)}
                  min={0}
                  max={1}
                  step={0.1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color={mutedColor}>{settings.aiTemperature}</Text>
              </FormControl>

              <FormControl>
                <FormLabel>最大令牌数</FormLabel>
                <NumberInput
                  value={settings.aiMaxTokens}
                  onChange={(value) => updateSetting('aiMaxTokens', parseInt(value) || 2048)}
                  min={256}
                  max={8192}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>启用上下文分析</FormLabel>
                <Switch
                  isChecked={settings.enableContextAnalysis}
                  onChange={(e) => updateSetting('enableContextAnalysis', e.target.checked)}
                />
                <FormHelperText>AI 将分析页面上下文</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>启用自动修复</FormLabel>
                <Switch
                  isChecked={settings.enableAutoFix}
                  onChange={(e) => updateSetting('enableAutoFix', e.target.checked)}
                />
                <FormHelperText>AI 将自动修复检测到的错误</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>AI 重试次数</FormLabel>
                <NumberInput
                  value={settings.aiRetryAttempts}
                  onChange={(value) => updateSetting('aiRetryAttempts', parseInt(value) || 3)}
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
          </TabPanel>

          {/* 代理设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用代理</FormLabel>
                <Switch
                  isChecked={settings.enableProxy}
                  onChange={(e) => updateSetting('enableProxy', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>代理类型</FormLabel>
                <Select
                  value={settings.proxyType}
                  onChange={(e) => updateSetting('proxyType', e.target.value)}
                  isDisabled={!settings.enableProxy}
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>代理主机</FormLabel>
                <Input
                  value={settings.proxyHost}
                  onChange={(e) => updateSetting('proxyHost', e.target.value)}
                  placeholder="代理服务器地址"
                  isDisabled={!settings.enableProxy}
                />
              </FormControl>

              <FormControl>
                <FormLabel>代理端口</FormLabel>
                <NumberInput
                  value={settings.proxyPort}
                  onChange={(value) => updateSetting('proxyPort', parseInt(value) || 8080)}
                  min={1}
                  max={65535}
                  isDisabled={!settings.enableProxy}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input
                  value={settings.proxyUsername}
                  onChange={(e) => updateSetting('proxyUsername', e.target.value)}
                  placeholder="代理用户名（可选）"
                  isDisabled={!settings.enableProxy}
                />
              </FormControl>

              <FormControl>
                <FormLabel>密码</FormLabel>
                <Input
                  type="password"
                  value={settings.proxyPassword}
                  onChange={(e) => updateSetting('proxyPassword', e.target.value)}
                  placeholder="代理密码（可选）"
                  isDisabled={!settings.enableProxy}
                />
              </FormControl>
            </Grid>
          </TabPanel>

          {/* 安全设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用加密</FormLabel>
                <Switch
                  isChecked={settings.enableEncryption}
                  onChange={(e) => updateSetting('enableEncryption', e.target.checked)}
                />
                <FormHelperText>加密存储的敏感数据</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>会话超时 (秒)</FormLabel>
                <NumberInput
                  value={settings.sessionTimeout}
                  onChange={(value) => updateSetting('sessionTimeout', parseInt(value) || 3600)}
                  min={300}
                  max={86400}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>启用日志记录</FormLabel>
                <Switch
                  isChecked={settings.enableLogging}
                  onChange={(e) => updateSetting('enableLogging', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>日志级别</FormLabel>
                <Select
                  value={settings.logLevel}
                  onChange={(e) => updateSetting('logLevel', e.target.value)}
                  isDisabled={!settings.enableLogging}
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>最大日志大小 (MB)</FormLabel>
                <NumberInput
                  value={settings.maxLogSize}
                  onChange={(value) => updateSetting('maxLogSize', parseInt(value) || 100)}
                  min={10}
                  max={1000}
                  isDisabled={!settings.enableLogging}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Grid>
          </TabPanel>

          {/* 性能设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用缓存</FormLabel>
                <Switch
                  isChecked={settings.enableCache}
                  onChange={(e) => updateSetting('enableCache', e.target.checked)}
                />
                <FormHelperText>缓存页面资源以提高性能</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>缓存大小 (MB)</FormLabel>
                <NumberInput
                  value={settings.cacheSize}
                  onChange={(value) => updateSetting('cacheSize', parseInt(value) || 500)}
                  min={50}
                  max={2000}
                  isDisabled={!settings.enableCache}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>启用压缩</FormLabel>
                <Switch
                  isChecked={settings.enableCompression}
                  onChange={(e) => updateSetting('enableCompression', e.target.checked)}
                />
                <FormHelperText>压缩网络传输数据</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>最大并发任务数</FormLabel>
                <NumberInput
                  value={settings.maxConcurrentTasks}
                  onChange={(value) => updateSetting('maxConcurrentTasks', parseInt(value) || 5)}
                  min={1}
                  max={20}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>资源超时时间 (毫秒)</FormLabel>
                <NumberInput
                  value={settings.resourceTimeout}
                  onChange={(value) => updateSetting('resourceTimeout', parseInt(value) || 10000)}
                  min={1000}
                  max={60000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Grid>
          </TabPanel>

          {/* 通知设置 */}
          <TabPanel>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl>
                <FormLabel>启用通知</FormLabel>
                <Switch
                  isChecked={settings.enableNotifications}
                  onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>通知声音</FormLabel>
                <Switch
                  isChecked={settings.notificationSound}
                  onChange={(e) => updateSetting('notificationSound', e.target.checked)}
                  isDisabled={!settings.enableNotifications}
                />
              </FormControl>

              <FormControl>
                <FormLabel>邮件通知</FormLabel>
                <Switch
                  isChecked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  isDisabled={!settings.enableNotifications}
                />
              </FormControl>

              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel>Webhook URL</FormLabel>
                  <Input
                    value={settings.webhookUrl}
                    onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                    placeholder="https://your-webhook-url.com"
                    isDisabled={!settings.enableNotifications}
                  />
                  <FormHelperText>用于接收任务完成通知的 Webhook 地址</FormHelperText>
                </FormControl>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* 重置确认对话框 */}
      <Modal isOpen={isResetOpen} onClose={onResetClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>重置设置</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>确定要将所有设置重置为默认值吗？此操作无法撤销。</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onResetClose}>
              取消
            </Button>
            <Button colorScheme="red" onClick={handleReset}>
              确认重置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 导出确认对话框 */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>导出设置</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>确定要导出当前设置到本地文件吗？</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleExport}>
              确认导出
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Settings;