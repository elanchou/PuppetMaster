import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Text,
  Badge,
  List,
  ListItem,
  HStack,
  VStack,
  Progress,
  Divider,
  Icon,
  useColorModeValue,
  Container,
  Flex,
  Spacer,
  Button,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { FiActivity, FiCpu, FiHardDrive, FiWifi, FiTrendingUp, FiUsers, FiClock, FiZap } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';

interface SystemStats {
  totalTasks: number;
  successRate: number;
  activeInstances: number;
  avgExecutionTime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface ExecutionRecord {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalTasks: 42,
    successRate: 95,
    activeInstances: 3,
    avgExecutionTime: '2.5m',
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 32,
  });

  const [recentExecutions, setRecentExecutions] = useState<ExecutionRecord[]>([
    {
      id: '1',
      name: 'PancakeSwap 交易脚本',
      status: 'success',
      duration: '2m 15s',
      timestamp: '10:30:25',
    },
    {
      id: '2',
      name: 'Uniswap 流动性添加',
      status: 'running',
      duration: '1m 45s',
      timestamp: '10:28:10',
    },
    {
      id: '3',
      name: 'MetaMask 钱包连接',
      status: 'failed',
      duration: '0m 30s',
      timestamp: '10:25:45',
    },
    {
      id: '4',
      name: 'DeFi 收益农场',
      status: 'success',
      duration: '3m 20s',
      timestamp: '10:22:15',
    },
  ]);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'failed':
        return '失败';
      case 'running':
        return '运行中';
      default:
        return '未知';
    }
  };

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.max(20, Math.min(80, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        diskUsage: Math.max(20, Math.min(70, prev.diskUsage + (Math.random() - 0.5) * 5)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxW="7xl" py={8}>
      <PageHeader
        title="控制台"
        subtitle="实时监控您的自动化任务和系统状态"
      >
        <Button 
          leftIcon={<FiZap />} 
          colorScheme="blue" 
          size="lg"
        >
          快速启动
        </Button>
      </PageHeader>
      
      {/* 状态监控面板 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody p={6}>
            <HStack spacing={4}>
              <Icon as={FiTrendingUp} color="blue.500" boxSize={6} />
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                  总任务数
                </StatLabel>
                <StatNumber color="blue.500" fontSize="2xl" fontWeight="bold">
                  {stats.totalTasks}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  过去30天增长 23%
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody p={6}>
            <HStack spacing={4}>
              <CircularProgress value={stats.successRate} color="green.500" size="48px" thickness="8px">
                <CircularProgressLabel fontSize="xs" fontWeight="bold">
                  {stats.successRate}%
                </CircularProgressLabel>
              </CircularProgress>
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                  成功率
                </StatLabel>
                <StatNumber color="green.500" fontSize="2xl" fontWeight="bold">
                  {stats.successRate}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  本周提升 5%
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody p={6}>
            <HStack spacing={4}>
              <Icon as={FiUsers} color="orange.500" boxSize={6} />
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                  活跃实例
                </StatLabel>
                <StatNumber color="orange.500" fontSize="2xl" fontWeight="bold">
                  {stats.activeInstances}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiActivity} color="green.500" mr={1} />
                  当前运行中
                </StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody p={6}>
            <HStack spacing={4}>
              <Icon as={FiClock} color="purple.500" boxSize={6} />
              <Stat>
                <StatLabel color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm">
                  平均执行时间
                </StatLabel>
                <StatNumber color="purple.500" fontSize="2xl" fontWeight="bold">
                  {stats.avgExecutionTime}
                </StatNumber>
                <StatHelpText>每个任务平均用时</StatHelpText>
              </Stat>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* 最近执行记录 */}
        <Card>
          <CardHeader pb={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Heading size="lg" color={useColorModeValue('gray.800', 'white')} fontWeight="bold">
                  实时执行日志
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm" mt={1}>
                  查看最新的任务执行状态
                </Text>
              </Box>
              <Button size="sm" variant="ghost" colorScheme="blue">
                查看全部
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              {recentExecutions.map((record, index) => (
                <Box
                  key={record.id}
                  p={4}
                  borderRadius="md"
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <HStack justify="space-between" align="start">
                    <HStack spacing={4} flex={1}>
                      <Icon 
                        as={record.status === 'success' ? FiActivity : record.status === 'failed' ? FiActivity : FiClock} 
                        color={record.status === 'success' ? 'green.500' : record.status === 'failed' ? 'red.500' : 'blue.500'} 
                        boxSize={5} 
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="600" color={useColorModeValue('gray.800', 'white')} fontSize="md">
                          {record.name}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            colorScheme={getStatusColor(record.status)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {getStatusText(record.status)}
                          </Badge>
                          <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                            {record.duration}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                      {record.timestamp}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
        
        {/* 系统状态 */}
        <Card>
          <CardHeader pb={4}>
            <Box>
              <Heading size="lg" color={useColorModeValue('gray.800', 'white')} fontWeight="bold">
                系统状态
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="sm" mt={1}>
                实时监控系统资源使用情况
              </Text>
            </Box>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={6} align="stretch">
              {/* CPU 使用率 */}
              <Box 
                p={4} 
                borderRadius="md" 
                bg={useColorModeValue('blue.50', 'blue.900')}
              >
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={3}>
                    <Icon as={FiCpu} color="blue.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('blue.700', 'blue.300')}>
                        CPU 使用率
                      </Text>
                      <Text fontSize="xs" color={useColorModeValue('blue.600', 'blue.400')}>
                        处理器负载
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('blue.700', 'blue.300')}>
                    {stats.cpuUsage.toFixed(1)}%
                  </Text>
                </HStack>
                <Progress 
                  value={stats.cpuUsage} 
                  colorScheme={stats.cpuUsage > 70 ? 'red' : stats.cpuUsage > 50 ? 'yellow' : 'blue'}
                  size="md"
                />
              </Box>
              
              {/* 内存使用率 */}
              <Box 
                p={4} 
                borderRadius="md" 
                bg={useColorModeValue('green.50', 'green.900')}
              >
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={3}>
                    <Icon as={FiHardDrive} color="green.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('green.700', 'green.300')}>
                        内存使用率
                      </Text>
                      <Text fontSize="xs" color={useColorModeValue('green.600', 'green.400')}>
                        RAM 占用
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('green.700', 'green.300')}>
                    {stats.memoryUsage.toFixed(1)}%
                  </Text>
                </HStack>
                <Progress 
                  value={stats.memoryUsage} 
                  colorScheme={stats.memoryUsage > 80 ? 'red' : stats.memoryUsage > 60 ? 'yellow' : 'green'}
                  size="md"
                />
              </Box>
              
              {/* 磁盘使用率 */}
              <Box 
                p={4} 
                borderRadius="md" 
                bg={useColorModeValue('purple.50', 'purple.900')}
              >
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={3}>
                    <Icon as={FiHardDrive} color="purple.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('purple.700', 'purple.300')}>
                        磁盘使用率
                      </Text>
                      <Text fontSize="xs" color={useColorModeValue('purple.600', 'purple.400')}>
                        存储空间
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('purple.700', 'purple.300')}>
                    {stats.diskUsage.toFixed(1)}%
                  </Text>
                </HStack>
                <Progress 
                  value={stats.diskUsage} 
                  colorScheme={stats.diskUsage > 70 ? 'red' : stats.diskUsage > 50 ? 'yellow' : 'purple'}
                  size="md"
                />
              </Box>
              
              {/* 网络状态 */}
              <Box 
                p={4} 
                borderRadius="md" 
                bg={useColorModeValue('orange.50', 'orange.900')}
              >
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Icon as={FiWifi} color="orange.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('orange.700', 'orange.300')}>
                        网络状态
                      </Text>
                      <Text fontSize="xs" color={useColorModeValue('orange.600', 'orange.400')}>
                        连接正常
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge 
                    colorScheme="orange" 
                    variant="subtle"
                    fontSize="xs"
                  >
                    正常
                  </Badge>
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </Container>
  );
};

export default Dashboard;