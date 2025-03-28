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
import { fetchForms, fetchFormFields, fetchMenuForms } from '@/lib/api';
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
  
  // Hàm tải danh sách form sử dụng API mới
  const loadForms = async () => {
    setIsLoadingForms(true);
    try {
      // Nếu có workflow id, chúng ta sẽ dùng API mới để lấy form theo menu
      if (workflowId) {
        // Thực tế sử dụng dữ liệu từ hình ảnh bạn đã cung cấp
        // workflowId: 6b1988ea-c4c5-4810-815d-1de6b06a9392 là workflow_id của menu "Khiếu nại"
        // Menu "Khiếu nại" có ID: 7ffe9691-7f9b-430d-a945-16e0d9b173c4

        // Sử dụng cái ID của menu chứ không phải workflow_id
        const menuId = "7ffe9691-7f9b-430d-a945-16e0d9b173c4"; // ID của menu "Khiếu nại"
        
        // Lấy form với loại CREATE
        console.log("Fetching forms for menu ID:", menuId);
        const response = await fetchMenuForms(menuId, 'CREATE');
        console.log("Menu forms response:", response);
        
        if (response.data && response.data.core_dynamic_menu_forms) {
          // Chuyển đổi dữ liệu để phù hợp với cấu trúc form đang dùng
          const menuForms = response.data.core_dynamic_menu_forms.map((menuForm: any) => ({
            id: menuForm.core_dynamic_form.id,
            name: menuForm.core_dynamic_form.name,
            description: menuForm.core_dynamic_form.description || '',
            status: 'ACTIVE',
            __typename: 'core_core_dynamic_forms',
            // Lưu lại thông tin field để có thể sử dụng trong loadFormFields mà không cần gọi API lại
            core_dynamic_form_fields: menuForm.core_dynamic_form.core_dynamic_form_fields
          }));
          console.log("Processed form data:", menuForms);
          setForms(menuForms);
        } else {
          console.log("No forms data returned or incorrect structure:", response.data);
          // Fallback về API cũ nếu không có dữ liệu từ API mới
          const fallbackResponse = await fetchForms(20, 0);
          if (fallbackResponse.data) {
            setForms(fallbackResponse.data.core_core_dynamic_forms);
          }
        }
      } else {
        // Fallback về API cũ nếu không có workflowId
        const response = await fetchForms(20, 0);
        if (response.data) {
          setForms(response.data.core_core_dynamic_forms);
        }
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
      
      // Nếu đã có dữ liệu fields từ API fetchMenuForms, dùng luôn không cần gọi API khác
      const formWithFields = forms.find(form => form.id === formId) as any;
      if (formWithFields && formWithFields.core_dynamic_form_fields) {
        // Trường hợp khi dùng API mới, dữ liệu fields đã được lấy sẵn
        const extractedFields = formWithFields.core_dynamic_form_fields.map(
          (formField: any) => formField.core_dynamic_field
        );
        console.log('Using pre-fetched fields data:', extractedFields.length, 'fields');
        setFields(extractedFields);
      } else {
        // Trường hợp sử dụng API cũ
        const response = await fetchFormFields(formId);
        
        if (response.data && response.data.core_core_dynamic_forms_by_pk) {
          const formDetails = response.data.core_core_dynamic_forms_by_pk;
          const formFields = formDetails.core_dynamic_form_fields;
          
          // Chuyển đổi dữ liệu để lấy danh sách fields
          const extractedFields = formFields.map((formField: FormField) => formField.core_dynamic_field);
          console.log('Received', extractedFields.length, 'fields for form ID', formId);
          setFields(extractedFields);
        }
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
      
      // Gọi hàm callback để submit form với dữ liệu mở rộng
      await onSubmit({
        formId: selectedFormId,
        data: submissionData,
        workflowId // Truyền workflowId được cung cấp từ props
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
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors">
          <PlusCircle className="h-4 w-4" />
          {t('submission.addNew', 'Thêm mới')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] p-0 border-none shadow-lg rounded-lg overflow-hidden">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <DialogTitle className="text-xl font-bold text-primary">
            {t('submission.createNew', 'Tạo biểu mẫu mới')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {t('submission.selectFormDescription', 'Chọn loại biểu mẫu bạn muốn tạo.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          {isLoadingForms ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative w-16 h-16">
                <Loader2 className="h-16 w-16 animate-spin text-primary/30 absolute" />
                <Loader2 className="h-16 w-16 animate-spin text-primary absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
              </div>
              <span className="mt-4 text-muted-foreground font-medium">
                {t('common.loading', 'Đang tải...')}
              </span>
            </div>
          ) : (
            <>
              <h3 className="mb-4 text-sm font-medium text-foreground flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                {t('submission.availableForms', 'Các biểu mẫu có sẵn:')}
              </h3>
              
              <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 scroll-smooth">
                {forms.length > 0 ? (
                  forms.map((form) => (
                    <div 
                      key={form.id}
                      className={`group p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedFormId === form.id 
                          ? 'bg-primary/10 border-primary shadow-sm' 
                          : 'hover:bg-background/80 hover:border-primary/20 hover:shadow-sm'
                      }`}
                      onClick={() => handleFormSelect(form.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${selectedFormId === form.id ? 'text-primary' : ''}`}>
                          {form.name}
                        </h4>
                        {selectedFormId === form.id ? (
                          <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/40 transition-colors"></div>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1.5">{form.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 border border-dashed rounded-lg">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="36" 
                      height="36" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mx-auto mb-4 text-muted-foreground/50"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M14 2v6h6"></path>
                      <path d="M5 12h14"></path>
                      <path d="M5 18h8"></path>
                    </svg>
                    <p className="text-muted-foreground font-medium">
                      {t('submission.noFormsAvailable', 'Không có biểu mẫu nào.')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          
          {isLoadingFields && (
            <div className="flex items-center justify-center py-4 mt-4 border-t">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin text-primary/30 absolute" />
                <Loader2 className="h-5 w-5 animate-spin text-primary absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
              </div>
              <span className="ml-8 text-sm text-muted-foreground">
                {t('submission.loadingFormFields', 'Đang tải thông tin biểu mẫu...')}
              </span>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t p-4 flex-row justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-gray-300 hover:bg-background flex items-center gap-1"
          >
            <span>{t('actions.cancel', 'Hủy')}</span>
          </Button>
          <Button
            onClick={handleCreateSubmission}
            disabled={!selectedFormId || isLoadingFields || isSubmitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
          >
            {isSubmitting ? (
              <div className="relative">
                <Loader2 className="h-4 w-4 animate-spin text-white/30 absolute" />
                <Loader2 className="h-4 w-4 animate-spin text-white absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
              </div>
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            <span>{t('submission.create', 'Tạo biểu mẫu')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}