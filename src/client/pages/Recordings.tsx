import React, { useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  HStack,
  Badge,
  InputGroup,
  InputLeftElement,
  Select,
  Card,
  CardBody,
  Text,
  VStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  Flex,
  Spacer,
  Tag,
  TagLabel,
  Tooltip,
  Container,
} from '@chakra-ui/react';
import { FiPlay, FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter, FiClock, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';

interface Recording {
  id: string;
  name: string;
  description: string;
  steps: number;
  createdAt: string;
  lastExecuted?: string;
  status: 'active' | 'inactive' | 'recording';
  category: 'defi' | 'nft' | 'wallet' | 'other';
  executionCount: number;
  successRate: number;
}

const Recordings: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: '1',
      name: 'PancakeSwap 交易流程',
      description: '自动化 PancakeSwap 代币交易，包含连接钱包、选择代币、设置滑点、确认交易等步骤',
      steps: 12,
      createdAt: '2024-01-15',
      lastExecuted: '2024-01-20 14:30',
      status: 'active',
      category: 'defi',
      executionCount: 25,
      successRate: 96,
    },
    {
      id: '2',
      name: 'MetaMask 钱包连接',
      description: '自动连接 MetaMask 钱包并授权应用访问',
      steps: 8,
      createdAt: '2024-01-14',
      lastExecuted: '2024-01-19 09:15',
      status: 'active',
      category: 'wallet',
      executionCount: 42,
      successRate: 98,
    },
    {
      id: '3',
      name: 'Uniswap 流动性添加',
      description: '向 Uniswap V3 池添加流动性，设置价格范围',
      steps: 15,
      createdAt: '2024-01-13',
      lastExecuted: '2024-01-18 16:45',
      status: 'inactive',
      category: 'defi',
      executionCount: 8,
      successRate: 87,
    },
    {
      id: '4',
      name: 'OpenSea NFT 购买',
      description: '自动化 OpenSea NFT 购买流程',
      steps: 10,
      createdAt: '2024-01-12',
      status: 'recording',
      category: 'nft',
      executionCount: 0,
      successRate: 0,
    },
  ]);

  const [newRecording, setNewRecording] = useState({
    name: '',
    description: '',
    category: 'other' as Recording['category'],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
  
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'defi': return 'blue';
      case 'nft': return 'purple';
      case 'wallet': return 'green';
      default: return 'gray';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'defi': return 'DeFi';
      case 'nft': return 'NFT';
      case 'wallet': return '钱包';
      default: return '其他';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'recording': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'inactive': return '非活跃';
      case 'recording': return '录制中';
      default: return '未知';
    }
  };

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || recording.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreateRecording = () => {
    if (!newRecording.name.trim()) {
      toast({
        title: '错误',
        description: '请输入录制名称',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const recording: Recording = {
      id: Date.now().toString(),
      name: newRecording.name,
      description: newRecording.description,
      category: newRecording.category,
      steps: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      executionCount: 0,
      successRate: 0,
    };
    setRecordings([recording, ...recordings]);
    setNewRecording({ name: '', description: '', category: 'other' });
    onClose();
    
    toast({
      title: '成功',
      description: '录制创建成功',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteRecording = () => {
    if (recordingToDelete) {
      setRecordings(recordings.filter(r => r.id !== recordingToDelete));
      toast({
        title: '成功',
        description: '录制删除成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    setRecordingToDelete(null);
    onDeleteClose();
  };

  const handlePlayRecording = (recording: Recording) => {
    toast({
      title: '开始执行',
      description: `正在执行录制: ${recording.name}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleEditRecording = (recording: Recording) => {
    toast({
      title: '编辑功能',
      description: '录制编辑功能即将推出',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const confirmDelete = (id: string) => {
    setRecordingToDelete(id);
    onDeleteOpen();
  };

  return (
    <Container maxW="7xl" py={8}>
      <PageHeader
         title="录制管理"
         subtitle="创建和管理您的自动化录制脚本"
       >
         <Button 
           leftIcon={<FiPlus />} 
           colorScheme="blue" 
           onClick={onOpen}
           size="lg"
         >
           新建录制
         </Button>
       </PageHeader>

      {/* 搜索和过滤器 */}
      <Card mb={8}>
        <CardBody p={6}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'center' }}>
            <InputGroup flex={1} maxW={{ md: '400px' }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color={useColorModeValue('gray.400', 'gray.500')} />
              </InputLeftElement>
              <Input
                placeholder="搜索录制名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <HStack spacing={3}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                w="160px"
              >
                <option value="all">所有状态</option>
                <option value="active">活跃</option>
                <option value="inactive">非活跃</option>
                <option value="recording">录制中</option>
              </Select>
              
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                w="160px"
              >
                <option value="all">所有分类</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="wallet">钱包</option>
                <option value="other">其他</option>
              </Select>
              
              <IconButton
                aria-label="Filter"
                icon={<FiFilter />}
                variant="outline"
                colorScheme="blue"
              />
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* 录制列表 */}
      <Card>
        <CardBody p={0}>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th 
                    fontWeight="bold" 
                    fontSize="sm"
                  >
                    名称
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    分类
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    步骤数
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    执行次数
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    成功率
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    最后执行
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    状态
                  </Th>
                  <Th 
                    color={useColorModeValue('gray.700', 'gray.300')} 
                    fontWeight="600" 
                    fontSize="sm"
                    py={4}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    操作
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRecordings.map((recording) => (
                  <Tr 
                    key={recording.id}
                    _hover={{
                      bg: useColorModeValue('gray.50', 'gray.700'),
                    }}
                    transition="all 0.2s"
                  >
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="600" color={useColorModeValue('gray.800', 'white')} fontSize="md">
                          {recording.name}
                        </Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} noOfLines={2}>
                          {recording.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <Badge 
                        colorScheme={getCategoryColor(recording.category)} 
                        variant="subtle"
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {getCategoryText(recording.category)}
                      </Badge>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <HStack spacing={2}>
                        <Box 
                          p={1} 
                          borderRadius="md" 
                          bg={useColorModeValue('blue.50', 'blue.900')}
                        >
                          <FiActivity size={14} color="#3182ce" />
                        </Box>
                        <Text fontWeight="600" color={useColorModeValue('gray.700', 'gray.300')}>
                          {recording.steps}
                        </Text>
                      </HStack>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <Text fontWeight="600" color={useColorModeValue('gray.700', 'gray.300')}>
                        {recording.executionCount}
                      </Text>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <HStack spacing={2}>
                        <Text 
                          fontWeight="600"
                          color={recording.successRate >= 90 ? 'green.500' : recording.successRate >= 70 ? 'yellow.500' : 'red.500'}
                        >
                          {recording.successRate}%
                        </Text>
                        <Box 
                          w={2} 
                          h={2} 
                          borderRadius="full" 
                          bg={recording.successRate >= 90 ? 'green.500' : recording.successRate >= 70 ? 'yellow.500' : 'red.500'}
                        />
                      </HStack>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      {recording.lastExecuted ? (
                        <HStack spacing={2}>
                          <Box 
                            p={1} 
                            borderRadius="md" 
                            bg={useColorModeValue('gray.50', 'gray.700')}
                          >
                            <FiClock size={12} color={useColorModeValue('#718096', '#a0aec0')} />
                          </Box>
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                            {recording.lastExecuted}
                          </Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={useColorModeValue('gray.400', 'gray.500')}>未执行</Text>
                      )}
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <Badge 
                        colorScheme={getStatusColor(recording.status)} 
                        variant="subtle"
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {getStatusText(recording.status)}
                      </Badge>
                    </Td>
                    <Td py={6} borderColor={useColorModeValue('gray.200', 'gray.600')}>
                      <HStack spacing={1}>
                        <Tooltip label="执行录制" placement="top">
                          <IconButton
                            aria-label="播放录制"
                            icon={<FiPlay />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            borderRadius="lg"
                            _hover={{
                              transform: 'scale(1.1)',
                              bg: useColorModeValue('green.50', 'green.900'),
                            }}
                            transition="all 0.2s"
                            onClick={() => handlePlayRecording(recording)}
                            isDisabled={recording.status === 'recording'}
                          />
                        </Tooltip>
                        <Tooltip label="编辑录制" placement="top">
                          <IconButton
                            aria-label="编辑录制"
                            icon={<FiEdit />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            borderRadius="lg"
                            _hover={{
                              transform: 'scale(1.1)',
                              bg: useColorModeValue('blue.50', 'blue.900'),
                            }}
                            transition="all 0.2s"
                            onClick={() => handleEditRecording(recording)}
                          />
                        </Tooltip>
                        <Tooltip label="删除录制" placement="top">
                          <IconButton
                            aria-label="删除录制"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            borderRadius="lg"
                            _hover={{
                              transform: 'scale(1.1)',
                              bg: useColorModeValue('red.50', 'red.900'),
                            }}
                            transition="all 0.2s"
                            onClick={() => confirmDelete(recording.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          
          {filteredRecordings.length === 0 && (
            <Box textAlign="center" py={12}>
              <VStack spacing={3}>
                <Box 
                  p={4} 
                  borderRadius="full" 
                  bg={useColorModeValue('gray.100', 'gray.700')}
                >
                  <FiSearch size={24} color={useColorModeValue('#718096', '#a0aec0')} />
                </Box>
                <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg" fontWeight="500">
                  没有找到匹配的录制
                </Text>
                <Text color={useColorModeValue('gray.500', 'gray.500')} fontSize="sm">
                  尝试调整搜索条件或创建新的录制
                </Text>
              </VStack>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* 新建录制模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent 
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="2xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          mx={4}
        >
          <ModalHeader 
            pb={2}
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.100', 'gray.700')}
          >
            <HStack spacing={3}>
              <Box 
                p={2} 
                borderRadius="lg" 
                bg={useColorModeValue('blue.50', 'blue.900')}
              >
                <FiPlus size={20} color="#3182ce" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="700" color={useColorModeValue('gray.800', 'white')}>
                  新建录制
                </Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  创建一个新的自动化录制任务
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton 
            borderRadius="lg"
            _hover={{
              bg: useColorModeValue('gray.100', 'gray.700'),
            }}
          />
          <ModalBody py={6}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel 
                  fontSize="sm" 
                  fontWeight="600" 
                  color={useColorModeValue('gray.700', 'gray.300')}
                  mb={2}
                >
                  录制名称
                </FormLabel>
                <Input
                  value={newRecording.name}
                  onChange={(e) => setNewRecording({ ...newRecording, name: e.target.value })}
                  placeholder="输入录制名称"
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500'),
                  }}
                  _focus={{
                    borderColor: 'blue.500',
                    bg: useColorModeValue('white', 'gray.800'),
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                  }}
                  py={3}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel 
                  fontSize="sm" 
                  fontWeight="600" 
                  color={useColorModeValue('gray.700', 'gray.300')}
                  mb={2}
                >
                  分类
                </FormLabel>
                <Select
                  value={newRecording.category}
                  onChange={(e) => setNewRecording({ ...newRecording, category: e.target.value as Recording['category'] })}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500'),
                  }}
                  _focus={{
                    borderColor: 'blue.500',
                    bg: useColorModeValue('white', 'gray.800'),
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                  }}
                >
                  <option value="defi">DeFi</option>
                  <option value="nft">NFT</option>
                  <option value="wallet">钱包</option>
                  <option value="other">其他</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel 
                  fontSize="sm" 
                  fontWeight="600" 
                  color={useColorModeValue('gray.700', 'gray.300')}
                  mb={2}
                >
                  描述
                </FormLabel>
                <Textarea
                  value={newRecording.description}
                  onChange={(e) => setNewRecording({ ...newRecording, description: e.target.value })}
                  placeholder="输入录制描述（可选）"
                  rows={3}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500'),
                  }}
                  _focus={{
                    borderColor: 'blue.500',
                    bg: useColorModeValue('white', 'gray.800'),
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                  }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter 
            pt={4}
            borderTop="1px solid"
            borderColor={useColorModeValue('gray.100', 'gray.700')}
          >
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={onClose}
                borderRadius="xl"
                px={6}
                _hover={{
                  bg: useColorModeValue('gray.100', 'gray.700'),
                }}
              >
                取消
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleCreateRecording}
                borderRadius="xl"
                px={6}
                boxShadow="lg"
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'xl',
                }}
                transition="all 0.2s"
              >
                创建录制
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(10px)">
          <AlertDialogContent 
            bg={useColorModeValue('white', 'gray.800')}
            borderRadius="2xl"
            boxShadow="2xl"
            border="1px solid"
            borderColor={useColorModeValue('gray.100', 'gray.700')}
            mx={4}
          >
            <AlertDialogHeader 
              fontSize="lg" 
              fontWeight="bold"
              pb={2}
              borderBottom="1px solid"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
            >
              <HStack spacing={3}>
                <Box 
                  p={2} 
                  borderRadius="lg" 
                  bg={useColorModeValue('red.50', 'red.900')}
                >
                  <FiTrash2 size={20} color="#e53e3e" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="700" color={useColorModeValue('gray.800', 'white')}>
                    删除录制
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    此操作无法撤销
                  </Text>
                </VStack>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody py={6}>
              <VStack spacing={4} align="start">
                <Text color={useColorModeValue('gray.700', 'gray.300')} fontSize="md">
                  确定要删除这个录制吗？此操作无法撤销。
                </Text>
                <Box 
                  p={4} 
                  borderRadius="xl" 
                  bg={useColorModeValue('red.50', 'red.900')} 
                  border="1px solid" 
                  borderColor={useColorModeValue('red.200', 'red.700')}
                  w="full"
                >
                  <HStack spacing={2}>
                    <Box color="red.500">
                      ⚠️
                    </Box>
                    <Text fontSize="sm" color={useColorModeValue('red.700', 'red.300')} fontWeight="600">
                      警告：此操作无法撤销
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter 
              pt={4}
              borderTop="1px solid"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
            >
              <HStack spacing={3}>
                <Button 
                  ref={cancelRef} 
                  onClick={onDeleteClose}
                  borderRadius="xl"
                  px={6}
                  _hover={{
                    bg: useColorModeValue('gray.100', 'gray.700'),
                  }}
                >
                  取消
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteRecording}
                  borderRadius="xl"
                  px={6}
                  boxShadow="lg"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'xl',
                  }}
                  transition="all 0.2s"
                >
                  确认删除
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Recordings;