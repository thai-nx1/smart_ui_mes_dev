import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Home, X } from 'lucide-react';
import { fetchAllMenus } from '@/lib/api';
import { Menu as MenuType } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface MenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuSidebar({ isOpen, onClose }: MenuSidebarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // Fetch menus from API
  const { data: menusData, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      console.log('Fetching all menus for mobile sidebar...');
      const response = await fetchAllMenus();
      
      // Lọc các menu với status='active'
      if (response && response.data && response.data.core_core_dynamic_menus) {
        const allMenus = response.data.core_core_dynamic_menus;
        const activeMenus = allMenus.filter((menu: MenuType) => menu.status === 'active');
        return activeMenus;
      }
      return [];
    },
  });

  // Toggle menu expand/collapse
  const toggleMenu = (menuId: string) => {
    if (expandedMenus.includes(menuId)) {
      setExpandedMenus(expandedMenus.filter(id => id !== menuId));
    } else {
      setExpandedMenus([...expandedMenus, menuId]);
    }
  };

  // Filter parent menus (menus without parent_id or with null parent_id)
  const parentMenus = menusData?.filter((menu: MenuType) => !menu.parent_id);

  // Get child menus for a parent menu
  const getChildMenus = (parentId: string) => {
    return menusData?.filter((menu: MenuType) => menu.parent_id === parentId);
  };

  // Close when clicking on a menu item
  const handleMenuItemClick = () => {
    onClose();
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-background overflow-auto">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center">
            <span className="h-8 w-8 inline-flex items-center justify-center bg-primary text-primary-foreground text-lg font-bold rounded">
              D
            </span>
            <span className="ml-2 text-lg font-semibold">{t('app.title', 'DynamicForm')}</span>
          </div>
          <button 
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-2">
          {/* Home Link */}
          <Link 
            href="/" 
            className={`flex items-center p-2 rounded-md mb-2 ${
              location === '/' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
            onClick={handleMenuItemClick}
          >
            <div className="w-5 h-5 mr-3 flex items-center justify-center text-primary">
              <Home className="h-4 w-4" />
            </div>
            <span>{t('sidebar.home', 'Trang chủ')}</span>
          </Link>
          
          {isLoading ? (
            <div className="py-4 px-2 text-center text-muted-foreground">
              {t('sidebar.loading', 'Đang tải...')}
            </div>
          ) : (
            <div className="space-y-1">
              {parentMenus?.map((menu: MenuType) => (
                <MenuItemWithChildren 
                  key={menu.id} 
                  menu={menu} 
                  childMenus={getChildMenus(menu.id)} 
                  isExpanded={expandedMenus.includes(menu.id)}
                  toggleExpand={() => toggleMenu(menu.id)}
                  currentPath={location}
                  onClick={handleMenuItemClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MenuItemProps {
  menu: MenuType;
  childMenus?: MenuType[];
  isExpanded: boolean;
  toggleExpand: () => void;
  currentPath: string;
  onClick: () => void;
}

function MenuItemWithChildren({ 
  menu, 
  childMenus = [], 
  isExpanded, 
  toggleExpand,
  currentPath,
  onClick
}: MenuItemProps) {
  const hasChildren = childMenus?.length > 0;
  const isActive = currentPath === `/menu/${menu.id}` || 
                  currentPath.startsWith(`/menu/${menu.id}/submenu`);
  
  return (
    <div className="relative">
      <div className={cn(
        "flex items-center p-2 rounded-md cursor-pointer",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}>
        {hasChildren ? (
          <button 
            onClick={toggleExpand}
            className="w-5 h-5 mr-2 flex items-center justify-center text-muted-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 h-5 mr-2"></span>
        )}
        
        <Link 
          href={`/menu/${menu.id}`}
          className="flex-1 truncate"
          onClick={onClick}
        >
          {menu.name}
        </Link>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="pl-4 ml-3 border-l border-border my-1 space-y-1">
          {childMenus.map((childMenu: MenuType) => (
            <ChildMenuItem 
              key={childMenu.id} 
              menu={childMenu} 
              currentPath={currentPath}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ChildMenuItemProps {
  menu: MenuType;
  currentPath: string;
  onClick: () => void;
}

function ChildMenuItem({ menu, currentPath, onClick }: ChildMenuItemProps) {
  const isActive = currentPath === `/menu/${menu.parent_id}/submenu/${menu.id}`;
  
  return (
    <Link 
      href={`/menu/${menu.parent_id}/submenu/${menu.id}`}
      className={cn(
        "flex items-center p-2 rounded-md text-sm",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      {menu.name}
    </Link>
  );
}