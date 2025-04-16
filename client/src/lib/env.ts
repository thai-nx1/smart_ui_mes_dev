// File quản lý môi trường ứng dụng

export type AppEnvironment = 'development' | 'staging' | 'production';

// Lấy môi trường từ biến môi trường VITE_APP_ENV hoặc mặc định là 'development'
export const APP_ENV = (import.meta.env.VITE_APP_ENV as AppEnvironment) || 'development';

// Hàm kiểm tra môi trường hiện tại
export function isEnv(env: AppEnvironment): boolean {
  return APP_ENV === env;
}

export const isDevelopment = (): boolean => isEnv('development');
export const isStaging = (): boolean => isEnv('staging');
export const isProduction = (): boolean => isEnv('production');

// Lấy các biến môi trường khác
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT as string;
export const API_URL = import.meta.env.VITE_API_URL as string;

// Export đối tượng config chứa tất cả biến môi trường
export const config = {
  env: APP_ENV,
  graphqlEndpoint: GRAPHQL_ENDPOINT,
  apiUrl: API_URL,
  isDevelopment: isDevelopment(),
  isStaging: isStaging(),
  isProduction: isProduction(),
};

// Log ra môi trường khi ứng dụng khởi động (chỉ trong development)
if (isDevelopment()) {
  console.log('Environment:', APP_ENV);
  console.log('Config:', config);
}

export default config;