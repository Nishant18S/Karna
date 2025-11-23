import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Admin } from '../types';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: User | Admin, isAdminUser?: boolean) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const userSessionId = localStorage.getItem('userSessionId');
    const adminSessionId = localStorage.getItem('adminSessionId');
    const userData = localStorage.getItem('userData');
    const adminData = localStorage.getItem('adminData');

    if (userSessionId && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userSessionId');
        localStorage.removeItem('userData');
      }
    }

    if (adminSessionId && adminData) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('adminSessionId');
        localStorage.removeItem('adminData');
      }
    }

    setLoading(false);
  }, []);

  const login = (userData: User | Admin, isAdminUser = false) => {
    if (isAdminUser) {
      setAdmin(userData as Admin);
      localStorage.setItem('adminSessionId', Date.now().toString());
      localStorage.setItem('adminData', JSON.stringify(userData));
    } else {
      setUser(userData as User);
      localStorage.setItem('userSessionId', Date.now().toString());
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem('userSessionId');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('adminData');
  };

  const value = {
    user,
    admin,
    isAuthenticated: !!(user || admin),
    isAdmin: !!admin,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}