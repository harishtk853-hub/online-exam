import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state
  const fetchCurrentUser = useCallback(async (jwtToken) => {
    if (!jwtToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data) {
      const { user: userData, token: jwtToken } = response.data;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (name, email, password, password_confirmation, role = 'student', institution_name = null, id_card_filename = null, id_card_mimetype = null, id_card_data = null) => {
    const payload = typeof name === 'object' 
      ? name 
      : { name, email, password, password_confirmation, role, institution_name, id_card_filename, id_card_mimetype, id_card_data };

    const response = await api.post('/auth/register', payload);
    if (response.success && response.data) {
      const { user: userData, token: jwtToken } = response.data;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  };

  const updateProfile = async (profileData) => {
    const response = await api.patch('/auth/profile', profileData);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Profile update failed');
  };

  const submitTeacherVerification = async (verificationData) => {
    const response = await api.post('/auth/teacher-verification', verificationData);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Verification submission failed');
  };

  const changePassword = async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    if (!response.success) {
      throw new Error(response.message || 'Password change failed');
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        submitTeacherVerification,
        changePassword,
        refreshUser: () => fetchCurrentUser(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
