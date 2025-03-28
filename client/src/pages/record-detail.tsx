import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { fetchMenuRecords, fetchWorkflowTransitionsByStatus } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, Check, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { TransitionFormDialog } from '@/components/TransitionFormDialog';

type FieldValue = string | number | string[] | boolean | null;

interface FieldData {
  id: string;
  name: string;
  value: FieldValue;
  field_type: string;
}

export default function RecordDetailPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ recordId: string, menuId: string, workflowId: string }>();
  const { recordId, menuId, workflowId } = params;
  
  // State cho thông tin transitions
  const [currentStatusId, setCurrentStatusId] = useState<string>("");
  
  // Format thời gian từ timestamp hoặc string
  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Lấy thông tin chi tiết record
  const { data: recordData, isLoading, error } = useQuery({
    queryKey: ['/api/record-detail', recordId],
    queryFn: async () => {
      const response = await fetchMenuRecords(menuId, 100, 0, recordId);
      return response.data.core_core_menu_records?.[0] || null;
    },
    enabled: !!recordId && !!menuId
  });

  // Cập nhật statusId khi có dữ liệu
  useEffect(() => {
    if (recordData?.core_dynamic_status?.id) {
      setCurrentStatusId(recordData.core_dynamic_status.id);
    }
  }, [recordData]);
  
  // Lấy transitions từ API nếu có workflowId
  const { data: transitionsData } = useQuery({
    queryKey: ['workflow-transitions', workflowId, currentStatusId],
    queryFn: async () => {
      console.log('Fetching transitions with variables:', { workflowId, fromStatusId: currentStatusId });
      if (!workflowId) return { data: { core_core_dynamic_workflow_transitions: [] } };
      const result = await fetchWorkflowTransitionsByStatus(workflowId, currentStatusId);
      // Đảm bảo transitions data không bao giờ là null
      if (!result.data?.core_core_dynamic_workflow_transitions) {
        result.data = { core_core_dynamic_workflow_transitions: [] };
      }
      return result;
    },
    enabled: !!workflowId && !!currentStatusId
  });

  // Tìm field tiêu đề nếu có
  const getTitleField = (): string => {
    if (!recordData?.data) return '';
    
    // Tìm trường tiêu đề theo tên
    const titleField = recordData.data.find((field: FieldData) => 
      field.name.toLowerCase().includes('tiêu đề') || 
      field.name.toLowerCase() === 'title' ||
      field.name.toLowerCase() === 'tên' ||
      field.name.toLowerCase() === 'chủ đề'
    );
    
    return titleField ? String(titleField.value || '') : '';
  };

  // Render giá trị field
  const renderFieldValue = (value: FieldValue, fieldType: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (fieldType) {
      case 'DATE':
        return formatDate(value as number);
      case 'MULTI_CHOICE':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return String(value);
    }
  };

  // Xử lý quay lại trang trước
  const handleGoBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <MainLayout title={t('recordDetail.title', 'Chi tiết biểu mẫu')}>
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('actions.back', 'Quay lại')}
              </Button>
            </div>
            <CardTitle>
              <Skeleton className="h-7 w-[300px]" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-5 w-[200px]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (error || !recordData) {
    return (
      <MainLayout title={t('recordDetail.title', 'Chi tiết biểu mẫu')}>
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('actions.back', 'Quay lại')}
              </Button>
            </div>
            <CardTitle className="text-destructive">
              {t('error.title', 'Đã xảy ra lỗi')}
            </CardTitle>
            <CardDescription>
              {t('error.failedToLoad', 'Không thể tải dữ liệu biểu mẫu')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const titleField = getTitleField();

  return (
    <MainLayout title={t('recordDetail.title', 'Chi tiết biểu mẫu')}>
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('actions.back', 'Quay lại')}
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-primary flex flex-wrap items-center">
                {recordData.code && (
                  <span className="mr-2 text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {recordData.code}
                  </span>
                )}
                {titleField || t('recordDetail.untitled', 'Biểu mẫu không có tiêu đề')}
              </CardTitle>
              
              <CardDescription className="mt-1 flex items-center flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('recordDetail.createdAt', 'Ngày tạo')}: {formatDate(new Date(recordData.created_at).getTime())}
                </span>
                {recordData.core_user && (
                  <span className="text-xs text-muted-foreground">
                    {t('recordDetail.createdBy', 'Người tạo')}: {recordData.core_user.username}
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Hiển thị trạng thái */}
            {recordData.core_dynamic_status && (
              <Badge variant="outline" className="bg-primary/10 text-primary font-semibold px-3 py-1 text-sm self-start md:self-center">
                {recordData.core_dynamic_status.name || t('recordDetail.noStatus', 'Chưa có trạng thái')}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        {/* Hiển thị action buttons workflow từ transitions */}
        {workflowId && transitionsData && transitionsData.data?.core_core_dynamic_workflow_transitions?.length > 0 && (
          <div className="px-6 py-3 bg-muted/20 border-y">
            <div className="w-full mb-1 text-sm font-medium text-primary">
              {t('workflow.availableActions', 'Hành động có sẵn:')}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {transitionsData.data.core_core_dynamic_workflow_transitions.map((transition: any) => (
                <TransitionFormDialog
                  key={transition.id}
                  transitionId={transition.id}
                  recordId={recordData.id}
                  transitionName={transition.name}
                  onSubmit={() => {
                    // Refresh lại trang sau khi thực hiện transition
                    window.location.reload();
                  }}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 bg-background hover:bg-primary hover:text-white transition-colors"
                    >
                      {transition.name}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  }
                />
              ))}
            </div>
          </div>
        )}

        <CardContent className="pt-6">
          <div className="space-y-6">
            {recordData.data && recordData.data.map((field: FieldData, index: number) => (
              <div key={field.id} className="border-b pb-4 last:border-0">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="w-full md:w-1/4">
                    <div className="font-semibold text-sm text-primary inline-flex items-center">
                      {field.name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {field.field_type}
                      </span>
                    </div>
                  </div>
                  <div className="w-full md:w-3/4 flex-1">
                    <div className="text-sm py-1 px-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                      {renderFieldValue(field.value, field.field_type)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!recordData.data || recordData.data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {t('recordDetail.noData', 'Không có dữ liệu field nào')}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-1"
          >
            {t('actions.close', 'Đóng')}
          </Button>
        </CardFooter>
      </Card>
    </MainLayout>
  );
}