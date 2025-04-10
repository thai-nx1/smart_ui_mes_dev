import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronRight } from 'lucide-react';
import Select, { SingleValue, ActionMeta } from 'react-select';

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
import { fetchTransitionForm, submitTransitionForm, fetchSearchOptions } from '@/lib/api';

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
  option_id?: string; // ID của option cho trường SEARCH
  configuration?: string; // Configuration của field dưới dạng JSON string
}

// Interface cho SearchableSelect
interface SearchableSelectProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
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
  const queryClient = useQueryClient();
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
          is_required: field.is_required,
          option_id: field.option_id, // Lấy option_id cho trường SEARCH
          configuration: field.core_dynamic_field.configuration // Lấy configuration của field
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
      // Sử dụng DEFAULT_USER_ID từ API
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
        undefined, // Sử dụng giá trị mặc định từ API function
        formSubmitterName, // Sử dụng tên mặc định theo yêu cầu
        submissionData
      );
    },
    onSuccess: () => {
      // Tải lại dữ liệu sau khi thực hiện transition thành công
      // Vô hiệu hóa tất cả các truy vấn menu-records để tải lại dữ liệu mới
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records'] });
      
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

    // Khi mở dialog, gọi ngay fetchAndSetFormFields để lấy dữ liệu và hiển thị
    if (open && transitionId) {
      fetchAndSetFormFields(transitionId);
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
      case "SEARCH":
        return null; // Giá trị mặc định cho SEARCH là null
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
      case 'SEARCH':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Tìm kiếm</span>
            </div>
            <div className="w-full">
              <SearchableSelect 
                field={field}
                value={field.value}
                onChange={(value) => handleValueChange(field.id, value)}
              />
            </div>
          </div>
        );
      case 'TEXT':
        return (
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Văn bản</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Đoạn văn bản</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Số</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Ngày tháng</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Chọn một</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Chọn nhiều</span>
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
              <span className="text-sm font-medium text-primary">{field.name}</span>
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
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-300 hover:bg-blue-300/10 transition-colors duration-200">
            <ChevronRight className="h-4 w-4 mr-1" /> {transitionName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-blue-300">
            <div className="flex items-center">
              <span className="text-blue-300">{t('transition.title', 'Xử lý phiếu')}: </span>
              <span className="ml-2 text-blue-300 font-bold">{transitionName}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {t('transition.description', 'Vui lòng điền thông tin cần thiết để tiếp tục')}
          </DialogDescription>
        </DialogHeader>

        {/* Đã tự động gọi fetchAndSetFormFields khi dialog mở */}

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
                className="bg-blue-300 hover:bg-blue-600 text-white transition-colors duration-200"
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

// Component SearchableSelect dùng react-select
function SearchableSelect({ field, value, onChange }: SearchableSelectProps) {
  const [options, setOptions] = useState<{value: string, label: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Extract the option_id from the field 
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        
        // Check if field has option_id 
        // Option ID to get in configuration with key 'option_id'
        const optionId = field.option_id || JSON.parse(field.configuration || '{}').option_id;
        
        if (!optionId) {
          console.error("Option ID is missing for SEARCH field:", field.id);
          setOptions([]);
          return;
        }
        
        // Fetch search options from API
        const response = await fetchSearchOptions(optionId);
        
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