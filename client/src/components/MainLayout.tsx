import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Bell, Search, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { themeManager } from '@/lib/theme';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(themeManager.getIsDarkMode());
  
  // Theo dõi cuộn trang để thêm shadow cho header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Theo dõi thay đổi chế độ màu
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((settings, isDark) => {
      setIsDarkMode(isDark);
    });
    
    return unsubscribe;
  }, []);
  
  // Menu điều hướng phụ đã bị loại bỏ theo yêu cầu
  const navLinks: Array<{title: string, href: string}> = [];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header 
        className={`w-full border-b bg-background h-12 z-40`}
      >
        <div className="px-2 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden h-8 w-8" 
                onClick={() => {
                  const triggerButton = document.querySelector('[data-sidebar-trigger]');
                  if (triggerButton) {
                    (triggerButton as HTMLButtonElement).click();
                  }
                }}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center">
                <span className="h-6 w-6 inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold rounded">
                  D
                </span>
                <span className="ml-1 text-sm font-semibold text-foreground hidden md:inline">DynamicForm</span>
              </div>
              
              {title && (
                <div className="flex items-center">
                  <div className="hidden md:block h-4 w-px bg-border mx-2" />
                  <h1 className="text-sm font-semibold text-foreground truncate max-w-[180px] md:max-w-none">
                    {title}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-x-1">
              <ThemeSwitcher />
              <LanguageSwitcher />
              
              <Avatar className="h-6 w-6 border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">VN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-background text-foreground flex-1 overflow-auto">
        <div className="w-full relative h-full">
          {/* Không sử dụng background trang trí nữa */}
          
          {/* Nội dung chính */}
          <div className="h-full">
            {children}
          </div>
        </div>
      </main>
      
      <footer className="border-t bg-muted/30 py-2">
        <div className="px-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} DynamicForm
            </p>
            <div className="flex space-x-2">
              <a href="#" className="hover:text-primary">{t('footer.privacy', 'Chính sách')}</a>
              <a href="#" className="hover:text-primary">{t('footer.terms', 'Điều khoản')}</a>
              <a href="#" className="hover:text-primary">{t('footer.contact', 'Liên hệ')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}