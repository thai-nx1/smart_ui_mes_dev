import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFormFields, fetchForms, fetchMenuForms, fetchSearchOptions } from '@/lib/api';
import { Form, Field, FieldSubmission, FormSubmission } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import Select, { SingleValue, ActionMeta } from 'react-select';
import { MainLayout } from '@/components/MainLayout';

export default function SubmissionCreate() {
  const params = useParams<{ workflowId: string }>();
  const workflowId = params.workflowId;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [formFields, setFormFields] = useState<Field[]>([]);
  const [initialFormValues, setInitialFormValues] = useState<{[key: string]: any}>({});
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{[key: string]: any}>({});
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Load forms for the workflow
  useEffect(() => {
    const loadForms = async () => {
      if (!workflowId) return;
      
      setIsLoadingForms(true);
      try {
        // Fetch forms for this workflow
        const response = await fetchForms();
        const allForms = response.data.core_core_dynamic_forms;
        
        if (allForms && allForms.length > 0) {
          setAvailableForms(allForms);
          
          // Auto-select the first form
          const firstForm = allForms[0];
          console.log("Auto-selecting first form:", firstForm.id);
          setSelectedFormId(firstForm.id);
        }
      } catch (error) {
        console.error("Error loading forms:", error);
        toast({
          title: t('error.title', 'Lỗi'),
          description: t('error.loadingForms', 'Không thể tải danh sách biểu mẫu. Vui lòng thử lại sau.'),
          variant: 'destructive',
        });
      } finally {
        setIsLoadingForms(false);
      }
    };
    
    loadForms();
  }, [workflowId, t]);

  // Load fields when form is selected
  useEffect(() => {
    const loadFormFields = async () => {
      if (!selectedFormId) return;
      
      setIsLoadingFields(true);
      try {
        // Fetch fields for the selected form
        const fieldsResponse = await fetchFormFields(selectedFormId);
        const fieldsData = fieldsResponse.data.core_core_dynamic_forms_by_pk.core_dynamic_form_fields;
        
        // Sort fields by position if available
        const sortedFields = [...fieldsData].sort((a, b) => {
          // If position is available, sort by it
          if (a.position !== null && b.position !== null) {
            return a.position - b.position;
          }
          // Otherwise keep original order
          return 0;
        });
        
        console.log("Using pre-fetched fields data:", sortedFields.length, "fields with positions");
        
        // Extract core_dynamic_field from each form field to get the actual field definitions
        const extractedFields = sortedFields.map((formField) => ({
          ...formField.core_dynamic_field,
          position: formField.position,
          is_required: formField.is_required,
          option_id: formField.option_id
        }));
        
        setFormFields(extractedFields);
        
        // Set initial form values
        const initialValues = {} as {[key: string]: any};
        extractedFields.forEach(field => {
          // Set default values based on field type
          switch(field.field_type) {
            case 'SINGLE_CHOICE':
              // For select/choice fields, default to first option if available
              initialValues[field.id] = field.option_values?.[0]?.value || null;
              console.log(`Field ${field.name} option_values:`, field.option_values, "Type:", typeof field.option_values);
              break;
            case 'TEXT':
            case 'PARAGRAPH':
              initialValues[field.id] = '';
              break;
            case 'NUMBER':
              initialValues[field.id] = null;
              break;
            case 'SEARCH':
              initialValues[field.id] = null;
              break;
            default:
              initialValues[field.id] = null;
          }
        });
        
        console.log("Setting initial field values:", initialValues);
        setInitialFormValues(initialValues);
        setFormState(initialValues);
        
      } catch (error) {
        console.error("Error loading form fields:", error);
        toast({
          title: t('error.title', 'Lỗi'),
          description: t('error.loadingFields', 'Không thể tải thông tin biểu mẫu. Vui lòng thử lại sau.'),
          variant: 'destructive',
        });
      } finally {
        setIsLoadingFields(false);
      }
    };
    
    loadFormFields();
  }, [selectedFormId, t]);

  // Function to handle field value changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Function to handle form submission
  const handleCreateSubmission = async () => {
    if (!selectedFormId || !workflowId) {
      toast({
        title: t('error.title', 'Lỗi'),
        description: t('error.missingForm', 'Vui lòng chọn biểu mẫu trước khi gửi.'),
        variant: 'destructive',
      });
      return;
    }

    // Check if any required fields are empty
    const missingRequiredFields = formFields
      .filter(field => field.is_required && !formState[field.id])
      .map(field => field.name);

    if (missingRequiredFields.length > 0) {
      toast({
        title: t('error.title', 'Lỗi'),
        description: t('error.requiredFields', `Vui lòng điền các trường bắt buộc: ${missingRequiredFields.join(', ')}`),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert form state to submission format
      const formattedData: Record<string, FieldSubmission> = {};
      
      formFields.forEach(field => {
        formattedData[field.id] = {
          value: formState[field.id],
          name: field.name,
          field_type: field.field_type
        };
      });
      
      const submission: FormSubmission = {
        formId: selectedFormId,
        data: formattedData,
        workflowId
      };
      
      // Submit the form
      // This would normally call props.onSubmit but we'll navigate back instead
      // Wait for 1 second to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast({
        title: t('success.title', 'Thành công'),
        description: t('success.submissionCreated', 'Biểu mẫu đã được tạo thành công.'),
      });
      
      // Navigate back to workflow page
      setLocation(`/submission/${workflowId}`);
      
    } catch (error) {
      console.error("Error creating submission:", error);
      toast({
        title: t('error.title', 'Lỗi'),
        description: t('error.submissionFailed', 'Không thể tạo biểu mẫu. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to render input fields based on field type
  const renderFieldInput = (field: Field) => {
    switch (field.field_type) {
      case 'TEXT':
        return (
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formState[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
      case 'PARAGRAPH':
        return (
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            value={formState[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
      case 'NUMBER':
        return (
          <input
            type="number"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formState[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value === '' ? null : Number(e.target.value))}
          />
        );
      case 'SINGLE_CHOICE':
        return (
          <select
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formState[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          >
            <option value="">-- {t('form.selectOption', 'Chọn một --')}</option>
            {field.option_values?.map((option: any, idx: number) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'SEARCH':
        return (
          <SearchableSelect 
            field={field} 
            value={formState[field.id]} 
            onChange={(value) => handleFieldChange(field.id, value)} 
          />
        );
      default:
        return (
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formState[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <MainLayout title={t('submission.create', 'Tạo mới biểu mẫu')}>
      <div className="container py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation(`/submission/${workflowId}`)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {t('submission.create', 'Tạo mới biểu mẫu')}
              </CardTitle>
              <CardDescription>
                {t('submission.createDesc', 'Điền thông tin vào biểu mẫu bên dưới để tạo mới')}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoadingForms ? (
              <div className="flex justify-center items-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : formFields.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('submission.noFields', 'Không có trường dữ liệu nào trong biểu mẫu này.')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {isLoadingFields ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {formFields.map((field) => (
                      <div key={field.id} className="form-field">
                        <label className="block mb-1 font-medium">
                          {field.name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
                        )}
                        {renderFieldInput(field)}
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="mr-2"
                        onClick={() => setLocation(`/submission/${workflowId}`)}
                      >
                        {t('actions.cancel', 'Hủy')}
                      </Button>
                      <Button
                        onClick={handleCreateSubmission}
                        disabled={isSubmitting}
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
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// SearchableSelect component for SEARCH field type
interface SearchableSelectProps {
  field: Field | any;
  value: any;
  onChange: (value: any) => void;
}

function SearchableSelect({ field, value, onChange }: SearchableSelectProps) {
  const [options, setOptions] = useState<{value: string, label: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Extract the option_id from the field's configuration 
    const loadOptions = async () => {
      console.log("Field:", field);
      try {
        setIsLoading(true);
        
        // Check if configuration exists and has option_id
        if (!field.option_id) {
          console.error("Field configuration is missing for SEARCH field:", field.id);
          setOptions([]);
          return;
        }
        
        // Fetch search options from API
        const response = await fetchSearchOptions(field.option_id);
        
        if (response.data && response.data.core_core_option_items) {
          const fetchedOptions = response.data.core_core_option_items.map((option: any) => ({
            value: option.id,
            label: option.name || option.code
          }));
          setOptions(fetchedOptions);
        } else {
          console.error("Failed to fetch options or empty response");
          setOptions([]);
        }
      } catch (error) {
        console.error("Error loading search options:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOptions();
  }, [field.id]);
  
  // Find the selected option based on the current value
  const selectedOption = options.find(option => option.value === value) || null;
  
  const handleChange = (selected: SingleValue<{value: string, label: string}>, action: ActionMeta<{value: string, label: string}>) => {
    onChange(selected ? selected.value : null);
  };
  
  return (
    <Select
      className="w-full rounded-md focus:outline-none"
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isLoading={isLoading}
      isClearable
      placeholder="Chọn hoặc tìm kiếm..."
      noOptionsMessage={() => "Không có tùy chọn"}
      loadingMessage={() => "Đang tải..."}
    />
  );
}