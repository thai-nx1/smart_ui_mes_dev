import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/MainLayout";
import { MainSidebar } from "@/components/MainSidebar";
import { CameraPermission } from "@/components/CameraPermission";
import { PwaOfflineAlert } from "@/components/PwaOfflineAlert";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forms" component={FormsPage} />
      <Route path="/workflow" component={WorkflowPage} />
      <Route path="/menu/:menuId" component={WorkflowPage} />
      <Route path="/menu/:menuId/submenu/:subMenuId" component={WorkflowPage} />
      <Route path="/submission/:workflowId" component={SubmissionPage} />
      <Route path="/submission/:workflowId/create" component={SubmissionCreatePage} />
      <Route path="/record/:menuId/:recordId" component={RecordDetailPage} />
      <Route path="/record/:menuId/:recordId/workflow/:workflowId" component={RecordDetailPage} />
      <Route path="/design" component={DesignExamplePage} />
      <Route component={NotFound} />
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
