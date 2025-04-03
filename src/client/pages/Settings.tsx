import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  Card,
  CardBody,
  useToast,
  Divider,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
} from '@chakra-ui/react';

interface Settings {
  metamaskPath: string;
  browserInstances: number;
  enableMouseMovement: boolean;
  clickOffset: number;
  minWaitTime: number;
  maxWaitTime: number;
  enableAI: boolean;
  aiModel: string;
  apiKey: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    metamaskPath: '/path/to/metamask',
    browserInstances: 1,
    enableMouseMovement: true,
    clickOffset: 5,
    minWaitTime: 500,
    maxWaitTime: 2000,
    enableAI: true,
    aiModel: 'gpt-4',
    apiKey: '',
  });

  const toast = useToast();

  const handleSave = () => {
    // 这里添加保存设置的逻辑
    toast({
      title: '设置已保存',
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Box>
      <Heading mb={6}>系统设置</Heading>

      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4}>
                浏览器设置
              </Heading>
              <FormControl mb={4}>
                <FormLabel>MetaMask 扩展路径</FormLabel>
                <Input
                  value={settings.metamaskPath}
                  onChange={(e) =>
                    setSettings({ ...settings, metamaskPath: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>最大浏览器实例数</FormLabel>
                <NumberInput
                  value={settings.browserInstances}
                  min={1}
                  max={10}
                  onChange={(_, value) =>
                    setSettings({ ...settings, browserInstances: value })
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>
                随机化设置
              </Heading>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb={0}>启用鼠标移动</FormLabel>
                <Switch
                  isChecked={settings.enableMouseMovement}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableMouseMovement: e.target.checked,
                    })
                  }
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>点击偏移范围（像素）</FormLabel>
                <NumberInput
                  value={settings.clickOffset}
                  min={0}
                  max={20}
                  onChange={(_, value) =>
                    setSettings({ ...settings, clickOffset: value })
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>等待时间范围（毫秒）</FormLabel>
                <HStack>
                  <NumberInput
                    value={settings.minWaitTime}
                    min={0}
                    max={settings.maxWaitTime}
                    onChange={(_, value) =>
                      setSettings({ ...settings, minWaitTime: value })
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text>至</Text>
                  <NumberInput
                    value={settings.maxWaitTime}
                    min={settings.minWaitTime}
                    max={5000}
                    onChange={(_, value) =>
                      setSettings({ ...settings, maxWaitTime: value })
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>
              </FormControl>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>
                AI 设置
              </Heading>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb={0}>启用 AI 辅助</FormLabel>
                <Switch
                  isChecked={settings.enableAI}
                  onChange={(e) =>
                    setSettings({ ...settings, enableAI: e.target.checked })
                  }
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>AI 模型</FormLabel>
                <Select
                  value={settings.aiModel}
                  onChange={(e) =>
                    setSettings({ ...settings, aiModel: e.target.value })
                  }
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>OpenAI API 密钥</FormLabel>
                <Input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
              </FormControl>
            </Box>

            <Button colorScheme="blue" onClick={handleSave}>
              保存设置
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Settings; 