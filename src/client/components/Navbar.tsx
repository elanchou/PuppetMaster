import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import { FiSun, FiMoon, FiHome, FiPlay, FiSettings, FiList, FiCheck, FiCpu } from 'react-icons/fi';

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box px={4} shadow="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            PuppetMaster
          </Text>
          <HStack spacing={4}>
            <Link as={RouterLink} to="/" display="flex" alignItems="center">
              <FiHome />
              <Text ml={2}>仪表盘</Text>
            </Link>
            <Link as={RouterLink} to="/recordings" display="flex" alignItems="center">
              <FiList />
              <Text ml={2}>录制</Text>
            </Link>
            <Link as={RouterLink} to="/error-corrector" display="flex" alignItems="center">
              <FiCheck />
              <Text ml={2}>纠错</Text>
            </Link>
            <Link as={RouterLink} to="/execution" display="flex" alignItems="center">
              <FiPlay />
              <Text ml={2}>执行</Text>
            </Link>
            <Link as={RouterLink} to="/ai-pilot" display="flex" alignItems="center">
              <FiCpu />
              <Text ml={2}>AI Pilot</Text>
            </Link>
            <Link as={RouterLink} to="/settings" display="flex" alignItems="center">
              <FiSettings />
              <Text ml={2}>设置</Text>
            </Link>
          </HStack>
        </HStack>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
          onClick={toggleColorMode}
        />
      </Flex>
    </Box>
  );
};

export default Navbar; 