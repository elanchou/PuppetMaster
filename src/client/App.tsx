import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, ChakraProvider } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Recordings from './pages/Recordings';
import Settings from './pages/Settings';
import Execution from './pages/Execution';
import ErrorCorrector from './pages/ErrorCorrector';
import AIPilot from './pages/AIPilot';
import { AppRoutes } from './routes';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Box minH="100vh">
        <Navbar />
        <Box p={4}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recordings" element={<Recordings />} />
            <Route path="/execution" element={<Execution />} />
            <Route path="/error-corrector" element={<ErrorCorrector />} />
            <Route path="/ai-pilot" element={<AIPilot />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App; 