import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { fetchTransitionForm, submitTransitionForm } from '@/lib/api';

interface TransitionFormDialogProps {
  transitionId: string;
  recordId: string;
  onSubmit?: () => void;
  trigger?: React.ReactNode;
  transitionName: string;
}

interface FormField {
  id: string;
  name: string;
  value: any;
  field_type: string;
  is_required?: boolean;
}

export function TransitionFormDialog({
  transitionId,
  recordId,
  onSubmit,
  trigger,
  transitionName,
}: TransitionFormDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formValues, setFormValues] = useState<FormField[]>([]);
  
  // Truy vấn API để lấy form fields cho transition
  const { data: formData, isLoading } = useQuery({
    queryKey: ['transition-form', transitionId],
    queryFn: () => fetchTransitionForm(transitionId),
    enabled: isOpen && !!transitionId,
  });

  // Mutation để gửi dữ liệu form
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // TODO: Thay thế bằng user ID thực từ authentication system
      const userId = "5c065b51-3862-4004-ae96-ca23245aa21e"; 
      const submissionName = transitionName + " - " + new Date().toISOString();
      
      return submitTransitionForm(
        transitionId,
        recordId,
        userId,
        submissionName,
        formValues
      );
    },
    onSuccess: () => {
      toast({
        title: t('transition.success', 'Thành công'),
        description: t('transition.successDescription', 'Hành động đã được thực hiện thành công.'),
      });
      setIsOpen(false);
      if (onSubmit) onSubmit();
    },
    onError: (error) => {
      toast({
        title: t('transition.error', 'Lỗi'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  });

  // Xử lý khi mở dialog
  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    
    // Khởi tạo formValues từ dữ liệu API khi dialog mở
    if (open && formData?.data?.core_core_dynamic_workflow_transitions_by_pk?.core_dynamic_form?.core_dynamic_form_fields) {
      const fields = formData.data.core_core_dynamic_workflow_transitions_by_pk.core_dynamic_form.core_dynamic_form_fields;
      
      // Map các field từ API sang định dạng formValues
      const initialValues = fields.map((field: any) => ({
        id: field.core_dynamic_field.id,
        name: field.core_dynamic_field.name,
        field_type: field.core_dynamic_field.field_type,
        value: getDefaultValueByType(field.core_dynamic_field.field_type),
        is_required: field.is_required
      }));
      
      setFormValues(initialValues);
    }
  };

  // Hàm để lấy giá trị mặc định theo loại trường
  const getDefaultValueByType = (fieldType: string): any => {
    switch (fieldType) {
      case "TEXT":
      case "PARAGRAPH":
        return "";
      case "NUMBER":
        return 0;
      case "DATE":
        return new Date().getTime();
      case "SINGLE_CHOICE":
        return "1";
      case "MULTI_CHOICE":
        return ["1"];
      default:
        return "";
    }
  };

  // Render các lựa chọn cho trường SINGLE_CHOICE hoặc MULTI_CHOICE
  const getChoices = (fieldType: string): { label: string; value: string }[] => {
    return [
      { label: 'Lựa chọn 1', value: '1' },
      { label: 'Lựa chọn 2', value: '2' },
      { label: 'Lựa chọn 3', value: '3' },
      { label: 'Lựa chọn 4', value: '4' }
    ];
  };

  // Xử lý khi thay đổi giá trị field
  const handleValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  // Render field input dựa vào loại
  const renderFieldInput = (field: FormField) => {
    switch (field.field_type) {
      case 'TEXT':
        return (
          <Input
            placeholder="Nhập văn bản"
            value={field.value as string}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className="w-full"
            required={field.is_required}
          />
        );
      case 'PARAGRAPH':
        return (
          <Textarea
            placeholder="Nhập đoạn văn bản dài"
            value={field.value as string}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className="w-full min-h-[100px]"
            required={field.is_required}
          />
        );
      case 'NUMBER':
        return (
          <Input
            type="number"
            placeholder="0"
            value={field.value as number}
            onChange={(e) => handleValueChange(field.id, Number(e.target.value))}
            className="w-full"
            required={field.is_required}
          />
        );
      case 'DATE':
        return (
          <div className="flex items-center border rounded-md">
            <Calendar className="mr-2 h-4 w-4 ml-2" />
            <Input
              type="date"
              placeholder="Chọn một ngày"
              value={field.value ? new Date(field.value as number).toISOString().slice(0, 10) : ''}
              onChange={(e) => handleValueChange(field.id, new Date(e.target.value).getTime())}
              className="border-none"
              required={field.is_required}
            />
          </div>
        );
      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-2">
            {getChoices(field.field_type).map((choice) => (
              <div key={choice.value} className="flex items-center">
                <input
                  type="radio"
                  id={`choice-${field.id}-${choice.value}`}
                  name={`choice-group-${field.id}`}
                  value={choice.value}
                  checked={field.value === choice.value}
                  onChange={() => handleValueChange(field.id, choice.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  required={field.is_required}
                />
                <label 
                  htmlFor={`choice-${field.id}-${choice.value}`}
                  className="ml-2 text-sm font-medium"
                >
                  {choice.label}
                </label>
              </div>
            ))}
          </div>
        );
      case 'MULTI_CHOICE':
        const selectedValues = Array.isArray(field.value) ? field.value : 
                              field.value ? [field.value as string] : [];
        
        return (
          <div className="space-y-2">
            {getChoices(field.field_type).map((choice) => (
              <div key={choice.value} className="flex items-center">
                <input
                  type="checkbox"
                  id={`multi-choice-${field.id}-${choice.value}`}
                  value={choice.value}
                  checked={selectedValues.includes(choice.value)}
                  onChange={(e) => {
                    let newValues = [...selectedValues];
                    if (e.target.checked) {
                      newValues.push(choice.value);
                    } else {
                      newValues = newValues.filter(v => v !== choice.value);
                    }
                    handleValueChange(field.id, newValues);
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label 
                  htmlFor={`multi-choice-${field.id}-${choice.value}`}
                  className="ml-2 text-sm font-medium"
                >
                  {choice.label}
                </label>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className="w-full"
            required={field.is_required}
          />
        );
    }
  };

  // Xử lý submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            {transitionName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transitionName}</DialogTitle>
          <DialogDescription>
            {t('transition.fillRequired', 'Vui lòng điền thông tin cần thiết để thực hiện hành động.')}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            {formValues.map((field) => (
              <div key={field.id} className="grid gap-2">
                <div className="flex justify-between">
                  <label htmlFor={field.id} className="text-sm font-medium leading-none">
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <span className="text-xs text-muted-foreground">{field.field_type}</span>
                </div>
                {renderFieldInput(field)}
              </div>
            ))}
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? t('loading', 'Đang xử lý...') : t('transition.submit', 'Xác nhận')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}