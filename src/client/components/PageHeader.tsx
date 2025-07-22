import React from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Spacer,
  useColorModeValue,
} from '@chakra-ui/react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <Flex align="center" mb={8}>
      <Box>
        <Heading 
          size="2xl" 
          color={useColorModeValue('gray.800', 'white')}
          fontWeight="bold"
          bgGradient={useColorModeValue(
            'linear(to-r, gray.800, gray.600)',
            'linear(to-r, white, gray.300)'
          )}
          bgClip="text"
          letterSpacing="-0.02em"
        >
          {title}
        </Heading>
        <Text 
          color={useColorModeValue('gray.600', 'gray.400')} 
          fontSize="lg" 
          mt={2}
          fontWeight="500"
        >
          {subtitle}
        </Text>
      </Box>
      {children && (
        <>
          <Spacer />
          {children}
        </>
      )}
    </Flex>
  );
};

export default PageHeader;