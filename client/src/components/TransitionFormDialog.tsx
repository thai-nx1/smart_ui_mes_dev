import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, ChevronRight } from 'lucide-react';

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
  form_field_id?: string; // ID của form_field để tạo key duy nhất
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
  const { data: formData, isLoading, refetch } = useQuery({
    queryKey: ['transition-form', transitionId],
    queryFn: () => fetchTransitionForm(transitionId),
    enabled: isOpen && !!transitionId,
  });

  // Hàm để load form fields khi bấm vào nút transition
  const fetchAndSetFormFields = async (transitionId: string) => {
    try {
      const result = await fetchTransitionForm(transitionId);

      if (result?.data?.core_core_dynamic_workflow_transitions_by_pk?.core_dynamic_form?.core_dynamic_form_fields) {
        const fields = result.data.core_core_dynamic_workflow_transitions_by_pk.core_dynamic_form.core_dynamic_form_fields;

        // Map các field từ API sang định dạng formValues
        const initialValues = fields.map((field: any) => ({
          id: field.core_dynamic_field.id,
          form_field_id: field.id,
          name: field.core_dynamic_field.name,
          field_type: field.core_dynamic_field.field_type,
          value: getDefaultValueByType(field.core_dynamic_field.field_type),
          is_required: field.is_required
        }));

        setFormValues(initialValues);
      }
    } catch (error) {
      console.error('Error fetching form fields:', error);
      toast({
        title: t('transition.error', 'Lỗi'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  };

  // Mutation để gửi dữ liệu form
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // TODO: Thay thế bằng user ID thực từ authentication system
      const currentUserId = "5c065b51-3862-4004-ae96-ca23245aa21e"; 
      const formName = transitionName + " - " + new Date().toISOString();

      // Chuẩn bị dữ liệu để gửi đi, loại bỏ trường form_field_id vì API không cần
      const submissionData = formValues.map(field => ({
        id: field.id,
        name: field.name,
        value: field.value,
        field_type: field.field_type
      }));

      // Đảm bảo các tham số khớp với API
      const formSubmitterName = "HungDN";
      
      return submitTransitionForm(
        transitionId,
        recordId,
        currentUserId,
        formSubmitterName, // Sử dụng tên mặc định theo yêu cầu
        submissionData
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
      // Sử dụng id của form_field để đảm bảo keys luôn unique ngay cả khi có trùng field
      const initialValues = fields.map((field: any) => ({
        id: field.core_dynamic_field.id,
        form_field_id: field.id, // Thêm ID của form_field để tạo key duy nhất
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
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">TEXT</span>
            </div>
            <Input
              placeholder="Nhập văn bản"
              value={field.value as string}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="w-full"
              required={field.is_required}
            />
          </div>
        );
      case 'PARAGRAPH':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">PARAGRAPH</span>
            </div>
            <Textarea
              placeholder="Nhập đoạn văn bản dài"
              value={field.value as string}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="w-full min-h-[100px]"
              required={field.is_required}
            />
          </div>
        );
      case 'NUMBER':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">NUMBER</span>
            </div>
            <Input
              type="number"
              placeholder="0"
              value={field.value as number}
              onChange={(e) => handleValueChange(field.id, Number(e.target.value))}
              className="w-full"
              required={field.is_required}
            />
          </div>
        );
      case 'DATE':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">DATE</span>
            </div>
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
          </div>
        );
      case 'SINGLE_CHOICE':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">SINGLE_CHOICE</span>
            </div>
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
          </div>
        );
      case 'MULTI_CHOICE':
        const selectedValues = Array.isArray(field.value) ? field.value : 
                              field.value ? [field.value as string] : [];

        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">MULTI_CHOICE</span>
            </div>
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
          </div>
        );
      default:
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-500">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{field.field_type}</span>
            </div>
            <Input
              value={field.value as string}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="w-full"
              required={field.is_required}
            />
          </div>
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
          <DialogTitle className="text-xl font-medium text-blue-500">Xem dữ liệu biểu mẫu</DialogTitle>
          <DialogDescription>
            Chi tiết thông tin của biểu mẫu đã nộp.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 border-b">
          <h3 className="text-base font-medium">Hành động có sẵn:</h3>
          <div className="mt-2 flex space-x-2">
            <span 
              className="px-3 py-1 border border-blue-500 text-blue-500 rounded-full text-sm cursor-pointer hover:bg-blue-50"
              onClick={() => {
                // Tự động chọn transition hiện tại để hiện form
                fetchAndSetFormFields(transitionId);
              }}
            >
              {transitionName} →
            </span>
          </div>
        </div>

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
              <div key={field.form_field_id || `field-${field.id}-${Math.random().toString(36).substr(2, 9)}`} className="grid gap-2">
                {renderFieldInput(field)}
              </div>
            ))}

            <div className="flex justify-end mt-6">
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                {isPending ? t('loading', 'Đang xử lý...') : t('transition.submit', 'Đồng ý')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}