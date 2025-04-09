import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest(
  url: string,
  options?: ApiRequestOptions,
): Promise<any> {
  // Lấy token từ localStorage
  const token = localStorage.getItem('token');
  
  // Tạo headers mặc định
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Thêm token vào header nếu có
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Gộp headers tùy chỉnh với headers mặc định
  const headers = {
    ...defaultHeaders,
    ...options?.headers
  };
  
  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers,
    body: options?.data ? JSON.stringify(options.data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Kiểm tra xem có dữ liệu trả về không
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  
  return await res.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    
    // Tạo headers mặc định, thêm token vào header nếu có
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Kiểm tra xem có dữ liệu trả về không
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    
    return await res.text();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
