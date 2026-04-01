import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useStore();
  if (!user || !accessToken) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const { initSocket, accessToken } = useStore();

  useEffect(() => {
    if (accessToken) {
      initSocket(accessToken);
    }
  }, [accessToken]);

  return (
    <Router>
      <div className="min-h-screen bg-background-deep text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          {/* Settings and Admin pages could be added here */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
