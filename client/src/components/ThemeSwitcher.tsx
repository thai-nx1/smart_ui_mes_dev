import { useState, useEffect } from 'react';
import { themeManager, ThemeSettings, ThemeType, ThemeStyle } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Palette, 
  Circle 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeSettings>(themeManager.getTheme());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(themeManager.getIsDarkMode());

  // Cập nhật state khi theme thay đổi
  useEffect(() => {
    // Đăng ký listener với ThemeManager
    const unsubscribe = themeManager.subscribe((settings, isDark) => {
      setTheme(settings);
      setIsDarkMode(isDark);
    });
    
    // Hủy đăng ký khi component unmount
    return unsubscribe;
  }, []);

  // Thay đổi chế độ (light/dark/system)
  const changeThemeMode = (mode: ThemeType) => {
    themeManager.setTheme({ theme: mode });
  };

  // Thay đổi phong cách theme (professional/tint/vibrant)
  const changeThemeStyle = (style: ThemeStyle) => {
    themeManager.setTheme({ themeStyle: style });
  };

  // Thay đổi màu chủ đạo
  const changeThemeColor = (color: string) => {
    themeManager.setTheme({ primaryColor: color });
  };

  // Danh sách màu sắc nổi bật
  const colorOptions = [
    { value: '#7c4dff', label: t('common.colors.purple') },
    { value: '#2196f3', label: t('common.colors.blue') },
    { value: '#4caf50', label: t('common.colors.green') },
    { value: '#ff9800', label: t('common.colors.orange') },
    { value: '#f44336', label: t('common.colors.red') },
    { value: '#9c27b0', label: t('common.colors.violet') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {isDarkMode ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">
            {isDarkMode ? t('theme.toggleLight') : t('theme.toggleDark')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('theme.selectMode')}</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => changeThemeMode('light')}
          className={theme.theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('theme.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeThemeMode('dark')}
          className={theme.theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('theme.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeThemeMode('system')}
          className={theme.theme === 'system' ? 'bg-accent' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('theme.system')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('theme.selectStyle')}</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => changeThemeStyle('professional')}
          className={theme.themeStyle === 'professional' ? 'bg-accent' : ''}
        >
          <span>{t('theme.professional')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeThemeStyle('tint')}
          className={theme.themeStyle === 'tint' ? 'bg-accent' : ''}
        >
          <span>{t('theme.tint')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeThemeStyle('vibrant')}
          className={theme.themeStyle === 'vibrant' ? 'bg-accent' : ''}
        >
          <span>{t('theme.vibrant')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('theme.selectColor')}</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 p-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => changeThemeColor(color.value)}
              className={`flex h-8 w-full items-center justify-center rounded-md 
                ${theme.primaryColor === color.value ? 'ring-2 ring-primary' : ''}`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            >
              {theme.primaryColor === color.value && (
                <Circle className="h-4 w-4 text-white fill-current" />
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}