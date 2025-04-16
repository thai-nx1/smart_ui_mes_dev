import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarTriggerClose,
  useSidebar,
} from '@/components/ui/sidebar';
import { fetchAllMenus } from '@/lib/api';
import { Menu as MenuType } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { 
  Archive,
  Box,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  FileText, 
  Home, 
  Laptop,
  Layers,
  Loader2, 
  Menu, 
  Moon, 
  Package,
  Search, 
  Settings, 
  Shield,
  Sun, 
  LayoutGrid,
  X 
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
// import { useTranslation } from 'react-i18next';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScreenSize } from '@/hooks/use-mobile';
import { themeManager } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function MainSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const screenSize = useScreenSize(); // Sử dụng hook để lấy kích thước màn hình hiện tại
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themeManager.getTheme());
  
  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((themeSettings) => {
      setCurrentTheme(themeSettings);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Toggle menu expand/collapse
  const toggleMenu = (menuId: string) => {
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId));
    } else {
      setExpandedMenus([...expandedMenus, menuId]);
    }
  };
  
  // Fetch all menus from the API để xử lý parent/child relationship đa cấp
  // Thêm retry và staleTime để đảm bảo dữ liệu luôn hiển thị sau khi mount
  const { data: menusData, isLoading, error } = useQuery({
    queryKey: ['/api/menus'],
    queryFn: async () => {
      try {
        // Hiển thị log rõ ràng hơn
        console.log("Fetching menus for sidebar...");
        const response = await fetchAllMenus();
        const allMenusFromAPI = response.data.core_core_dynamic_menus || [];
        
        // Lọc các menu có status là "active"
        const allMenus = allMenusFromAPI.filter((menu:any) => menu.status === 'active');
        console.log("Fetched", allMenusFromAPI.length, "menus from API, filtered to", allMenus.length, "active menus");
        
        // Hàm đệ quy để xây dựng cây menu nhiều cấp
        const buildMenuTree = (menuItems: any[], parentId: string | null = null): MenuType[] => {
          return menuItems
            .filter(item => item.parent_id === parentId)
            .map(item => {
              // Tìm tất cả các menu con
              const children = buildMenuTree(menuItems, item.id);
              // Log số lượng menu con
              if (children.length > 0) {
                console.log(`Menu '${item.name}' has ${children.length} child menus`);
              }
              
              // Trả về menu với các con đã được xây dựng đệ quy
              return {
                ...item,
                core_dynamic_child_menus: children.length > 0 ? children : undefined
              };
            });
        };
        
        // Xây dựng cây menu đa cấp từ menu gốc (parent_id = null)
        const menuTree = buildMenuTree(allMenus);
        console.log("Found", menuTree.length, "active parent menus");
        
        return menuTree;
      } catch (error) {
        console.error("Error fetching menus:", error);
        return [];
      }
    },
    retry: 1,
    staleTime: 60 * 1000, // 1 phút
    refetchOnMount: true
  });

  // Lấy cài đặt mặc định cho SidebarProvider dựa trên kích thước màn hình
  const isDesktopOrTablet = screenSize === 'desktop' || screenSize === 'tablet';
  const isMobile = screenSize === 'mobile';
  const defaultOpen = true; // Luôn mở mặc định (không phụ thuộc kích thước màn hình)
  
  // Sử dụng CSS từ file sidebar-fix.css trong một class
  const containerClass = isDesktopOrTablet 
    ? "flex min-h-screen sidebar-desktop-container" 
    : "flex min-h-screen";

  // Hàm tìm kiếm menu dựa trên từ khóa
  const searchMenus = (menus: MenuType[] = [], query: string = '') => {
    if (!query.trim() || !menus?.length) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Tìm kiếm trong menu cha
    const matchingParentMenus = menus.filter(menu => 
      menu.name.toLowerCase().includes(normalizedQuery) || 
      (menu.code && menu.code.toLowerCase().includes(normalizedQuery))
    );
    
    // Tìm kiếm trong menu con
    const matchingChildMenus = menus.flatMap(menu => {
      if (!menu.core_dynamic_child_menus?.length) return [];
      
      const matchingChildren = menu.core_dynamic_child_menus.filter(childMenu => 
        childMenu.name.toLowerCase().includes(normalizedQuery) || 
        (childMenu.code && childMenu.code.toLowerCase().includes(normalizedQuery))
      );
      
      if (matchingChildren.length > 0) {
        // Trả về menu cha kèm theo các menu con phù hợp
        return [{
          ...menu,
          core_dynamic_child_menus: matchingChildren,
          _isParentOfMatch: true // Đánh dấu là cha của menu con phù hợp
        }];
      }
      
      return [];
    });
    
    // Kết hợp kết quả, ưu tiên menu cha trùng khớp trước
    return [...matchingParentMenus, ...matchingChildMenus].filter((menu, index, self) => 
      // Loại bỏ menu trùng lặp
      index === self.findIndex(m => m.id === menu.id)
    );
  };
  
  // Kết quả tìm kiếm menu
  const searchResults = searchQuery.trim() 
    ? searchMenus(menusData, searchQuery) 
    : [];
    
  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };
  
  // Xoá tìm kiếm
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={containerClass + ' h-screen flex items-start justify-start overflow-auto'}>
        {/* Mobile Sidebar Trigger - Chỉ hiển thị trên mobile */}
        <div className="fixed top-4 left-4 lg:hidden z-[9999] p-[5px]">
          <SidebarTrigger>
            <Button 
              size="icon" className="shadow-sm hover:bg-primary/10 transition-colors"
              variant="ghost">
                <Menu className="h-5 w-5" />
            </Button>
          </SidebarTrigger>
        </div>

        {/* Sidebar - Bắt buộc always open trên desktop, dark theme cho cả desktop và mobile */}
        <Sidebar 
          className="h-screen flex flex-col items-center justify-start overflow-auto z-10 border-r border-slate-800 bg-slate-900 text-gray-300"
          collapsible={isDesktopOrTablet ? 'none' : 'offcanvas'} // none: không thể đóng trên desktop/tablet
        >
          <SidebarHeader className="p-4 border-b border-slate-800">
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center h-9 w-9 rounded-md bg-transparent">
                <img src="/icons/app-icon.svg" alt="logo" className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {t('app.shortTitle', 'Form Động')}
                </h1>
                <p className="text-xs text-gray-400">
                  {t('app.version', 'v1.0.0')}
                </p>
              </div>
              {/* Chỉ hiển thị nút đóng trên mobile */}
              <div className="ml-auto lg:hidden text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800" >
                <SidebarTriggerClose>
                  <X className="h-5 w-5" />
                </SidebarTriggerClose>
              </div>
            </div>
            
            {/* Thanh tìm kiếm menu */}
            <div className="mt-3 relative search-box-container">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('menu.search', 'Tìm kiếm menu...')}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9 pr-8 py-1.5 h-9 text-sm bg-slate-800 border-slate-700 text-gray-300 focus-visible:ring-cyan-500 oxii-transition"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center oxii-transition"
                  >
                    <X className="h-3 w-3 text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4 flex-1 overflow-auto none-scroll">
            <SidebarGroup>
              <div className="text-xs uppercase font-semibold text-cyan-400 mb-2 px-3 flex items-center">
                <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2 inline-block"></span>
                {t('app.sidebar.applications', 'Ứng dụng')}
              </div>
              
              <SidebarMenu>
                {/* Home Menu Item */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    onClick={() => {
                      // Đóng sidebar trên thiết bị di động sau khi click
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          try {
                            // Sử dụng cách tiếp cận đóng trực tiếp sidebar
                            const sidebar = document.querySelector('[data-sidebar-content]');
                            if (sidebar) {
                              sidebar.setAttribute('data-sidebar-opened', 'false');
                              // Cũng remove overlay nếu có
                              const overlay = document.getElementById('sidebar-overlay');
                              if (overlay) {
                                overlay.classList.add('animate-out', 'fade-out-0');
                                setTimeout(() => {
                                  try {
                                    overlay.remove();
                                  } catch (err) {
                                    console.error('Error removing overlay in home click:', err);
                                  }
                                }, 200);
                              }
                            }
                          } catch (err) {
                            console.error('Error closing sidebar in home click:', err);
                            // Fallback - cố gắng loại bỏ overlay
                            try {
                              const overlay = document.getElementById('sidebar-overlay');
                              if (overlay) overlay.remove(); 
                            } catch (e) {}
                          }
                        }, 100);
                      }
                    }}
                    className={`transition-all whitespace-normal ${
                      location === '/' ? 'bg-cyan-900 text-cyan-500 font-medium' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Link href="/" className="w-full flex items-center">
                      <Home className="size-4 mr-2 flex-shrink-0" />
                      <span className="min-w-0 flex-1 whitespace-normal overflow-hidden text-ellipsis leading-tight">
                        {t('app.home', 'Trang chủ')}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Divider sau trang chủ */}
                <div className="my-2 border-t border-slate-800/50"></div>
                
                {/* Dynamic Menu Items */}
                {isLoading ? (
                  <div className="p-4 text-sm text-gray-400 flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading.title', 'Đang tải...')}
                  </div>
                ) : menusData?.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">{t('menu.noItems', 'Không có menu nào')}</div>
                ) : showSearchResults && searchQuery ? (
                  // Hiển thị kết quả tìm kiếm
                  <>
                    <div className="text-xs font-medium text-gray-300 mb-2 px-2 py-1 flex items-center justify-between bg-slate-800 rounded">
                      <div className="flex items-center">
                        <Search className="h-3 w-3 mr-1.5" />
                        {t('menu.searchResults', 'Kết quả tìm kiếm')} ({searchResults.length})
                      </div>
                      <button 
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        {t('menu.noSearchResults', 'Không tìm thấy kết quả nào cho "{{query}}"', { query: searchQuery })}
                      </div>
                    ) : (
                      <div className="search-results-container py-1 pl-1 pr-1.5">
                        {searchResults.map((menu: MenuType) => (
                          <DynamicMenuItem key={menu.id} menu={menu} />
                        ))}
                      </div>
                    )}
                    
                    <div className="my-2 border-t border-slate-800/50"></div>
                    <div className="text-xs text-gray-400 mb-2 px-2">
                      {t('menu.allMenus', 'Tất cả các menu')}
                    </div>
                  </>
                ) : (
                  // Hiển thị menu bình thường
                  menusData?.map((menu: MenuType) => (
                    <DynamicMenuItem key={menu.id} menu={menu} />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <div className="border-t border-slate-700 bg-slate-800/50 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThemeDialog(true)}
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <Sun className="h-4 w-4 mr-2" />
              <span>{t('theme.title', 'Giao diện')}</span>
            </Button>
          </div>
        </Sidebar>

        {/* Main Content */}
        <div className="h-screen flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Hộp thoại chủ đề */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {t('theme.dialog.title', 'Thiết lập giao diện')}
            </DialogTitle>
            <DialogDescription>
              {t('theme.dialog.description', 'Tùy chỉnh giao diện theo sở thích của bạn.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('theme.mode', 'Chế độ hiển thị')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'light' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'light' && "border-primary bg-primary/5"
                  )}
                >
                  <Sun className="h-5 w-5" />
                  <span>{t('theme.light', 'Sáng')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'dark' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'dark' && "border-primary bg-primary/5"
                  )}
                >
                  <Moon className="h-5 w-5" />
                  <span>{t('theme.dark', 'Tối')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ theme: 'system' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.theme === 'system' && "border-primary bg-primary/5"
                  )}
                >
                  <Laptop className="h-5 w-5" />
                  <span>{t('theme.system', 'Tự động')}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('theme.style', 'Phong cách')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'professional' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'professional' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-primary rounded-md"></div>
                  </div>
                  <span>{t('theme.professional', 'Tiêu chuẩn')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'tint' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'tint' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-primary/20 rounded-md border border-primary"></div>
                  </div>
                  <span>{t('theme.tint', 'Màu nhẹ')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    themeManager.setTheme({ themeStyle: 'vibrant' });
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-auto py-3",
                    currentTheme.themeStyle === 'vibrant' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="size-5 flex items-center justify-center">
                    <div className="size-4 bg-gradient-to-br from-primary to-blue-400 rounded-md"></div>
                  </div>
                  <span>{t('theme.vibrant', 'Nổi bật')}</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>{t('common.done', 'Hoàn tất')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

// Chúng ta sẽ không sử dụng useOverlay hook nữa
// Mà thay vào đó, xử lý trực tiếp trong các sự kiện click

// Dynamic Menu Item Component - Hỗ trợ đa cấp thông qua tham số level
function DynamicMenuItem({ menu, level = 0 }: { menu: MenuType, level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const hasChildren = menu.core_dynamic_child_menus && menu.core_dynamic_child_menus.length > 0;
  const screenSize = useScreenSize(); 
  const isDesktopOrTablet = screenSize === 'desktop' || screenSize === 'tablet';
  const {toggleSidebar} = useSidebar()

  // Kiểm tra xem có submenu đang được chọn không - hỗ trợ đệ quy đa cấp
  const checkForActiveChild = (items: MenuType[] = []): boolean => {
    return items.some(item => {
      // Kiểm tra menu con này có được chọn không
      const isActive = location === `/submission/${item.workflow_id}` || 
                      location === `/menu/${item.id}` ||
                      location === `/menu/${menu.id}/submenu/${item.id}`;
                      
      // Nếu menu con này có menu con khác, kiểm tra đệ quy
      if (item.core_dynamic_child_menus?.length) {
        return isActive || checkForActiveChild(item.core_dynamic_child_menus);
      }
      
      return isActive;
    });
  };
  
  const hasActiveChild = checkForActiveChild(menu.core_dynamic_child_menus);

  // Tự động mở menu có menu con đang được chọn
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [location, hasActiveChild]);
  
  // Xử lý đóng sidebar khi click vào menu trên thiết bị di động
  const handleMobileMenuClick = () => {
    if (window.innerWidth < 1024) { // 1024px là điểm ngắt cho lg (large) trong Tailwind
      setTimeout(() => {
        try {
          // Sử dụng cách tiếp cận đóng trực tiếp sidebar
          const sidebar = document.querySelector('[data-sidebar-content]');
          if (sidebar) {
            sidebar.setAttribute('data-sidebar-opened', 'false');
            // Cũng remove overlay nếu có
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
              overlay.classList.add('animate-out', 'fade-out-0');
              setTimeout(() => {
                try {
                  overlay.remove();
                } catch (err) {
                  console.error('Error removing overlay in menu click:', err);
                }
              }, 200);
            }
          }
        } catch (err) {
          console.error('Error closing sidebar in menu click:', err);
          // Fallback - cố gắng loại bỏ overlay
          try {
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) overlay.remove();
          } catch (e) {}
        }
      }, 100);
    }
  };
  
  // Import lucide icons cho từng loại menu
  const getMenuIcon = () => {
    // Nếu là menu con (cấp 2 trở lên), không hiển thị icon
    if (level > 0) {
      return null;
    }
    
    // Từ danh sách icon được cung cấp
    // Tìm icon phù hợp dựa trên tên menu
    const menuName = menu.name.toLowerCase();
    
    if (menuName.includes('tox')) {
      return <Box className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('vật tư') || menuName.includes('sản phẩm')) {
      return <Package className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('kế hoạch')) {
      return <Calendar className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('phê duyệt')) {
      return <CheckCircle className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('khuôn') || menuName.includes('mẫu')) {
      return <Layers className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('chất lượng') || menuName.includes('qc')) {
      return <Shield className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('thiết bị')) {
      return <Settings className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('warehouse') || menuName.includes('kho')) {
      return <Archive className="size-4 mr-2 flex-shrink-0" />;
    } else if (menuName.includes('form')) {
      return <Clipboard className="size-4 mr-2 flex-shrink-0" />;
    } else {
      // Icon mặc định cho các menu khác
      return <FileText className="size-4 mr-2 flex-shrink-0" />;
    }
  };

  const menuIcon = getMenuIcon();
  
  if (!hasChildren) {
    const isActive = location === `/menu/${menu.id}`;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          onClick={()=>{
            handleMobileMenuClick()
            toggleSidebar()
          }}
          className={`transition-all whitespace-normal ${
            isActive 
              ? 'bg-cyan-900 text-cyan-500 font-medium' 
              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Link href={`/menu/${menu.id}`} className="w-full flex items-center">
            {menuIcon}
            {/* Menu con không có icon (sử dụng left padding tăng dần) */}
            {!menuIcon && level > 0 && (
              <div className="w-4 ml-2"></div>
            )}
            <span className="min-w-0 flex-1 overflow-hidden break-words hyphens-auto leading-tight">
              {menu.name}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Kiểm tra xem chính menu cha này có được chọn không
  const isParentActive = location === `/menu/${menu.id}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => {
          setIsOpen(!isOpen)
          handleMobileMenuClick()
        }}
        className={`transition-all whitespace-normal relative ${
          isParentActive 
            ? 'bg-cyan-900 text-cyan-500 font-medium' 
            : hasActiveChild 
              ? 'text-gray-400 hover:bg-slate-800 hover:text-white' 
              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {menuIcon}
        {/* Menu con không có icon (sử dụng left padding tăng dần) */}
        {!menuIcon && level > 0 && (
          <div className="w-4 ml-2"></div>
        )}
        <span className="text-sm min-w-0 flex-1 overflow-hidden break-words hyphens-auto leading-tight">
          {menu.name}
        </span>
        
        {/* Thêm dấu mũi tên chỉ trạng thái mở/đóng của menu cha */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isOpen ? (
            <ChevronDown className="size-3.5 opacity-60" />
          ) : (
            <ChevronRight className="size-3.5 opacity-60" />
          )}
        </div>
      </SidebarMenuButton>

      {isOpen && menu.core_dynamic_child_menus && (
        <SidebarMenuSub className="animate-in slide-in-from-left-1 duration-200 pl-2 border-l-2 border-slate-700">
          {menu.core_dynamic_child_menus.map((subMenu: MenuType) => (
            // Gọi đệ quy DynamicMenuItem cho menu con, tăng cấp độ lên 1
            <DynamicMenuItem key={subMenu.id} menu={subMenu} level={level + 1} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}