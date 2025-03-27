import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Check } from 'lucide-react';
import { fetchForms, fetchFormFields } from '@/lib/api';
import { Form, Field, FormField, FieldSubmission, FormSubmission } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface AddSubmissionDialogProps {
  onSubmit: (submission: FormSubmission) => Promise<void>;
  workflowId: string;
}

export function AddSubmissionDialog({ onSubmit, workflowId }: AddSubmissionDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tải danh sách form khi mở dialog
  useEffect(() => {
    if (isOpen) {
      loadForms();
    }
  }, [isOpen]);
  
  // Tải danh sách fields khi chọn form
  useEffect(() => {
    if (selectedFormId) {
      loadFormFields(selectedFormId);
    } else {
      setFields([]);
    }
  }, [selectedFormId]);
  
  // Hàm tải danh sách form
  const loadForms = async () => {
    setIsLoadingForms(true);
    try {
      const response = await fetchForms(20, 0);
      if (response.data) {
        setForms(response.data.core_core_dynamic_forms);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setIsLoadingForms(false);
    }
  };
  
  // Hàm tải thông tin chi tiết form và các fields
  const loadFormFields = async (formId: string) => {
    setIsLoadingFields(true);
    try {
      console.log('Fetching fields for form ID:', formId);
      const response = await fetchFormFields(formId);
      
      if (response.data && response.data.core_core_dynamic_forms_by_pk) {
        const formDetails = response.data.core_core_dynamic_forms_by_pk;
        const formFields = formDetails.core_dynamic_form_fields;
        
        // Chuyển đổi dữ liệu để lấy danh sách fields
        const extractedFields = formFields.map((formField: FormField) => formField.core_dynamic_field);
        console.log('Received', extractedFields.length, 'fields for form ID', formId);
        setFields(extractedFields);
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };
  
  // Hàm xử lý khi người dùng chọn một form
  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
  };
  
  // Hàm xử lý khi người dùng submit form
  const handleCreateSubmission = async () => {
    if (!selectedFormId) return;
    
    setIsSubmitting(true);
    try {
      // Tạo dữ liệu submission từ danh sách fields
      const submissionData: Record<string, FieldSubmission> = {};
      
      fields.forEach(field => {
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
      
      // Gọi hàm callback để submit form
      await onSubmit({
        formId: selectedFormId,
        data: submissionData
      });
      
      // Đóng dialog sau khi submit thành công
      setIsOpen(false);
      setSelectedFormId(null);
    } catch (error) {
      console.error('Error creating submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset state khi đóng dialog
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedFormId(null);
      setFields([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          {t('submission.addNew', 'Thêm mới')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {t('submission.createNew', 'Tạo biểu mẫu mới')}
          </DialogTitle>
          <DialogDescription>
            {t('submission.selectFormDescription', 'Chọn loại biểu mẫu bạn muốn tạo.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {isLoadingForms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">{t('common.loading', 'Đang tải...')}</span>
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-sm font-medium">
                {t('submission.availableForms', 'Các biểu mẫu có sẵn:')}
              </h3>
              
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {forms.length > 0 ? (
                  forms.map((form) => (
                    <div 
                      key={form.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFormId === form.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleFormSelect(form.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{form.name}</h4>
                        {selectedFormId === form.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('submission.noFormsAvailable', 'Không có biểu mẫu nào.')}
                  </div>
                )}
              </div>
            </>
          )}
          
          {isLoadingFields && (
            <div className="flex items-center justify-center py-4 mt-4 border-t">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm">
                {t('submission.loadingFormFields', 'Đang tải thông tin biểu mẫu...')}
              </span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            {t('actions.cancel', 'Hủy')}
          </Button>
          <Button
            onClick={handleCreateSubmission}
            disabled={!selectedFormId || isLoadingFields || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {t('submission.create', 'Tạo biểu mẫu')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}