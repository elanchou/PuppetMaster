import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Execution from '../pages/Execution';
import Recordings from '../pages/Recordings';
import Settings from '../pages/Settings';
import ErrorCorrector from '../pages/ErrorCorrector';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/execution" element={<Execution />} />
        <Route path="/recordings" element={<Recordings />} />
        <Route path="/error-corrector" element={<ErrorCorrector />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}; 