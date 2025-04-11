// Lưu trữ và quản lý thông tin xác thực người dùng

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  loggedInTime?: string;
}

// Lấy tokens từ localStorage
export function getAuthTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) {
    return null;
  }
  
  return {
    accessToken,
    refreshToken,
    loggedInTime: localStorage.getItem('loggedInTime') || undefined
  };
}

// Lưu tokens vào localStorage
export function setAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  if (tokens.loggedInTime) {
    localStorage.setItem('loggedInTime', tokens.loggedInTime);
  } else {
    localStorage.setItem('loggedInTime', new Date().toISOString());
  }
}

// Xóa thông tin xác thực (đăng xuất)
export function clearAuthTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('loggedInTime');
}

// Kiểm tra xem người dùng đã đăng nhập chưa
export function isAuthenticated(): boolean {
  return !!getAuthTokens();
}

// Thêm token xác thực vào header
export function getAuthHeader(): Record<string, string> {
  const tokens = getAuthTokens();
  
  if (!tokens) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${tokens.accessToken}`
  };
}

// Hook kiểm tra trạng thái xác thực khi ứng dụng khởi động
export function initAuth(): void {
  // Kiểm tra token hết hạn
  const tokens = getAuthTokens();
  
  if (tokens && tokens.loggedInTime) {
    const loggedInDate = new Date(tokens.loggedInTime);
    const currentDate = new Date();
    
    // Nếu token đã được phát hành hơn 30 ngày, xóa nó
    // Lưu ý: Đây chỉ là kiểm tra sơ bộ, thực tế nên dựa vào JWT expiration
    const daysDifference = (currentDate.getTime() - loggedInDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDifference > 30) {
      clearAuthTokens();
    }
  }
}