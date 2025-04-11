// Định nghĩa interface cho token xác thực
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  loggedInTime?: string;
}

// Lấy token xác thực từ localStorage
export function getAuthTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const loggedInTime = localStorage.getItem('loggedInTime');

  // Nếu không có accessToken, trả về null
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken || '',
    loggedInTime: loggedInTime || undefined,
  };
}

// Lưu token xác thực vào localStorage
export function setAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  
  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
  
  if (tokens.loggedInTime) {
    localStorage.setItem('loggedInTime', tokens.loggedInTime);
  } else {
    localStorage.setItem('loggedInTime', new Date().toISOString());
  }
}

// Xóa token xác thực khỏi localStorage (đăng xuất)
export function clearAuthTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('loggedInTime');
}

// Kiểm tra xem người dùng đã đăng nhập hay chưa
export function isAuthenticated(): boolean {
  const tokens = getAuthTokens();
  return !!tokens && !!tokens.accessToken && tokens.accessToken.trim() !== '';
}

// Tạo header với Authorization chứa accessToken
export function getAuthHeader(): Record<string, string> {
  const tokens = getAuthTokens();
  
  if (tokens && tokens.accessToken) {
    return {
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }
  
  return {};
}

// Khởi tạo xác thực khi ứng dụng khởi động
export function initAuth(): void {
  // Có thể thêm logic như refresh token tự động ở đây
  // hoặc đăng xuất người dùng nếu token đã hết hạn
  console.log('Auth initialized');
}