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
import { useEffect } from "react";
import { setupInitialTheme } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Component bảo vệ route yêu cầu đăng nhập
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Kiểm tra nếu đang trong quá trình kiểm tra xác thực
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }
  
  // Redirect đến trang đăng nhập nếu chưa xác thực
  if (!isAuthenticated) {
    useEffect(() => {
      setLocation('/login');
    }, [setLocation]);
    return null;
  }
  
  // Render component nếu đã xác thực
  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        {isAuthenticated ? <Home /> : <LoginPage />}
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
}

function AppContent() {
  // Chỉ hiển thị sidebar khi đã đăng nhập
  const { isAuthenticated, loading } = useAuth();
  
  // Setup theme on initial render
  useEffect(() => {
    setupInitialTheme();
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
  
  // Hiển thị trang đăng nhập khi chưa đăng nhập
  if (!isAuthenticated && window.location.pathname !== '/login') {
    return <Router />;
  }
  
  // Hiển thị nội dung chính với sidebar khi đã đăng nhập
  return (
    <>
      {isAuthenticated ? (
        <MainSidebar>
          <Router />
        </MainSidebar>
      ) : (
        <Router />
      )}
      <InstallPWA />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
