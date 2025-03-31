import React, { useState, useEffect } from 'react';
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
import { Menu, ChevronDown, Home, Settings, FormInput, ListChecks, Palette } from 'lucide-react';
import { fetchMainMenus, fetchAllMenus } from '@/lib/api';
import { Menu as MenuType } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function MainSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  // Fetch all menus from the API để xử lý parent/child relationship
  const { data: menusData, isLoading, error } = useQuery({
    queryKey: ['/api/menus'],
    queryFn: async () => {
      try {
        const response = await fetchAllMenus();
        const allMenus = response.data.core_core_dynamic_menus || [];
        
        // Lọc các menu cha (parent_id là null)
        const parentMenus = allMenus.filter(menu => !menu.parent_id);
        
        // Thêm submenu vào mỗi menu cha
        return parentMenus.map(parentMenu => {
          // Tìm tất cả các menu con của menu cha hiện tại
          const childMenus = allMenus.filter(menu => menu.parent_id === parentMenu.id);
          return {
            ...parentMenu,
            core_dynamic_child_menus: childMenus // Thêm dưới định dạng cũ để tương thích với code hiện tại
          };
        });
      } catch (error) {
        console.error("Error fetching menus:", error);
        return [];
      }
    }
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Mobile Sidebar Trigger */}
        <div className="fixed z-20 top-4 left-4 lg:hidden">
          <SidebarTrigger>
            <Button size="icon" variant="outline" className="shadow-sm hover:bg-primary/10 transition-colors">
              <Menu className="size-4" />
            </Button>
          </SidebarTrigger>
        </div>

        {/* Sidebar */}
        <Sidebar className="z-10 border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8" />
                  <path d="M15 18h-5" />
                  <path d="M10 6h8v4h-8V6Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {t('app.shortTitle', 'Form Động')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t('app.version', 'v1.0.0')}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            {/* Built-in Navigation Links */}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/'}
                  className={`transition-all ${location === '/' ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'}`}
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
                  className={`transition-all ${location === '/forms' ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'}`}
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
                  className={`transition-all ${location === '/workflow' ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'}`}
                >
                  <Link href="/workflow">
                    <ListChecks className="size-4" />
                    <span>{t('app.nav.workflow', 'Workflow')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/design'}
                  className={`transition-all ${location === '/design' ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'}`}
                >
                  <Link href="/design">
                    <Palette className="size-4" />
                    <span>{t('app.nav.design', 'Hệ thống thiết kế')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-4" />

            {/* Dynamic Menus from API */}
            <SidebarGroupLabel className="text-xs font-semibold text-primary mb-2 px-3 flex items-center">
              <span className="w-1 h-1 bg-primary rounded-full mr-2 inline-block"></span>
              {t('app.sidebar.applications', 'Ứng dụng')}
            </SidebarGroupLabel>
            
            <SidebarMenu>
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('app.loading', 'Đang tải...')}
                </div>
              ) : error ? (
                <div className="p-4 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive m-2">
                  <div className="flex items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {t('app.error', 'Lỗi khi tải dữ liệu')}
                  </div>
                  <div className="text-xs text-destructive/80">
                    {t('app.errorRetry', 'Vui lòng thử lại sau.')}
                  </div>
                </div>
              ) : (
                menusData?.map((menu: MenuType) => (
                  <DynamicMenuItem key={menu.id} menu={menu} />
                ))
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t bg-muted/30 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === '/settings'}
                  className={`transition-all ${location === '/settings' ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'}`}
                >
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>{t('app.nav.settings', 'Cài đặt')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            
            <div className="px-3 py-2 mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <div>
                <span>{t('app.copyright', '© 2025 DynamicForm')}</span>
              </div>
              <div>
                <a href="#" className="text-primary hover:underline">
                  {t('app.help', 'Trợ giúp')}
                </a>
              </div>
            </div>
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
  const [location] = useLocation();
  const hasChildren = menu.core_dynamic_child_menus && menu.core_dynamic_child_menus.length > 0;

  // Kiểm tra xem có submenu đang được chọn không
  const hasActiveChild = menu.core_dynamic_child_menus?.some(
    subMenu => location === `/submission/${subMenu.workflow_id}` || 
               location === `/menu/${menu.id}/submenu/${subMenu.id}`
  );

  // Tự động mở menu có menu con đang được chọn
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [location, hasActiveChild]);
  
  if (!hasChildren) {
    const isActive = location === `/menu/${menu.id}`;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className={`transition-all ${
            isActive ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted'
          }`}
        >
          <Link href={`/menu/${menu.id}`}>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span>{menu.name}</span>
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary-foreground/70">
              {menu.code}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-all ${
          isOpen || hasActiveChild ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
        }`}
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          </svg>
        </div>
        <span>{menu.name}</span>
        {menu.code && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary-foreground/70">
            {menu.code}
          </span>
        )}
        <ChevronDown 
          className={`ml-auto size-4 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180 text-primary' : 'text-muted-foreground'
          }`} 
        />
      </SidebarMenuButton>

      {isOpen && menu.core_dynamic_child_menus && (
        <SidebarMenuSub className="animate-in slide-in-from-left-1 duration-200">
          {menu.core_dynamic_child_menus.map((subMenu) => {
            let href = "";
            // Xử lý đặc biệt cho tất cả các submenu, áp dụng cách xử lý giống như submenu khiếu nại
            if (subMenu.workflow_id) {
              href = `/submission/${subMenu.workflow_id}?menuId=${subMenu.id}`;
            } else {
              href = `/menu/${menu.id}/submenu/${subMenu.id}`;
            }
            const isActive = location === href || location.startsWith(`/submission/${subMenu.workflow_id}`);
            
            // Khi click vào submenu, sẽ gọi 2 API:
            // 1. API lấy data từ core_core_menu_records theo menu_id
            // 2. API lấy form VIEW từ core_core_dynamic_menu_forms theo menu_id
            const handleSubmenuClick = () => {
              // Xử lý đã được thực hiện trong component Submission thông qua menuId param
              console.log(`Navigating to submenu: ${subMenu.name}, ID: ${subMenu.id}, workflowId: ${subMenu.workflow_id}`);
            };
            
            return (
              <SidebarMenuSubButton
                key={subMenu.id}
                asChild
                className={`pl-9 flex items-center gap-2 transition-all ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                }`}
                onClick={handleSubmenuClick}
              >
                <Link href={href}>
                  {subMenu.workflow_id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
                      <path d="M2 13h10"></path>
                      <path d="m9 16 3-3-3-3"></path>
                    </svg>
                  )}
                  {subMenu.name}
                  {subMenu.code && (
                    <span className="ml-auto text-xs text-muted-foreground/70">{subMenu.code}</span>
                  )}
                </Link>
              </SidebarMenuSubButton>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}