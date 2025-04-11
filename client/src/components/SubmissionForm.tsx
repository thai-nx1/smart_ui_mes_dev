import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Form as UIForm, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Loader2, Check, ArrowLeft, Camera, Mic, Video, RefreshCw } from 'lucide-react';
import { fetchForms, fetchFormFields, fetchMenuForms, fetchAllMenus, fetchSearchOptions } from '@/lib/api';
import { Form, Field, FormField as FormFieldType, FieldSubmission, FormSubmission } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import Select, { SingleValue, ActionMeta } from 'react-select';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useLocation } from 'wouter';

interface SubmissionFormProps {
  workflowId: string;
  onSubmit: (submission: FormSubmission) => Promise<void>;
  onCancel?: () => void;
}

export function SubmissionForm({ workflowId, onSubmit, onCancel }: SubmissionFormProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  
  // Tải danh sách form khi component được mount và tự động chọn form đầu tiên
  useEffect(() => {
    loadForms().then(() => {
      // Trong useEffect không thể trực tiếp sử dụng giá trị forms mới nhất
      // Vì vậy, chúng ta sẽ lấy giá trị mới trong callback của loadForms()
      setTimeout(() => {
        if (forms.length > 0) {
          console.log("Auto-selecting first form:", forms[0].id);
          handleFormSelect(forms[0].id);
        }
      }, 100);
    });
  }, []);
  
  // Tải danh sách form
  const loadForms = async () => {
    setIsLoadingForms(true);
    
    try {
      let formsList: Form[] = [];
      
      // Nếu có workflowId, tìm form theo workflow
      if (workflowId) {
        console.log("Fetching forms for workflow:", workflowId);
        const response = await fetchMenuForms(workflowId, "CREATE");
        if (response.data && response.data.core_core_dynamic_menu_forms) {
          // Extract các form từ menu_forms
          formsList = response.data.core_core_dynamic_menu_forms
            .filter((menuForm: any) => menuForm.form_type === 'CREATE') // Chỉ lấy form loại CREATE
            .map((menuForm: any) => menuForm.core_dynamic_form)
            .filter(Boolean); // Loại bỏ các giá trị null/undefined
        }
      }
      
      // Nếu không tìm thấy form theo workflow hoặc không có workflowId, lấy tất cả form
      if (formsList.length === 0) {
        console.log("Fetching all forms");
        const response = await fetchForms();
        if (response.data && response.data.core_core_dynamic_forms) {
          formsList = response.data.core_core_dynamic_forms;
        }
      }
      
      console.log("Forms loaded:", formsList.length);
      setForms(formsList);
    } catch (error) {
      console.error("Error loading forms:", error);
      toast({
        title: t('error.loadingForms', 'Lỗi tải form'),
        description: t('error.tryAgain', 'Vui lòng thử lại sau'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingForms(false);
    }
  };
  
  // Xử lý khi chọn form
  const handleFormSelect = async (formId: string) => {
    setSelectedFormId(formId);
    
    if (formId) {
      setIsLoadingFields(true);
      try {
        // Tải danh sách field của form
        const response = await fetchFormFields(formId);
        if (response.data && response.data.core_core_dynamic_forms_by_pk) {
          const formFields = response.data.core_core_dynamic_forms_by_pk.core_dynamic_form_fields || [];
          console.log("Form fields loaded:", formFields.length);
          
          // Extract các field từ form_fields
          const extractedFields = formFields.map((formField: FormFieldType) => formField.core_dynamic_field);
          setFields(extractedFields);
          
          // Khởi tạo giá trị mặc định cho các field
          const initialValues: Record<string, any> = {};
          extractedFields.forEach(field => {
            if (field.field_type === 'NUMBER') {
              initialValues[field.id] = 0;
            } else if (field.field_type === 'SINGLE_CHOICE' || field.field_type === 'MULTI_CHOICE') {
              initialValues[field.id] = field.field_type === 'MULTI_CHOICE' ? [] : '';
            } else {
              initialValues[field.id] = '';
            }
          });
          setFieldValues(initialValues);
        }
      } catch (error) {
        console.error("Error loading form fields:", error);
        toast({
          title: t('error.loadingFields', 'Lỗi tải trường dữ liệu'),
          description: t('error.tryAgain', 'Vui lòng thử lại sau'),
          variant: 'destructive',
        });
      } finally {
        setIsLoadingFields(false);
      }
    }
  };
  
  // Hàm xử lý khi người dùng thay đổi giá trị của field
  const handleFieldValueChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Hàm xử lý khi người dùng submit form
  const handleCreateSubmission = async () => {
    if (!selectedFormId) return;
    
    setIsSubmitting(true);
    try {
      // Tạo dữ liệu submission từ danh sách fields và giá trị đã nhập
      const submissionData: Record<string, FieldSubmission> = {};
      
      fields.forEach(field => {
        // Sử dụng giá trị đã nhập hoặc giá trị mặc định
        const fieldValue = fieldValues[field.id] !== undefined ? fieldValues[field.id] : null;
        
        // Thêm field vào dữ liệu submission
        submissionData[field.id] = {
          name: field.name,
          value: fieldValue,
          field_type: field.field_type
        };
      });
      
      // Gọi hàm callback để submit form với dữ liệu mở rộng
      await onSubmit({
        formId: selectedFormId,
        data: submissionData,
        workflowId // Truyền workflowId được cung cấp từ props
      });
      
      // Xử lý sau khi submit thành công
      toast({
        title: t('submission.createSuccess', 'Tạo biểu mẫu thành công'),
        description: t('submission.recordSaved', 'Dữ liệu đã được lưu thành công'),
      });
      
      // Quay lại trang danh sách nếu có hàm onCancel, nếu không thì reset form
      if (onCancel) {
        onCancel();
      } else {
        // Reset form state
        setFieldValues({});
        // Quay lại trang danh sách
        navigate(`/submission/${workflowId}`);
      }
    } catch (error) {
      console.error("Error creating submission:", error);
      toast({
        title: t('error.submissionFailed', 'Lỗi tạo biểu mẫu'),
        description: t('error.tryAgain', 'Vui lòng thử lại sau'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('submission.addNew', 'Nhập dữ liệu')}</CardTitle>
        <CardDescription>
          {t('submission.enterData', 'Vui lòng nhập thông tin vào biểu mẫu.')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoadingFields ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('loading.formFields', 'Đang tải trường dữ liệu...')}</p>
          </div>
        ) : fields.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t('submission.noFields', 'Không có trường dữ liệu nào')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field) => (
              <FormItem key={field.id} className="relative">
                <FormLabel className="text-base">{field.name}</FormLabel>
                {field.description && (
                  <FormDescription className="text-xs text-gray-500 mt-0">
                    {field.description}
                  </FormDescription>
                )}
                <div className="absolute right-0 top-0">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {field.field_type}
                  </span>
                </div>
                
                <FormControl>
                  {/* Xử lý từng loại field */}
                  {field.field_type === 'TEXT' && (
                    <Input
                      type="text"
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      placeholder={`${t('placeholder.enter', 'Nhập')} ${field.name.toLowerCase()}`}
                    />
                  )}
                  
                  {field.field_type === 'PARAGRAPH' && (
                    <Textarea
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      placeholder={`${t('placeholder.enter', 'Nhập')} ${field.name.toLowerCase()}`}
                      rows={3}
                    />
                  )}
                  
                  {field.field_type === 'NUMBER' && (
                    <Input
                      type="number"
                      value={fieldValues[field.id] || 0}
                      onChange={(e) => handleFieldValueChange(field.id, parseInt(e.target.value) || 0)}
                      placeholder={`${t('placeholder.enter', 'Nhập')} ${field.name.toLowerCase()}`}
                    />
                  )}
                  
                  {field.field_type === 'DATE' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !fieldValues[field.id] && "text-muted-foreground"
                          )}
                        >
                          {fieldValues[field.id] ? (
                            format(new Date(fieldValues[field.id]), "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>{t('placeholder.selectDate', 'Chọn ngày')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fieldValues[field.id] ? new Date(fieldValues[field.id]) : undefined}
                          onSelect={(date) => handleFieldValueChange(field.id, date ? date.getTime() : null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  {field.field_type === 'SINGLE_CHOICE' && field.options && (
                    <RadioGroup
                      value={fieldValues[field.id] || ''}
                      onValueChange={(value) => handleFieldValueChange(field.id, value)}
                    >
                      {field.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${field.id}-${option.id}`} />
                          <Label htmlFor={`${field.id}-${option.id}`}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {field.field_type === 'MULTI_CHOICE' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${field.id}-${option.id}`}
                            checked={Array.isArray(fieldValues[field.id]) && fieldValues[field.id].includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentValues = Array.isArray(fieldValues[field.id]) ? [...fieldValues[field.id]] : [];
                              if (checked) {
                                if (!currentValues.includes(option.value)) {
                                  handleFieldValueChange(field.id, [...currentValues, option.value]);
                                }
                              } else {
                                handleFieldValueChange(field.id, currentValues.filter(v => v !== option.value));
                              }
                            }}
                          />
                          <Label htmlFor={`${field.id}-${option.id}`}>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.field_type === 'GPS' && (
                    <>
                      <div className="flex items-center">
                        <Input
                          value={fieldValues[field.id] ? `${fieldValues[field.id].lat}, ${fieldValues[field.id].lng}` : ''}
                          className="flex-1 mr-2"
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            try {
                              toast({
                                title: "Đang xác định vị trí",
                                description: "Vui lòng cho phép quyền truy cập vị trí",
                              });
                              
                              // Import và sử dụng hàm lấy vị trí GPS
                              const { getGPSLocation } = await import('../lib/special-field-handlers');
                              const result = await getGPSLocation();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu vị trí
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Xác định vị trí thành công",
                                });
                              } else {
                                toast({
                                  title: "Xác định vị trí thất bại",
                                  description: result.message || "Không thể xác định vị trí",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi xác định vị trí GPS:", error);
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {field.field_type === 'AUDIO_RECORD' && (
                    <>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:audio/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <audio 
                            className="w-full" 
                            controls
                            src={fieldValues[field.id]}
                          ></audio>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            {t('actions.delete', 'Xóa')}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={async () => {
                            try {
                              const { recordAudio } = await import('../lib/special-field-handlers');
                              const result = await recordAudio();
                              
                              if (result.success && result.data) {
                                handleFieldValueChange(field.id, result.data);
                              } else {
                                toast({
                                  title: "Ghi âm thất bại",
                                  description: result.message || "Không thể ghi âm",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi ghi âm:", error);
                            }
                          }}
                        >
                          <Mic className="h-4 w-4" />
                          <span>{t('actions.record', 'Ghi âm')}</span>
                        </Button>
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'SCREEN_RECORD' && (
                    <>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:video/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <video 
                            className="w-full" 
                            controls
                            src={fieldValues[field.id]}
                          ></video>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            {t('actions.delete', 'Xóa')}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={async () => {
                            try {
                              const { recordScreen } = await import('../lib/special-field-handlers');
                              const result = await recordScreen();
                              
                              if (result.success && result.data) {
                                handleFieldValueChange(field.id, result.data);
                              } else {
                                toast({
                                  title: "Ghi màn hình thất bại",
                                  description: result.message || "Không thể ghi màn hình",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi ghi màn hình:", error);
                            }
                          }}
                        >
                          <Video className="h-4 w-4" />
                          <span>{t('actions.recordScreen', 'Ghi màn hình')}</span>
                        </Button>
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'PHOTO' && (
                    <>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:image/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <img 
                            className="w-full h-auto max-h-64 object-contain" 
                            src={fieldValues[field.id]}
                            alt={field.name}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            {t('actions.delete', 'Xóa')}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={async () => {
                            try {
                              const { takePhoto } = await import('../lib/special-field-handlers');
                              const result = await takePhoto();
                              
                              if (result.success && result.data) {
                                handleFieldValueChange(field.id, result.data);
                              } else {
                                toast({
                                  title: "Chụp ảnh thất bại",
                                  description: result.message || "Không thể chụp ảnh",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi chụp ảnh:", error);
                            }
                          }}
                        >
                          <Camera className="h-4 w-4" />
                          <span>{t('actions.takePhoto', 'Chụp ảnh')}</span>
                        </Button>
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'SEARCH' && (
                    <SearchableSelect
                      field={field}
                      value={fieldValues[field.id]}
                      onChange={(value) => handleFieldValueChange(field.id, value)}
                    />
                  )}
                </FormControl>
              </FormItem>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={onCancel || (() => navigate(`/submission/${workflowId}`))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.cancel', 'Hủy')}
        </Button>
        
        <Button
          onClick={handleCreateSubmission}
          disabled={isSubmitting || isLoadingFields}
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
      </CardFooter>
    </Card>
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