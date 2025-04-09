/**
 * Đây là phiên bản đơn giản của AuthContext
 * Để tránh lỗi React hooks, chúng ta chỉ cung cấp các utility functions
 * thay vì sử dụng React Context và Hooks
 */

import { useEffect } from 'react';

export interface User {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
}

const AUTH_CHANGE_EVENT = 'auth-change';

// Utility functions thay thế việc sử dụng context
export const AuthUtils = {
  /**
   * Lấy thông tin người dùng từ localStorage
   */
  getUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  /**
   * Đăng nhập người dùng
   */
  login: (token: string, userData: User): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Kích hoạt sự kiện thay đổi trạng thái xác thực
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  },

  /**
   * Đăng xuất người dùng
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Kích hoạt sự kiện thay đổi trạng thái xác thực
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

/**
 * Hook theo dõi sự thay đổi trạng thái xác thực
 * Sử dụng hook này trong các components cần cập nhật khi đăng nhập/đăng xuất
 */
export function useAuthChangeListener(callback: () => void) {
  useEffect(() => {
    // Thêm event listener
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    
    // Cleanup
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
  }, [callback]);
}

// Export một hàm giả useAuth để tránh lỗi cho code cũ sử dụng hook này
export function useAuth() {
  return {
    user: AuthUtils.getUser(),
    isAuthenticated: AuthUtils.isAuthenticated(),
    loading: false,
    login: AuthUtils.login,
    logout: AuthUtils.logout
  };
}