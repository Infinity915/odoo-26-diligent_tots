import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('transitops_token');
    const storedUser = localStorage.getItem('transitops_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: apiUser } = response.data;
      
      const userData = { email, role: apiUser.role };
      
      localStorage.setItem('transitops_token', token);
      localStorage.setItem('transitops_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      return { 
        success: false, 
        error: error.response?.data?.error?.details || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    setUser(null);
    window.location.href = '/login';
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await api.post('/auth/google', { token: googleToken });
      const { token, userData: apiUser } = response.data.data;
      
      const userData = { email: apiUser.email, role: apiUser.role };
      
      localStorage.setItem('transitops_token', token);
      localStorage.setItem('transitops_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Google SSO failed", error);
      return { 
        success: false, 
        error: error.response?.data?.error?.details || error.response?.data?.error || 'SSO Login failed' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
