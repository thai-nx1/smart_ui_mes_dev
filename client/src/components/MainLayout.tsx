import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { clearAuthTokens } from '@/lib/auth';
import { themeManager } from '@/lib/theme';
import { LogOut, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface UserInfo {
  fullname?: string;
  email?: string;
  avatar?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(themeManager.getIsDarkMode());
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  
  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUserInfo({
          fullname: parsedUser.fullname || 'User',
          email: parsedUser.email || 'user@example.com',
          avatar: parsedUser.avatar.location || ''
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
  // Xử lý đăng xuất
  const handleLogout = () => {
    clearAuthTokens();
    setLocation('/login');
  };
  
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
    <div className="min-h-screen bg-background">
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled 
            ? 'bg-background/90 backdrop-blur-md border-b shadow-sm' 
            : 'bg-background border-b'
        }`}
      >
        <div className="w-full flex px-4 sm:px-6 lg:px-4">
          <div className="flex-1 flex justify-between items-center h-16">
            <div className="flex items-center gap-x-3">
              {/* Nút menu cho mobile, chỉ hiện trên trang chủ */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="block md:hidden mr-1 bg-transparent border-none outline-none hover:bg-transparent" 
                disabled
              >
              </Button>
              
              {title && (
                <div className="flex items-center">
                  {/* <div className="hidden md:block h-6 w-px bg-border mx-3" /> */}
                  <h1 className={`${isMobile ? 'text-sm' : 'text-xl'} font-semibold text-foreground truncate max-w-[180px] md:max-w-none`}>
                    {title}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-x-1 sm:gap-x-3">
              <div className="hidden md:flex items-center mr-2">
                  <div className="p-1">
                    <div className="font-medium">{userInfo.fullname || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{userInfo.email || 'user@example.com'}</div>
                  </div>
                {/* <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('actions.search', 'Tìm kiếm...')}
                    className="h-9 w-[180px] lg:w-[280px] rounded-md border bg-background px-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div> */}
              </div>
              
              {/* <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground hover:text-foreground hidden md:flex">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  3
                </Badge>
              </Button> */}
              
              {/* <PwaInstallButton /> */}
              {/* <LanguageSwitcher /> */}
              {/* <ThemeSwitcher /> */}
              
              <div className="h-8 w-px bg-border mx-1 hidden md:block" />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <Avatar className="h-8 w-8 border cursor-pointer hover:shadow-sm transition-shadow">
                      <AvatarImage src={userInfo.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {userInfo.fullname?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="p-1">
                    {/* <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal px-2 py-1.5 h-9"
                      onClick={() => setLocation('/profile')}
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      {t('actions.viewProfile', 'Xem hồ sơ')}
                    </Button> */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal px-2 py-1.5 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('actions.logout', 'Đăng xuất')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        

      </header>

      <main className="bg-background text-foreground min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="relative flex-1 w-full h-full">
          {/* Loại bỏ container để nội dung tràn viền đầy đủ */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
          
          {/* Nội dung chính không có padding để neo 4 bên */}
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>
      </main>
      
      {/* <footer className="mt-auto py-4 border-t bg-muted/30">
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
      </footer> */}
    </div>
  );
}