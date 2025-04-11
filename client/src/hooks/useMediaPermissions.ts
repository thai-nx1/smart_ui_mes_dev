import { useState, useEffect } from 'react';

type PermissionType = 'camera' | 'microphone';
type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseMediaPermissionsReturn {
  status: PermissionStatus;
  isGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useMediaPermissions(type: PermissionType): UseMediaPermissionsReturn {
  const [status, setStatus] = useState<PermissionStatus>('prompt');

  useEffect(() => {
    // Kiểm tra trạng thái quyền ban đầu
    checkPermission();

    // Lắng nghe thay đổi trạng thái quyền (chỉ hoạt động với API navigator.permissions)
    const setupPermissionChangeListener = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Chuyển đổi loại quyền sang định dạng PermissionName
          const permissionName = type === 'camera' ? 'camera' : 'microphone';
          
          const permissionStatus = await navigator.permissions.query({ 
            name: permissionName as PermissionName 
          });
          
          permissionStatus.onchange = () => {
            setStatus(permissionStatus.state as PermissionStatus);
          };
        } catch (error) {
          console.error(`Error setting up permission listener: ${error}`);
        }
      }
    };

    setupPermissionChangeListener();
  }, [type]);

  // Kiểm tra trạng thái quyền hiện tại
  const checkPermission = async () => {
    // Kiểm tra xem trình duyệt có hỗ trợ API permissions hay không
    if (navigator.permissions && navigator.permissions.query) {
      try {
        // Chuyển đổi loại quyền sang định dạng PermissionName
        const permissionName = type === 'camera' ? 'camera' : 'microphone';
        
        const permissionStatus = await navigator.permissions.query({ 
          name: permissionName as PermissionName 
        });
        
        setStatus(permissionStatus.state as PermissionStatus);
      } catch (error) {
        // API permissions không hỗ trợ loại quyền này
        setStatus('unsupported');
      }
    } else {
      // API permissions không được hỗ trợ
      setStatus('unsupported');
    }
  };

  // Yêu cầu quyền truy cập
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Chuẩn bị tham số cho getUserMedia dựa trên loại quyền
      const constraints = {
        video: type === 'camera',
        audio: type === 'microphone',
      };
      
      // Yêu cầu quyền
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Dừng tất cả các tracks ngay lập tức sau khi quyền được cấp
      stream.getTracks().forEach(track => track.stop());
      
      // Cập nhật trạng thái
      setStatus('granted');
      
      return true;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      setStatus('denied');
      return false;
    }
  };

  return {
    status,
    isGranted: status === 'granted',
    requestPermission,
  };
}