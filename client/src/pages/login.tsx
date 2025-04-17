import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { log } from 'node:console';

// Định nghĩa schema cho form đăng nhập
const loginSchema = z.object({
  phone: z.string().min(1, { message: 'Số điện thoại không được để trống' }),
  password: z.string().min(1, { message: 'Mật khẩu không được để trống' }),
});

type LoginForm = z.infer<typeof loginSchema>;


interface LoginResponseGetToken {
  data: {
    mes: {
      identityLogin: {
        accessToken: string;
        refreshToken: string;
        organizationId: string;
        user: {
          id: string;
          fullname: string;
          email: string;
          avatar: {
            id: string;
            location: string;
          };
        };
        avaiableBusinessRoles: {
          id: string;
          code: string;
          name: string;
        }[];
      };
    }
  }
}

interface LoginResponseWithBusinessRole {
  data: {
    mes: {
      identityLoginWithBusinessRole: {
        accessToken: string;
        refreshToken: string;
      };
    }
  }
}

interface LoginResponse {
  identityLogin: {
    accessToken: string;
        refreshToken: string;
        organizationId: string;
        user: {
          id: string;
          fullname: string;
          email: string;
          avatar: {
            id: string;
            location: string;
          };
        };
        avaiableBusinessRoles: {
          id: string;
          code: string;
      name: string;
    }[];
  };
  identityLoginWithBusinessRole: {
    accessToken: string;
    refreshToken: string;
  };
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  // Kiểm tra nếu đã đăng nhập thì chuyển hướng về trang chính
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && accessToken.trim() !== '') {
      // Kiểm tra nếu có trang chuyển hướng lưu trong session
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        setLocation(redirectPath);
      } else {
        // Nếu không có trang chuyển hướng, về trang chủ
        setLocation('/');
      }
    }
  }, [setLocation]);

  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  // Mutation cho API đăng nhập
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const graphqlQuery_preGetToken = {
        query: `
          mutation mesLogin {
            mes {
              identityLogin(credential: { phone: "${data.phone}", password: "${data.password}" }) {
                accessToken
                refreshToken
                organizationId
                avaiableBusinessRoles {
                  id
                  code
                  name
                }
                user {
                  id
                  fullname
                  email
                  avatar {
                    id
                    location
                  }
                }
              }
            }
          }
        `,
      };

      // Gửi yêu cầu GraphQL đến API
      const response = await fetch('https://oxii-hasura-api.oxiiuat.com/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': 'Oxiitek@13579'
        },
        body: JSON.stringify(graphqlQuery_preGetToken),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Đăng nhập thất bại');
      }

      const tokenResponse = await response.json() as LoginResponseGetToken;
      
      // Second mutation to login with business role
      const graphqlQueryWithBusinessRole = {
        query: `
          mutation mesLoginBusinessRole {
            mes {
              identityLoginWithBusinessRole(
                businessRoleId: "${tokenResponse.data.mes.identityLogin.avaiableBusinessRoles[0].id}"
              ) {
                accessToken
                refreshToken
              }
            }
          }
        `,
      };

      const businessRoleResponse = await fetch('https://oxii-hasura-api.oxiiuat.com/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': 'Oxiitek@13579',
          'Authorization': `Bearer ${tokenResponse.data.mes.identityLogin.accessToken}`
        },
        body: JSON.stringify(graphqlQueryWithBusinessRole),
      });

      if (!businessRoleResponse.ok) {
        const errorData = await businessRoleResponse.json();
        throw new Error(errorData.message || 'Đăng nhập với business role thất bại');
      }

      const responseWithBusinessRole = await businessRoleResponse.json() as LoginResponseWithBusinessRole;

      return {
        identityLoginWithBusinessRole:{
          ...responseWithBusinessRole.data.mes.identityLoginWithBusinessRole,
        },
        identityLogin:{
          ...tokenResponse.data.mes.identityLogin
        }
      }
    },
    onSuccess: (data) => {
      if (data?.identityLoginWithBusinessRole) {
        const { accessToken, refreshToken} = data?.identityLoginWithBusinessRole;
        const {  organizationId, user } = data?.identityLogin;
        
        if (accessToken && accessToken.trim() !== '') {
          localStorage.setItem('accessToken', accessToken);

          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          if (organizationId) {
            localStorage.setItem('organizationId', organizationId);
          }
          
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }

          localStorage.setItem('loggedInTime', new Date().toISOString());

          toast({
            title: t('Đăng nhập thành công'),
            description: t('Chào mừng bạn quay trở lại!'),
            variant: 'default',
          });

          setLocation('/');
          return;
        }
      }

      throw new Error('Không nhận được token đăng nhập hợp lệ');
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      // Hiển thị thông báo lỗi
      toast({
        title: t('Đăng nhập thất bại'),
        description: error.message || t('Vui lòng kiểm tra thông tin đăng nhập và thử lại'),
        variant: 'destructive',
      });
    },
  });

  // Xử lý submit form
  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border border-primary/10">
        <div className="text-center">
          <div className="flex justify-center">
            <img src="/icons/app-icon.svg" alt="logo" className="h-16 w-16" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {t('Đăng nhập vào tài khoản của bạn')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('Nhập thông tin đăng nhập để truy cập hệ thống')}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Số điện thoại')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Nhập số điện thoại')}
                      {...field}
                      className="bg-slate-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Mật khẩu')}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('Nhập mật khẩu')}
                        {...field}
                        className="bg-slate-50 pr-10"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Có thể thêm checkbox "Ghi nhớ đăng nhập" ở đây */}
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                {t('Quên mật khẩu?')}
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t('Đang đăng nhập...')}
                </>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  {t('Đăng nhập')}
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t('Hoặc')}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" className="w-full">
              {t('Liên hệ hỗ trợ')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}