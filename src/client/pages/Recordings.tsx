import React, { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FiPlay, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

interface Recording {
  id: string;
  name: string;
  description: string;
  steps: number;
  createdAt: string;
}

const Recordings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: '1',
      name: 'Pancakeswap 交易',
      description: '在 Pancakeswap 上执行代币交换',
      steps: 5,
      createdAt: '2024-03-15',
    },
  ]);
  const toast = useToast();

  const handleDelete = (id: string) => {
    setRecordings(recordings.filter(rec => rec.id !== id));
    toast({
      title: '录制已删除',
      status: 'success',
      duration: 3000,
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>录制管理</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => setIsOpen(true)}>
          新建录制
        </Button>
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>名称</Th>
            <Th>描述</Th>
            <Th>步骤数</Th>
            <Th>创建时间</Th>
            <Th>操作</Th>
          </Tr>
        </Thead>
        <Tbody>
          {recordings.map(recording => (
            <Tr key={recording.id}>
              <Td>{recording.name}</Td>
              <Td>{recording.description}</Td>
              <Td>{recording.steps}</Td>
              <Td>{recording.createdAt}</Td>
              <Td>
                <IconButton
                  aria-label="Play recording"
                  icon={<FiPlay />}
                  mr={2}
                  size="sm"
                  colorScheme="green"
                />
                <IconButton
                  aria-label="Edit recording"
                  icon={<FiEdit />}
                  mr={2}
                  size="sm"
                />
                <IconButton
                  aria-label="Delete recording"
                  icon={<FiTrash2 />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDelete(recording.id)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新建录制</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              <FormControl>
                <FormLabel>名称</FormLabel>
                <Input placeholder="输入录制名称" />
              </FormControl>
              <FormControl>
                <FormLabel>描述</FormLabel>
                <Textarea placeholder="输入录制描述" />
              </FormControl>
              <Button colorScheme="blue" width="100%">
                开始录制
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Recordings; 