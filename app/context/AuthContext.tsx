'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('contactChronicle_user');
    const savedSession = localStorage.getItem('contactChronicle_session');
    
    if (savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('contactChronicle_user');
        localStorage.removeItem('contactChronicle_session');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Get all registered users
    const users = JSON.parse(localStorage.getItem('contactChronicle_users') || '[]');
    
    // Find user by email
    const foundUser = users.find((u: User & { password: string }) => u.email === email);
    
    if (!foundUser) {
      return false;
    }

    // Simple password check (in production, use proper hashing)
    if (foundUser.password !== password) {
      return false;
    }

    // Create user object without password
    const { password: _, ...userWithoutPassword } = foundUser;
    const user: User = userWithoutPassword;

    // Set session
    setUser(user);
    localStorage.setItem('contactChronicle_user', JSON.stringify(user));
    localStorage.setItem('contactChronicle_session', 'true');

    return true;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Get all registered users
    const users = JSON.parse(localStorage.getItem('contactChronicle_users') || '[]');
    
    // Check if email already exists
    if (users.some((u: User & { password: string }) => u.email === email)) {
      return false;
    }

    // Create new user
    const newUser: User & { password: string } = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password, // In production, hash this password
      createdAt: new Date().toISOString(),
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('contactChronicle_users', JSON.stringify(users));

    // Auto-login after registration
    const { password: _, ...userWithoutPassword } = newUser;
    const user: User = userWithoutPassword;

    setUser(user);
    localStorage.setItem('contactChronicle_user', JSON.stringify(user));
    localStorage.setItem('contactChronicle_session', 'true');

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('contactChronicle_user');
    localStorage.removeItem('contactChronicle_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

