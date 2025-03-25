import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Field, FieldType, FormState } from '@/lib/types';
import { submitFormData } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface FormFieldsProps {
  formId: string;
  fields: Field[];
}

export function FormFields({ formId, fields }: FormFieldsProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when field is changed
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formState[field.id];
      
      switch (field.field_type) {
        case 'TEXT':
          if (!value || String(value).trim() === '') {
            newErrors[field.id] = 'Vui lòng nhập văn bản';
            isValid = false;
          }
          break;
          
        case 'PARAGRAPH':
          if (!value || String(value).trim() === '') {
            newErrors[field.id] = 'Vui lòng nhập đoạn văn bản';
            isValid = false;
          }
          break;
          
        case 'NUMBER':
          if (value === undefined || value === null || value === '') {
            newErrors[field.id] = 'Vui lòng nhập một số';
            isValid = false;
          }
          break;
          
        case 'SINGLE_CHOICE':
          if (!value) {
            newErrors[field.id] = 'Vui lòng chọn một lựa chọn';
            isValid = false;
          }
          break;
          
        case 'MULTI_CHOICE':
          if (!value || !Array.isArray(value) || value.length === 0) {
            newErrors[field.id] = 'Vui lòng chọn ít nhất một lựa chọn';
            isValid = false;
          }
          break;
          
        case 'DATE':
          if (!value) {
            newErrors[field.id] = 'Vui lòng chọn một ngày';
            isValid = false;
          }
          break;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng kiểm tra lại thông tin đã nhập",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitFormData({
        formId,
        data: formState
      });
      
      // Reset form after successful submission
      setFormState({});
      
      toast({
        title: "Thành công",
        description: "Đã gửi form thành công!",
        variant: "default"
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi form. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormState({});
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <InputField
          key={field.id}
          id={field.id}
          name={field.name}
          description={field.description}
          fieldType={field.field_type as FieldType}
          value={formState[field.id]}
          onChange={(value) => handleFieldChange(field.id, value)}
          options={field.options}
          error={errors[field.id]}
        />
      ))}

      <div className={`mt-8 ${isMobile ? 'fixed bottom-0 left-0 right-0 flex p-4 bg-white border-t border-gray-200 z-10 space-x-2' : 'flex justify-end'}`}>
        {isMobile ? (
          // Mobile layout
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Form'}
            </Button>
          </>
        ) : (
          // Desktop layout
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="mr-3"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi Form
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {/* Add padding at the bottom when on mobile to account for fixed buttons */}
      {isMobile && <div className="pb-20"></div>}
    </form>
  );
}
