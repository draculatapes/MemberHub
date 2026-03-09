import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PaymentPage from './pages/PaymentPage';
import CertificatePage from './pages/CertificatePage';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Configure axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_status');
    localStorage.removeItem('user_name');
    setIsAuthenticated(false);
  };

  const userRole = localStorage.getItem('user_role');

  return (
    <Router>
      {isAuthenticated && <Navbar onLogout={handleLogout} />}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
          }
        />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
          {/* Dashboard — role-based */}
          <Route
            path="/dashboard"
            element={userRole === 'admin' ? <AdminDashboardPage /> : <UserDashboardPage />}
          />

          {/* Admin-only routes */}
          <Route path="/members" element={<AdminRoute><MembersPage /></AdminRoute>} />
          <Route path="/members/:id" element={<AdminRoute><MemberDetailPage /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />

          {/* User routes */}
          <Route path="/payment/:memberId" element={<PaymentPage />} />
          <Route path="/certificate/:memberId" element={<CertificatePage />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
