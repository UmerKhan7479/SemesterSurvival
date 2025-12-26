import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';

import { UploadProvider } from './context/UploadContext';

import Login from './pages/Login';
import Community from './pages/Community';
import ProtectedRoute from './components/ProtectedRoute';
import CheatSheetGenerator from './pages/CheatSheetGenerator';

function App() {
  return (
    <UploadProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/analysis" element={
          <ProtectedRoute>
            <Layout>
              <Analysis />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/community" element={
          <ProtectedRoute>
            <Layout>
              <Community />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/cheatsheet" element={
          <ProtectedRoute>
            <Layout>
              <CheatSheetGenerator />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Placeholder for uploads route */}
        <Route path="/uploads" element={
          <Layout>
            <div className="p-8 text-center text-slate-400">Upload History (Coming Soon)</div>
          </Layout>
        } />
      </Routes>
    </UploadProvider>
  );
}

export default App;
