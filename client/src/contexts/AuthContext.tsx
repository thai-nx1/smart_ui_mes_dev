import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data', error);
          await logout();
        }
      }
      
      // Kiểm tra trạng thái xác thực với server
      try {
        const response = await apiRequest('/api/auth/status', {
          method: 'GET',
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : undefined
        });
        
        if (response && response.authenticated) {
          setUser(response.user);
        } else {
          // Xóa thông tin đăng nhập nếu server không xác nhận
          await logout(false);
        }
      } catch (error) {
        console.error('Auth status check failed', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async (callApi = true) => {
    if (callApi) {
      try {
        await apiRequest('/api/logout', { 
          method: 'GET' 
        });
      } catch (error) {
        console.error('Logout error', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}