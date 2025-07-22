import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' 
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        minHeight: '100vh',
        fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
      },
      '*': {
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
      },
      '::selection': {
        bg: props.colorMode === 'dark' ? 'blue.200' : 'blue.100',
        color: props.colorMode === 'dark' ? 'gray.900' : 'gray.800',
      },
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.400',
        borderRadius: 'full',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.500',
      },
    }),
  },
  colors: {
    brand: {
      50: '#e6f3ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0066cc',
      600: '#0052a3',
      700: '#003d7a',
      800: '#002952',
      900: '#001429',
    },
    accent: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gradient: {
      primary: 'linear(to-r, blue.400, purple.500)',
      secondary: 'linear(to-r, teal.400, blue.500)',
      accent: 'linear(to-r, pink.400, purple.600)',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
        transition: 'all 0.2s',
        _focus: {
          boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
        },
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      sizes: {
        lg: {
          h: '12',
          px: '8',
          fontSize: 'lg',
        },
      },
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          borderRadius: 'xl',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          boxShadow: props.colorMode === 'dark' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: props.colorMode === 'dark'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      }),
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          transition: 'all 0.2s',
          _focus: {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
            transform: 'scale(1.02)',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: '600',
        fontSize: 'xs',
        px: 3,
        py: 1,
      },
    },
    Progress: {
      baseStyle: {
        track: {
          borderRadius: 'full',
        },
        filledTrack: {
          borderRadius: 'full',
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.025em',
      },
    },
  },

});

export default theme;