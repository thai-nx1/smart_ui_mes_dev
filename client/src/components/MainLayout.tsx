import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen">
      <header className="bg-card text-card-foreground border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {title && (
                <h1 className={`${isMobile ? 'text-base' : 'text-xl'} font-semibold`}>
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="bg-background text-foreground">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2 py-3' : 'px-4 sm:px-6 lg:px-8 py-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}