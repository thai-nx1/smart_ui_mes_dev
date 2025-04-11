import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/MainLayout";
import { MainSidebar } from "@/components/MainSidebar";
import { CameraPermission } from "@/components/CameraPermission";
import { PwaOfflineAlert } from "@/components/PwaOfflineAlert";
import { RequireAuth } from "@/components/RequireAuth";
import Home from "@/pages/home";
import FormsPage from "@/pages/forms";
import WorkflowPage from "@/pages/workflow";
import SubmissionPage from "@/pages/submission";
import SubmissionCreatePage from "@/pages/submission-create";
import DesignExamplePage from "@/pages/design-example";
import RecordDetailPage from "@/pages/record-detail";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { setupInitialTheme } from "@/lib/theme";

// Wrapper components với RequireAuth
const ProtectedHome = () => (
  <RequireAuth>
    <Home />
  </RequireAuth>
);

const ProtectedFormsPage = () => (
  <RequireAuth>
    <FormsPage />
  </RequireAuth>
);

const ProtectedWorkflowPage = () => (
  <RequireAuth>
    <WorkflowPage />
  </RequireAuth>
);

const ProtectedSubmissionPage = () => (
  <RequireAuth>
    <SubmissionPage />
  </RequireAuth>
);

const ProtectedSubmissionCreatePage = () => (
  <RequireAuth>
    <SubmissionCreatePage />
  </RequireAuth>
);

const ProtectedRecordDetailPage = () => (
  <RequireAuth>
    <RecordDetailPage />
  </RequireAuth>
);

const ProtectedDesignExamplePage = () => (
  <RequireAuth>
    <DesignExamplePage />
  </RequireAuth>
);

const ProtectedNotFound = () => (
  <RequireAuth>
    <NotFound />
  </RequireAuth>
);

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Các route được bảo vệ */}
      <Route path="/" component={ProtectedHome} />
      <Route path="/forms" component={ProtectedFormsPage} />
      <Route path="/workflow" component={ProtectedWorkflowPage} />
      <Route path="/menu/:menuId" component={ProtectedWorkflowPage} />
      <Route path="/menu/:menuId/submenu/:subMenuId" component={ProtectedWorkflowPage} />
      <Route path="/submission/:workflowId" component={ProtectedSubmissionPage} />
      <Route path="/submission/:workflowId/create" component={ProtectedSubmissionCreatePage} />
      <Route path="/record/:menuId/:recordId" component={ProtectedRecordDetailPage} />
      <Route path="/record/:menuId/:recordId/workflow/:workflowId" component={ProtectedRecordDetailPage} />
      <Route path="/design" component={ProtectedDesignExamplePage} />
      <Route component={ProtectedNotFound} />
    </Switch>
  );
}

function App() {
  // Setup theme on initial render
  useEffect(() => {
    setupInitialTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MainSidebar>
        <Router />
      </MainSidebar>
      <CameraPermission />
      <PwaOfflineAlert />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
