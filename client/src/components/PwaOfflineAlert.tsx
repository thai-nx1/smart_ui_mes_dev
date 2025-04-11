import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PwaOfflineAlert() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();
  
  useEffect(() => {
    // Kiểm tra trạng thái kết nối ban đầu
    setIsOffline(!navigator.onLine);
    
    // Đăng ký các trình xử lý sự kiện trạng thái kết nối
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Hủy đăng ký các trình xử lý khi component bị hủy
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  // Không hiển thị gì nếu người dùng đang trực tuyến
  if (!isOffline) return null;
  
  return (
    <Alert variant="destructive" className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto shadow-lg">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>{t('Mất kết nối Internet')}</AlertTitle>
      <AlertDescription>
        {t('Bạn đang ở chế độ ngoại tuyến. Một số tính năng có thể không hoạt động cho đến khi kết nối được khôi phục.')}
      </AlertDescription>
    </Alert>
  );
}