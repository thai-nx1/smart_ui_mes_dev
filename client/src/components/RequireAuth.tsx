import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { isAuthenticated } from '@/lib/auth';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Kiểm tra xác thực
    const authenticated = isAuthenticated();
    
    if (!authenticated) {
      // Lưu đường dẫn hiện tại để chuyển hướng sau khi đăng nhập
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Chuyển hướng đến trang đăng nhập
      setLocation('/login');
    } else {
      setAuthorized(true);
    }
    
    setLoading(false);
  }, [setLocation]);

  // Hiển thị trạng thái loading hoặc nội dung khi đã xác thực
  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : authorized ? (
        children
      ) : null}
    </>
  );
}