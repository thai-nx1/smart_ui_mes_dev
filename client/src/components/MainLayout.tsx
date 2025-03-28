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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  
  // Menu điều hướng phụ
  const navLinks = [
    { title: t('nav.dashboard', 'Bảng điều khiển'), href: '#' },
    { title: t('nav.profile', 'Hồ sơ'), href: '#' },
    { title: t('nav.settings', 'Cài đặt'), href: '#' },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled 
            ? 'bg-background/90 backdrop-blur-md border-b shadow-sm' 
            : 'bg-background border-b'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-x-3">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              )}
              
              <div className="hidden md:flex items-center">
                <span className="h-8 w-8 inline-flex items-center justify-center bg-primary text-primary-foreground text-lg font-bold rounded">
                  D
                </span>
                <span className="ml-2 text-lg font-semibold text-foreground">DynamicForm</span>
              </div>
              
              {title && (
                <div className="flex items-center">
                  <div className="hidden md:block h-6 w-px bg-border mx-3" />
                  <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground`}>
                    {title}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-x-3">
              <div className="hidden md:flex items-center mr-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('actions.search', 'Tìm kiếm...')}
                    className="h-9 w-[180px] lg:w-[280px] rounded-md border bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  3
                </Badge>
              </Button>
              
              <LanguageSwitcher />
              <ThemeSwitcher />
              
              <div className="h-8 w-px bg-border mx-1 hidden md:block" />
              
              <Avatar className="h-8 w-8 border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">VN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        
        {isMobile && isMenuOpen && (
          <div className="md:hidden p-4 border-t bg-background">
            <nav className="space-y-1">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="block px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                >
                  {link.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="bg-background text-foreground pb-10">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 lg:px-8 py-6'} relative`}>
          {/* Lớp background trang trí */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent -z-10 opacity-50"></div>
          
          {/* Nội dung chính */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
      
      <footer className="mt-auto py-4 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} DynamicForm. {t('footer.allRightsReserved', 'Bản quyền đã được đăng ký.')}
            </p>
            <div className="flex space-x-4 mt-3 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">{t('footer.privacy', 'Chính sách')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.terms', 'Điều khoản')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.contact', 'Liên hệ')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}