import React from 'react';
import { Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';

interface FormLayoutProps {
  children: React.ReactNode;
}

export function FormLayout({ children }: FormLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                  <path d="M18 14h-8" />
                  <path d="M15 18h-5" />
                  <path d="M10 6h8v4h-8V6Z" />
                </svg>
              </div>
              <Link href="/">
                <h1 className={`ml-3 ${isMobile ? 'text-base' : 'text-xl'} font-semibold text-gray-800 cursor-pointer`}>
                  {isMobile ? 'Form Động' : 'Hệ thống Quản lý Form Động'}
                </h1>
              </Link>
              
              {!isMobile && (
                <div className="ml-6 flex space-x-4">
                  <Link href="/forms">
                    <a className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Forms</a>
                  </Link>
                  <Link href="/workflow">
                    <a className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Workflow</a>
                  </Link>
                </div>
              )}
            </div>
            <div>
              <Link href="/forms">
                <button type="button" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {isMobile ? '' : 'Đăng nhập'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2 py-3' : 'px-4 sm:px-6 lg:px-8 py-6'}`}>
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'py-3' : 'py-6'} px-4 sm:px-6 lg:px-8`}>
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} {isMobile ? 'Form Động' : 'Hệ thống Quản lý Form Động'}
          </p>
        </div>
      </footer>
    </div>
  );
}
