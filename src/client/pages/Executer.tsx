import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Divider,
  List,
  ListItem,
  IconButton,
  Input,
  useToast,
  Switch,
  Flex,
  Spacer,
  Container
} from '@chakra-ui/react';
import { FiUpload, FiPlay } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { 
  API_PATHS, 
  ExecuteScriptRequest, 
  ExecuteScriptResponse
} from '../../types/api';

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
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 自动滚动到日志底部
  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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
        instances: 1,
        useAds,
        adsUserId
      };

      console.log('发送请求:', request);
      console.log('请求URL:', `${API_BASE_URL}${API_PATHS.EXECUTE_SCRIPT}`);

      const response = await fetch(`${API_BASE_URL}${API_PATHS.EXECUTE_SCRIPT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      console.log('响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('响应错误:', errorText);
        throw new Error(`执行脚本失败: ${response.status} ${errorText}`);
      }

      const result = await response.json() as ExecuteScriptResponse;
      console.log('响应结果:', result);
      
      if (!result.success) {
        throw new Error(result.error || '执行脚本失败');
      }
      
      setLogs(prevLogs => [...prevLogs, {
        type: 'success',
        message: '脚本执行成功',
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: "成功",
        description: "脚本执行成功",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('执行错误:', error);
      setLogs(prevLogs => [...prevLogs, {
        type: 'error',
        message: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString()
      }]);
      
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : '执行脚本失败',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>脚本执行器</Heading>
        
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
                onClick={executeScript}
                isLoading={isRunning}
                loadingText="执行中..."
                isDisabled={!scriptContent || (useAds && !adsUserId)}
              >
                执行脚本
              </Button>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
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
                {logs.length === 0 ? (
                  <Text color="gray.500">暂无日志</Text>
                ) : (
                  <List spacing={2}>
                    {logs.map((log, index) => (
                      <ListItem key={index}>
                        <HStack>
                          <Badge
                            colorScheme={
                              log.type === 'error' ? 'red' :
                              log.type === 'success' ? 'green' :
                              log.type === 'command' ? 'purple' : 'blue'
                            }
                          >
                            {log.type}
                          </Badge>
                          <Text>{log.message}</Text>
                          <Spacer />
                          <Text fontSize="xs" color="gray.500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Text>
                        </HStack>
                      </ListItem>
                    ))}
                    <div ref={logsEndRef} />
                  </List>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Executer; 