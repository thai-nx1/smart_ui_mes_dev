import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/MainLayout";
import { MainSidebar } from "@/components/MainSidebar";
import Home from "@/pages/home";
import FormsPage from "@/pages/forms";
import WorkflowPage from "@/pages/workflow";
import SubmissionPage from "@/pages/submission";
import DesignExamplePage from "@/pages/design-example";
import RecordDetailPage from "@/pages/record-detail";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { InstallPWA } from "@/components/InstallPWA";
import React, { useEffect, useState } from "react";
import { setupInitialTheme } from "@/lib/theme";

// Component bảo vệ route yêu cầu đăng nhập
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) => {
  const [, setLocation] = useLocation();
  
  // Sử dụng một biến state giả để kiểm tra xác thực mà không cần hook
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // Redirect đến trang đăng nhập nếu chưa xác thực
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);
  
  // Render component nếu đã xác thực, ngược lại hiển thị loading
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }
  
  return <Component {...rest} />;
}

// Tách Router thành component riêng không sử dụng AuthContext
const RouterComponent = () => {
  // Sử dụng cách kiểm tra đơn giản thay vì useAuth hook
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" >
        {() => isAuthenticated ? <Home /> : <LoginPage />}
      </Route>
      <Route path="/forms">
        <ProtectedRoute component={FormsPage} />
      </Route>
      <Route path="/workflow">
        <ProtectedRoute component={WorkflowPage} />
      </Route>
      <Route path="/menu/:menuId" component={WorkflowPage} />
      <Route path="/menu/:menuId/submenu/:subMenuId" component={WorkflowPage} />
      <Route path="/submission/:workflowId" component={SubmissionPage} />
      <Route path="/record/:menuId/:recordId" component={RecordDetailPage} />
      <Route path="/record/:menuId/:recordId/workflow/:workflowId" component={RecordDetailPage} />
      
      <Route path="/design">
        <ProtectedRoute component={DesignExamplePage} />
      </Route>
      <Route>
        <ProtectedRoute component={NotFound} />
      </Route>
    </Switch>
  );
};

function AppContent() {
  // Kiểm tra trạng thái đăng nhập từ localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    // Kiểm tra token trong localStorage
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    
    // Setup theme và kiểm tra trạng thái đăng nhập
    setupInitialTheme();
    checkAuth();
    
    // Lắng nghe sự thay đổi của localStorage (khi đăng nhập/đăng xuất ở tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
      }
    };
    
    // Tạo event listener tùy chỉnh để thông báo thay đổi trạng thái đăng nhập
    const authChangeListener = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', authChangeListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', authChangeListener);
    };
  }, []);
  
  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  // Hiển thị nội dung chính với sidebar khi đã đăng nhập
  return (
    <>
      {isAuthenticated ? (
        <MainSidebar>
          <RouterComponent />
        </MainSidebar>
      ) : (
        <RouterComponent />
      )}
      <InstallPWA />
    </>
  );
}

// Wrapper component không sử dụng AuthContext
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
