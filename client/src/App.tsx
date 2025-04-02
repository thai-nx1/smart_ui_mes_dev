import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/MainSidebar";
import Home from "@/pages/home";
import FormsPage from "@/pages/forms";
import WorkflowPage from "@/pages/workflow";
import SubmissionPage from "@/pages/submission";
import DesignExamplePage from "@/pages/design-example";
import RecordDetailPage from "@/pages/record-detail";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { setupInitialTheme } from "@/lib/theme";

function Router() {
  return (
    <Switch>
      {/* Chuyển hướng trực tiếp từ trang chủ vào trang submission với workflow Phê duyệt tài chính */}
      <Route path="/" component={() => {
        // Chuyển hướng tới trang submission với ID workflow phê duyệt tài chính 
        // và menuId của Phê duyệt tài chính
        window.location.href = "/submission/466db422-5dc8-4de2-a963-4c8fce12e4ff?menuId=81a0d5df-57b8-49ec-8514-6d6761b5c3c5";
        return null;
      }} />
      <Route path="/forms" component={FormsPage} />
      <Route path="/workflow" component={WorkflowPage} />
      <Route path="/menu/:menuId" component={WorkflowPage} />
      <Route path="/menu/:menuId/submenu/:subMenuId" component={WorkflowPage} />
      <Route path="/submission/:workflowId" component={SubmissionPage} />
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
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
