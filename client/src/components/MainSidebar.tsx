import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu, ChevronDown, Home, Settings, FormInput, ListChecks } from 'lucide-react';
import { fetchMainMenus } from '@/lib/api';
import { Menu as MenuType } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CreateIncidentButton } from '@/components/CreateIncidentButton';

export function MainSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  // Fetch menus from the API
  const { data: menusData, isLoading, error } = useQuery({
    queryKey: ['/api/menus'],
    queryFn: async () => {
      const response = await fetchMainMenus();
      return response.data.core_core_dynamic_menus;
    }
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Mobile Sidebar Trigger */}
        <div className="fixed z-20 top-4 left-4 lg:hidden">
          <SidebarTrigger>
            <Button size="icon" variant="outline">
              <Menu className="size-4" />
            </Button>
          </SidebarTrigger>
        </div>

        {/* Sidebar */}
        <Sidebar className="z-10 border-r border-border">
          <SidebarHeader className="p-2">
            <div className="flex items-center">
              <div className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8" />
                  <path d="M15 18h-5" />
                  <path d="M10 6h8v4h-8V6Z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold">
                {t('app.shortTitle', 'Form Động')}
              </h1>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {/* Built-in Navigation Links */}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/'}
                >
                  <Link href="/">
                    <Home className="size-4" />
                    <span>{t('app.nav.home', 'Trang chủ')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/forms'}
                >
                  <Link href="/forms">
                    <FormInput className="size-4" />
                    <span>{t('app.nav.forms', 'Quản lý Form')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/workflow'}
                >
                  <Link href="/workflow">
                    <ListChecks className="size-4" />
                    <span>{t('app.nav.workflow', 'Workflow')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator />

            {/* Dynamic Menus from API */}
            <SidebarGroupLabel>
              {t('app.sidebar.applications', 'Ứng dụng')}
            </SidebarGroupLabel>
            <SidebarMenu>
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">
                  {t('app.loading', 'Đang tải...')}
                </div>
              ) : error ? (
                <div className="p-2 text-sm text-destructive">
                  {t('app.error', 'Lỗi khi tải dữ liệu')}
                </div>
              ) : (
                menusData?.map((menu: MenuType) => (
                  <DynamicMenuItem key={menu.id} menu={menu} />
                ))
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/settings'}
                >
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>{t('app.nav.settings', 'Cài đặt')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Dynamic Menu Item Component
function DynamicMenuItem({ menu }: { menu: MenuType }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = menu.core_dynamic_child_menus && menu.core_dynamic_child_menus.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
        >
          <Link href={`/menu/${menu.id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>{menu.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
        <span>{menu.name}</span>
        <ChevronDown className={`ml-auto size-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </SidebarMenuButton>

      {isOpen && menu.core_dynamic_child_menus && (
        <SidebarMenuSub>
          {menu.core_dynamic_child_menus.map((subMenu) => (
            <div key={subMenu.id} className="flex flex-col">
              <SidebarMenuSubButton asChild>
                {subMenu.workflow_id ? (
                  <Link href={`/submission/${subMenu.workflow_id}`}>
                    {subMenu.name}
                  </Link>
                ) : (
                  <Link href={`/menu/${menu.id}/submenu/${subMenu.id}`}>
                    {subMenu.name}
                  </Link>
                )}
              </SidebarMenuSubButton>
              
              {/* Thêm nút tạo sự vụ nếu submenu có workflow_id */}
              {subMenu.workflow_id && (
                <div className="ml-7 mt-1 mb-2">
                  <CreateIncidentButton 
                    submenuId={subMenu.id}
                    submenuName={subMenu.name}
                    submenuWorkflowId={subMenu.workflow_id}
                    className="w-full text-xs py-1 px-2 h-auto"
                  />
                </div>
              )}
            </div>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}