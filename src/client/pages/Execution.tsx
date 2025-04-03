import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  ChakraProvider,
  Input,
  useToast,
  Switch,
} from '@chakra-ui/react';
import { FiPlay, FiPause, FiSquare, FiRefreshCw, FiUpload } from 'react-icons/fi';

interface ExecutionStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  currentInstance: number;
  totalInstances: number;
  logs: string[];
}

const Execution: React.FC = () => {
  const [selectedRecording, setSelectedRecording] = useState('');
  const [instances, setInstances] = useState(1);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [useAds, setUseAds] = useState(false);
  const [adsUserId, setAdsUserId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [status, setStatus] = useState<ExecutionStatus>({
    status: 'idle',
    progress: 0,
    currentInstance: 0,
    totalInstances: 0,
    logs: [],
  });

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

  const handleStart = async () => {
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

    setStatus({
      status: 'running',
      progress: 0,
      currentInstance: 1,
      totalInstances: instances,
      logs: ['开始执行自动化任务...'],
    });

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptContent,
          instances,
          useAds,
          adsUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('执行请求失败');
      }

      const result = await response.json();
      setStatus(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        logs: [...prev.logs, '任务执行完成'],
      }));
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        status: 'error',
        logs: [...prev.logs, `错误: ${error.message}`],
      }));
    }
  };

  const getStatusColor = (status: ExecutionStatus['status']) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Heading mb={6}>执行管理</Heading>
      
      <HStack spacing={8} align="flex-start">
        <Card flex={1}>
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

              <FormControl>
                <FormLabel>实例数量</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={instances}
                  onChange={(_, value) => setInstances(value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <Divider />

              <Box>
                <Text mb={2}>执行状态</Text>
                <Badge colorScheme={getStatusColor(status.status)} mb={4}>
                  {status.status.toUpperCase()}
                </Badge>
                <Progress
                  value={status.progress}
                  size="sm"
                  colorScheme={getStatusColor(status.status)}
                  mb={4}
                />
                <Text fontSize="sm" color="gray.500">
                  实例 {status.currentInstance} / {status.totalInstances}
                </Text>
              </Box>

              <HStack spacing={2}>
                <Button
                  leftIcon={<FiPlay />}
                  colorScheme="blue"
                  onClick={handleStart}
                  isDisabled={!scriptContent || status.status === 'running'}
                >
                  开始
                </Button>
                <IconButton
                  aria-label="Pause"
                  icon={<FiPause />}
                  isDisabled={status.status !== 'running'}
                />
                <IconButton
                  aria-label="Stop"
                  icon={<FiSquare />}
                  colorScheme="red"
                  isDisabled={status.status === 'idle' || status.status === 'completed'}
                />
                <IconButton
                  aria-label="Reset"
                  icon={<FiRefreshCw />}
                  isDisabled={status.status === 'running'}
                />
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card flex={2}>
          <CardBody>
            <Heading size="md" mb={4}>
              执行日志
            </Heading>
            <List spacing={2} maxH="400px" overflowY="auto">
              {status.logs.map((log, index) => (
                <ListItem key={index} fontSize="sm">
                  <Text as="span" color="gray.500">
                    [{new Date().toLocaleTimeString()}]
                  </Text>{' '}
                  {log}
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>
      </HStack>
    </Box>
  );
};

export default Execution; 