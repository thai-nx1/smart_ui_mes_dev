import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle } from 'lucide-react';
import { SubmissionDataTable } from '@/components/SubmissionDataTable';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMenuRecords, fetchAllMenus, submitFormData, fetchMenuRecordLists } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/MainLayout';

export default function WorkflowPage() {
  const params = useParams<{ menuId: string, subMenuId: string }>();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const menuId = params.menuId;
  const subMenuId = params.subMenuId || menuId;
  
  // Truy vấn để lấy tất cả các menu để tìm menu phù hợp
  const { data: menusData } = useQuery({
    queryKey: ['/api/all-menus'],
    queryFn: async () => {
      const response = await fetchAllMenus();
      return response.data.core_core_dynamic_menus;
    }
  });
  
  // Tìm submenu và menu cha
  const currentSubmenu = menusData?.find((menu: any) => menu.id === subMenuId);
  const parentMenu = menusData?.find((menu: any) => menu.id === currentSubmenu?.parent_id);
  
  // Lấy workflowId từ submenu nếu có
  // Đảm bảo workflowId là string hoặc undefined (không phải null)
  const workflowId = currentSubmenu?.workflow_id || undefined;
  
  // Truy vấn để lấy dữ liệu records
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/menu-records', subMenuId],
    queryFn: async () => {
      if (!subMenuId) return [];
      try {
        const response = await fetchMenuRecordLists(subMenuId, 1, 20, "");
        console.log('fetchMenuRecordLists:', response);
        return response.data.mes.factoryMenuRecordList.data;
      } catch (err) {
        console.error("Error fetching menu records:", err);
        return [];
      }
    },
    enabled: !!subMenuId
  });

  
  
  // Sử dụng dữ liệu API hoặc dữ liệu mẫu nếu không có dữ liệu
  const submissionData = (data && data.length > 0) ? data : [];
  
  // Xử lý khi nộp form mới
  const handleSubmitForm = async (submission: any) => {
    try {
      // Gửi dữ liệu form
      await submitFormData(submission);
      
      // Hiển thị thông báo thành công
      toast({
        title: t('Thành công'),
        description: t('Biểu mẫu đã được gửi thành công.'),
        variant: 'default',
      });
      
      // Tải lại dữ liệu
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records', subMenuId] });
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Hiển thị thông báo lỗi
      toast({
        title: t('Lỗi'),
        description: t('Có lỗi xảy ra khi gửi biểu mẫu. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    }
  };

  // Get query parameters from URL
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryParams: Record<string, string> = {};
    
    // Sử dụng cách tiếp cận khác để tránh lỗi với typescript
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    return queryParams;
  };

  useEffect(() => {
    const queryParams = getQueryParams();
    if (queryParams.viewMode === 'list')
      return;
    if (workflowId && subMenuId) {
      navigate(`/submission/${workflowId}/create?menuId=${subMenuId}`);
    }
  }, [workflowId, subMenuId]);

  return (
    <MainLayout title={t('submission.createTitle', currentSubmenu?.name || "Phê duyệt tài chính")}>
      <div className="w-full px-4 py-4">
      <Card className="w-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-4">
          <div>
            <CardTitle className="text-xl">{currentSubmenu?.name || "Phê duyệt tài chính"}</CardTitle>
            <CardDescription>
              Danh sách các biểu mẫu đã được gửi qua workflow này
            </CardDescription>
          </div>
          {workflowId && (
            <Link href={`/submission/${workflowId}/create?menuId=${subMenuId}`}>
              <Button 
                className="gap-1 bg-primary hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('submission.create', 'Tạo biểu mẫu')}</span>
              </Button>
            </Link>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {/* <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Dữ liệu đã nộp</h3>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm trong dữ liệu..."
                className="w-full pl-9 pr-4 py-2"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 my-4">
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Nội dung phê duyệt
            </Button>
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Trong hay ngoài budget
            </Button>
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Số tiền cần chi
            </Button>
          </div> */}
          
          {/* Sử dụng SubmissionDataTable để hiển thị dữ liệu */}
          <SubmissionDataTable
            data={isLoading ? [] : submissionData}
            readOnly={true}
            viewMode={undefined} // Để tự động chuyển đổi dựa vào kích thước màn hình
            menuId={subMenuId || undefined}
            workflowId={workflowId}
          />
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}