import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FilePlus, Loader2 } from 'lucide-react';
import { fetchSubmenuCreateForm, submitFormData } from '@/lib/api';
import { Field, FormField, FormSubmission, FieldSubmission } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface CreateIncidentButtonProps {
  submenuId: string;
  submenuName: string;
  submenuWorkflowId: string;
  className?: string;
}

export function CreateIncidentButton({ 
  submenuId, 
  submenuName, 
  submenuWorkflowId,
  className
}: CreateIncidentButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    formId: string;
    fields: Field[];
  } | null>(null);
  
  // Xử lý khi người dùng mở dialog
  const handleOpenDialog = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    
    try {
      // Lấy form từ transition CREATE của workflow gắn với submenu
      const response = await fetchSubmenuCreateForm(submenuId);
      
      if (response.data && response.data.core_core_dynamic_forms_by_pk) {
        const formDetails = response.data.core_core_dynamic_forms_by_pk;
        const formFields = formDetails.core_dynamic_form_fields || [];
        
        // Chuyển đổi dữ liệu để lấy danh sách fields
        const extractedFields = formFields.map((formField: FormField) => formField.core_dynamic_field);
        
        setFormData({
          formId: formDetails.id,
          fields: extractedFields
        });
      } else {
        setError(t('error.noFormFound', 'Không tìm thấy biểu mẫu cho quy trình của menu này.'));
      }
    } catch (error) {
      console.error('Error fetching create form:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : t('error.unknownError', 'Đã xảy ra lỗi khi tải biểu mẫu.')
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Xử lý khi người dùng tạo sự vụ mới
  const handleCreateIncident = async () => {
    if (!formData) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Tạo dữ liệu submission từ danh sách fields
      const submissionData: Record<string, FieldSubmission> = {};
      
      formData.fields.forEach(field => {
        // Tạo giá trị mặc định dựa trên loại field
        let defaultValue: any = null;
        
        switch (field.field_type) {
          case 'TEXT':
          case 'PARAGRAPH':
            defaultValue = '';
            break;
          case 'NUMBER':
            defaultValue = 0;
            break;
          case 'DATE':
            defaultValue = new Date().getTime();
            break;
          case 'SINGLE_CHOICE':
            defaultValue = '1';
            break;
          case 'MULTI_CHOICE':
            defaultValue = ['1'];
            break;
          default:
            defaultValue = null;
        }
        
        // Thêm field vào dữ liệu submission
        submissionData[field.id] = {
          name: field.name,
          value: defaultValue,
          field_type: field.field_type
        };
      });
      
      // Gọi API để tạo submission
      await submitFormData({
        formId: formData.formId,
        data: submissionData,
        workflowId: submenuWorkflowId
      });
      
      // Hiển thị thông báo thành công
      toast({
        title: t('incident.createSuccess', 'Tạo sự vụ thành công'),
        description: t('incident.createSuccessMessage', 'Sự vụ mới đã được tạo thành công.'),
      });
      
      // Đóng dialog
      setIsOpen(false);
      
      // Chuyển hướng đến trang submissions của workflow
      setLocation(`/submission/${submenuWorkflowId}`);
    } catch (error) {
      console.error('Error creating incident:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : t('error.createFailed', 'Đã xảy ra lỗi khi tạo sự vụ mới.')
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        className={`flex items-center gap-2 ${className}`}
        size="sm"
      >
        <FilePlus className="h-4 w-4" />
        {t('incident.create', 'Tạo sự vụ')}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('incident.createNew', 'Tạo sự vụ mới: {menuName}', { menuName: submenuName })}
            </DialogTitle>
            <DialogDescription>
              {t('incident.createDescription', 'Tạo sự vụ mới cho quy trình của menu "{menuName}".', { menuName: submenuName })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">{t('common.loading', 'Đang tải...')}</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            ) : formData ? (
              <div className="space-y-4">
                <p>{t('incident.confirmCreate', 'Bạn có chắc chắn muốn tạo sự vụ mới với biểu mẫu "{formName}" không?', { 
                  formName: formData.fields.length > 0 ? `${formData.fields.length} trường` : 'Không có trường'
                })}</p>
                <p className="text-sm text-muted-foreground">
                  {t('incident.createNote', 'Biểu mẫu sẽ được tạo với các giá trị mặc định, bạn có thể chỉnh sửa sau.')}
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                {t('incident.noFormData', 'Không có dữ liệu biểu mẫu.')}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              {t('actions.cancel', 'Hủy')}
            </Button>
            <Button
              onClick={handleCreateIncident}
              disabled={isLoading || isCreating || !formData}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="h-4 w-4" />
              )}
              {t('incident.create', 'Tạo sự vụ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}