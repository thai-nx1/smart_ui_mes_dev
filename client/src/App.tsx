import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/MainSidebar";
import Home from "@/pages/home";
import FormsPage from "@/pages/forms";
import WorkflowPage from "@/pages/workflow";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { setupInitialTheme } from "@/lib/theme";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/forms" component={FormsPage} />
      <Route path="/workflow" component={WorkflowPage} />
      <Route path="/menu/:menuId" component={WorkflowPage} />
      <Route path="/menu/:menuId/submenu/:subMenuId" component={WorkflowPage} />
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
