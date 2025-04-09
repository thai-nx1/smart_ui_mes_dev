import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AuthUtils } from '@/contexts/AuthUtils';
import { useLocation } from 'wouter';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleLogout = () => {
    // Sử dụng AuthUtils để đăng xuất
    AuthUtils.logout();
    
    toast({
      title: 'Đăng xuất thành công',
      description: 'Bạn đã đăng xuất khỏi hệ thống',
    });
    
    // Chuyển hướng về trang đăng nhập
    setLocation('/login');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout} 
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <LogOut size={16} />
      <span>Đăng xuất</span>
    </Button>
  );
}