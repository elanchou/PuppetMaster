import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Textarea,
  useToast,
  Card,
  CardBody,
  Text,
  Badge,
  List,
  ListItem,
  HStack,
  Spacer,
} from '@chakra-ui/react';
import { FiPlay, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../../types/api';

interface AIMessage {
  type: 'system' | 'ai' | 'error';
  content: string;
  timestamp: string;
}

const AIPilot: React.FC = () => {
  const [url, setUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

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
        }),
      });

      if (!response.ok) {
        throw new Error('执行失败');
      }

      const result = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'system',
        content: '执行成功',
        timestamp: new Date().toISOString(),
      }]);

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

      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '执行失败',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>AI Pilot</Heading>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>OpenAI API Key</FormLabel>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入 OpenAI API Key"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>目标网址</FormLabel>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="输入要访问的网址"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>指令</FormLabel>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="输入要执行的指令，例如：'点击登录按钮'"
                  rows={4}
                />
              </FormControl>

              <Button
                leftIcon={isProcessing ? <FiX /> : <FiPlay />}
                colorScheme="blue"
                onClick={handleExecute}
                isLoading={isProcessing}
                loadingText="执行中..."
              >
                执行指令
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
    </Container>
  );
};

export default AIPilot; 