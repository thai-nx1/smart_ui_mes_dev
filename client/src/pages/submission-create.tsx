import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchFormsByWorkflow, fetchAllMenus, submitFormData } from '@/lib/api';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField as FormFieldComponent } from '@/components/ui/FormFieldComponent';
import { FormSubmission } from '@/lib/types';

export default function SubmissionCreatePage() {
  const params = useParams<{ workflowId: string }>();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const workflowId = params.workflowId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State để lưu trữ form đã chọn
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  // State để lưu trữ các trường của form
  const [formFields, setFormFields] = useState<any[]>([]);
  
  // Truy vấn để lấy danh sách forms theo workflow
  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ['/api/workflow-forms', workflowId],
    queryFn: async () => {
      if (!workflowId) return { forms: [] };
      
      try {
        const response = await fetchFormsByWorkflow(workflowId);
        return {
          forms: response.data.core_core_dynamic_forms || []
        };
      } catch (error) {
        console.error('Error fetching forms:', error);
        return { forms: [] };
      }
    },
    enabled: !!workflowId
  });
  
  // Truy vấn để lấy thông tin menu
  const { data: menusData } = useQuery({
    queryKey: ['/api/all-menus'],
    queryFn: async () => {
      const response = await fetchAllMenus();
      return response.data.core_core_dynamic_menus;
    }
  });
  
  // Tìm workflow name dựa trên workflowId
  const findWorkflowMenu = () => {
    if (!menusData || !workflowId) return null;
    return menusData.find((menu: any) => menu.workflow_id === workflowId);
  };
  
  const workflowMenu = findWorkflowMenu();
  
  // Tự động chọn form đầu tiên khi forms được tải
  useEffect(() => {
    if (formsData?.forms && formsData.forms.length > 0 && !selectedFormId) {
      console.log("Auto-selecting first form:", formsData.forms[0].id);
      setSelectedFormId(formsData.forms[0].id);
      
      // Cũng cập nhật formFields nếu form có core_dynamic_form_fields
      if (formsData.forms[0].core_dynamic_form_fields) {
        setFormFields(formsData.forms[0].core_dynamic_form_fields);
      }
    }
  }, [formsData?.forms]);
  
  // Lấy fields cho form đã chọn
  useEffect(() => {
    if (selectedFormId && formsData?.forms) {
      console.log("Fetching fields for form ID:", selectedFormId);
      
      // Tìm form đã chọn
      const selectedForm = formsData.forms.find((form: any) => form.id === selectedFormId);
      
      if (selectedForm?.core_dynamic_form_fields) {
        setFormFields(selectedForm.core_dynamic_form_fields);
        console.log("Using pre-fetched fields data:", selectedForm.core_dynamic_form_fields.length, "fields with positions");
      }
    }
  }, [selectedFormId, formsData?.forms]);
  
  // Schema validation cho form
  const formSchema = z.object({
    fields: z.array(
      z.object({
        id: z.string(),
        value: z.any().optional()
      })
    )
  });
  
  // Setup react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: []
    }
  });
  
  // Setup field array cho form fields động
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "fields"
  });
  
  // Cập nhật form fields khi formFields thay đổi
  useEffect(() => {
    if (formFields.length > 0) {
      // Khởi tạo giá trị mặc định cho các trường
      const initialFields = formFields.map(field => {
        const fieldType = field.core_dynamic_field.field_type;
        let initialValue: any = "";
        
        // Set giá trị mặc định tùy thuộc vào loại trường
        if (fieldType === "NUMBER") initialValue = 0;
        else if (fieldType === "MULTI_CHOICE") initialValue = [];
        else if (fieldType === "SINGLE_CHOICE") initialValue = "";
        else if (fieldType === "SEARCH") initialValue = null;
        else if (fieldType === "PHOTO") initialValue = "";
        
        return {
          id: field.core_dynamic_field.id,
          value: initialValue
        };
      });
      
      // Set các field cho form
      replace(initialFields);
      
      // Log ra các giá trị mặc định cho debug
      const initialFieldValues = initialFields.reduce((acc: any, field) => {
        acc[field.id] = field.value;
        return acc;
      }, {});
      console.log("Setting initial field values:", initialFieldValues);
    }
  }, [formFields, replace]);
  
  // Xử lý khi nộp form
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedFormId || !workflowId) {
      toast({
        title: t('Lỗi'),
        description: t('Thiếu thông tin Form hoặc Workflow.'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Chuyển đổi dữ liệu từ form.data sang định dạng yêu cầu của API
      const fieldData: Record<string, any> = {};
      data.fields.forEach(field => {
        const matchingField = formFields.find(ff => ff.core_dynamic_field.id === field.id);
        if (matchingField) {
          fieldData[field.id] = {
            value: field.value,
            name: matchingField.core_dynamic_field.name,
            field_type: matchingField.core_dynamic_field.field_type
          };
        }
      });
      
      // Dữ liệu submission
      const submission: FormSubmission = {
        formId: selectedFormId,
        data: fieldData,
        workflowId: workflowId,
        menuId: workflowMenu?.id
      };
      
      // Gửi dữ liệu lên server
      await submitFormData(submission);
      
      // Hiển thị thông báo thành công
      toast({
        title: t('Thành công'),
        description: t('Biểu mẫu đã được gửi thành công.'),
        variant: 'default',
      });
      
      // Quay lại trang trước
      setLocation(`/submission/${workflowId}`);
      
      // Invalidate queries để reload dữ liệu
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records'] });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Hiển thị thông báo lỗi
      toast({
        title: t('Lỗi'),
        description: t('Có lỗi xảy ra khi gửi biểu mẫu. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout title={t('submission.createTitle', 'Tạo biểu mẫu mới')}>
      <div className="container py-6 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">
                {t('submission.createNew', 'Tạo biểu mẫu mới')}
              </CardTitle>
              <CardDescription>
                {workflowMenu?.name || t('submission.workflow', 'Workflow')}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/submission/${workflowId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            {isLoadingForms ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{t('loading.forms', 'Đang tải biểu mẫu...')}</span>
              </div>
            ) : formsData?.forms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('submission.noForms', 'Không có biểu mẫu nào cho workflow này.')}</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Form selector */}
                  {formsData?.forms.length > 1 && (
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t('submission.selectForm', 'Chọn biểu mẫu')}</label>
                      <Select
                        value={selectedFormId || undefined}
                        onValueChange={(value) => setSelectedFormId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('submission.selectFormPlaceholder', 'Chọn biểu mẫu để tiếp tục')} />
                        </SelectTrigger>
                        <SelectContent>
                          {formsData?.forms.map((form: any) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Form fields */}
                  {formFields.length > 0 && (
                    <div className="space-y-4">
                      {formFields.map((field, index) => {
                        // Tìm field tương ứng trong react-hook-form
                        const fieldIndex = form.getValues().fields.findIndex(f => f.id === field.core_dynamic_field.id);
                        
                        if (fieldIndex === -1) return null;
                        
                        return (
                          <div key={field.id} className="grid gap-2">
                            <label className="font-medium text-sm">
                              {field.core_dynamic_field.name}
                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <FormField
                              control={form.control}
                              name={`fields.${fieldIndex}.value`}
                              render={({ field: formField }) => (
                                <FormFieldComponent
                                  field={field.core_dynamic_field}
                                  isRequired={field.is_required}
                                  value={formField.value}
                                  onChange={formField.onChange}
                                  onBlur={formField.onBlur}
                                  name={formField.name}
                                  optionId={field.option_id}
                                />
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-0 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <FormMessage />
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="border-t bg-muted/30 px-6 py-4">
            <div className="flex justify-end w-full">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting || formFields.length === 0}
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
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}