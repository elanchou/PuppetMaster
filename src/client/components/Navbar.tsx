import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  useColorMode,
  Text,
  useColorModeValue,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FiSun, FiMoon, FiHome, FiPlay, FiSettings, FiList, FiCheck, FiCpu } from 'react-icons/fi';

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  
  const navBg = useColorModeValue('white', 'gray.800');
  
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: FiHome, label: '仪表盘' },
    { path: '/recordings', icon: FiList, label: '录制' },
    { path: '/error-corrector', icon: FiCheck, label: '纠错' },
    { path: '/execution', icon: FiPlay, label: '执行' },
    { path: '/ai-pilot', icon: FiCpu, label: 'AI Pilot' },
    { path: '/settings', icon: FiSettings, label: '设置' },
  ];

  return (
    <Box 
      position="sticky"
      top={0}
      zIndex={1000}
      px={6} 
      py={2}
      bg={navBg}
      borderBottom="1px solid"
      borderColor={borderColor}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Box>
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color={useColorModeValue('gray.800', 'white')}
            >
              PuppetMaster
            </Text>
            <Badge 
              colorScheme="blue" 
              variant="subtle" 
              fontSize="xs"
            >
              v1.0
            </Badge>
          </Box>
          
          <HStack spacing={1}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Tooltip key={item.path} label={item.label} placement="bottom">
                  <Link 
                    as={RouterLink} 
                    to={item.path}
                    display="flex" 
                    alignItems="center"
                    px={4}
                    py={2}
                    borderRadius="md"
                    fontWeight={active ? '600' : '500'}
                    color={active ? 'blue.500' : useColorModeValue('gray.600', 'gray.300')}
                    bg={active ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                    _hover={{
                      bg: active 
                        ? useColorModeValue('blue.100', 'blue.800')
                        : useColorModeValue('gray.100', 'gray.700'),
                    }}
                  >
                    <Icon size={18} />
                    <Text ml={2} fontSize="sm">{item.label}</Text>
                  </Link>
                </Tooltip>
              );
            })}
          </HStack>
        </HStack>
        
        <Tooltip label={colorMode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'} placement="bottom">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default Navbar;