import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { canInstallPwa, promptInstallPwa } from '@/pwa';
import { toast } from '@/hooks/use-toast';

export function PwaInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const { t } = useTranslation();

  // Kiểm tra xem ứng dụng có thể được cài đặt không
  useEffect(() => {
    const checkInstallable = () => {
      const installable = canInstallPwa();
      setCanInstall(installable);
    };

    // Kiểm tra khi component được mount
    checkInstallable();

    // Kiểm tra lại mỗi khi có thay đổi trong trạng thái cài đặt
    window.addEventListener('beforeinstallprompt', checkInstallable);
    window.addEventListener('appinstalled', () => setCanInstall(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable);
      window.removeEventListener('appinstalled', () => setCanInstall(false));
    };
  }, []);

  const handleInstallClick = async () => {
    try {
      const installed = await promptInstallPwa();
      
      if (installed) {
        toast({
          title: t('Cài đặt thành công'),
          description: t('Ứng dụng đã được cài đặt vào thiết bị của bạn'),
          variant: 'default',
        });
        
        setCanInstall(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      
      toast({
        title: t('Không thể cài đặt'),
        description: t('Đã xảy ra lỗi khi cài đặt ứng dụng. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    }
  };

  // Chỉ hiển thị nút khi ứng dụng có thể được cài đặt
  if (!canInstall) return null;

  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      className="gap-2"
      size="sm"
    >
      <Download className="h-4 w-4" />
      {t('Cài đặt ứng dụng')}
    </Button>
  );
}