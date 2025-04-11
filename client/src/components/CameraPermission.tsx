import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';

export function CameraPermission() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { status: permissionState, requestPermission } = useMediaPermissions('camera');

  useEffect(() => {
    // Nếu trạng thái là prompt, hiển thị hộp thoại
    if (permissionState === 'prompt') {
      setOpen(true);
    }
  }, [permissionState]);

  const handleRequestPermission = async () => {
    try {
      const success = await requestPermission();
      
      if (success) {
        setOpen(false);
        
        toast({
          title: t('Quyền truy cập camera đã được cấp'),
          description: t('Bạn có thể sử dụng camera trong ứng dụng'),
          variant: 'default',
        });
      } else {
        toast({
          title: t('Quyền truy cập camera bị từ chối'),
          description: t('Vui lòng cấp quyền camera trong cài đặt trình duyệt để sử dụng đầy đủ tính năng'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      
      toast({
        title: t('Lỗi khi yêu cầu quyền camera'),
        description: t('Đã xảy ra lỗi khi yêu cầu quyền camera. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t('Cho phép sử dụng camera')}
          </DialogTitle>
          <DialogDescription>
            {t('Ứng dụng cần quyền truy cập vào camera để sử dụng các tính năng chụp ảnh và quét mã QR. Vui lòng cấp quyền khi trình duyệt yêu cầu.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Camera className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        {permissionState === 'denied' && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              {t('Quyền truy cập bị từ chối. Vui lòng vào cài đặt trình duyệt để cấp quyền camera cho trang web này.')}
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            {t('Để sau')}
          </Button>
          <Button 
            onClick={handleRequestPermission}
            disabled={permissionState === 'denied'}
          >
            {t('Cấp quyền ngay')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}