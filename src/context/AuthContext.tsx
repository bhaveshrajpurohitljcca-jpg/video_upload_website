'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/utils/db';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<any>;
  registerStudent: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const u = await db.getCurrentUser();
      setUser(u);
    } catch (err) {
      console.error('Failed to get current user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, passwordHash: string) => {
    setLoading(true);
    try {
      const loggedUser = await db.login(email, passwordHash);
      const currentUser = await db.getCurrentUser();
      setUser(currentUser);
      return loggedUser;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const registerStudent = async (data: any) => {
    setLoading(true);
    try {
      const regUser = await db.registerStudent(data);
      const currentUser = await db.getCurrentUser();
      setUser(currentUser);
      return regUser;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    await db.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerStudent, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
