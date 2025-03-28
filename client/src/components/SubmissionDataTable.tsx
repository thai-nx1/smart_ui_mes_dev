import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldValue } from '@/lib/types';
import { Edit, X, Save, Eye, Calendar, Table, LayoutGrid, Search, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { fetchMenuViewForm, fetchWorkflowTransitionsByStatus } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface FieldData {
  id: string;
  name: string;
  value: FieldValue;
  field_type: string;
}

type ViewMode = 'card' | 'table';

interface SubmissionDataTableProps {
  data: any[];
  onSave?: (data: FieldData[]) => Promise<boolean | void>;
  readOnly?: boolean;
  viewMode?: ViewMode;
  menuId?: string; // ID của menu để lấy thông tin form
  workflowId?: string; // ID của workflow để lấy transitions
  formData?: any; // Data của form VIEW từ API fetchMenuViewForm
}

export function SubmissionDataTable({ 
  data, 
  onSave, 
  readOnly = true, // Mặc định là chỉ xem
  viewMode = 'card',
  menuId,
  workflowId,
  formData
}: SubmissionDataTableProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FieldData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);
  
  // State cho tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  
  // Lấy thông tin form từ API nếu có menuId và không có formData từ props
  const { data: formDataFromAPI } = useQuery({
    queryKey: ['menu-view-form', menuId],
    queryFn: () => menuId ? fetchMenuViewForm(menuId) : Promise.resolve(null),
    enabled: !!menuId && !formData
  });
  
  // State cho thông tin transitions
  const [currentStatusId, setCurrentStatusId] = useState<string>("");
  
  // Lấy transitions từ API nếu có workflowId và statusId
  const { data: transitionsData } = useQuery({
    queryKey: ['workflow-transitions', workflowId, currentStatusId],
    queryFn: () => workflowId && currentStatusId 
      ? fetchWorkflowTransitionsByStatus(workflowId, currentStatusId) 
      : Promise.resolve(null),
    enabled: !!workflowId && !!currentStatusId
  });

  // Format thời gian từ timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Xử lý khi nhấn nút chỉnh sửa tất cả
  const handleEdit = (submission: any) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.data)) {
      setEditedData([...submission.data]);
    } else {
      setEditedData([]);
    }
    setDialogOpen(true);
    setIsEditing(false);
  };

  // Xử lý khi nhấn nút xem tất cả
  const handleView = (submission: any) => {
    setSelectedSubmission(submission);
    console.log('Viewing submission:', submission);
    if (Array.isArray(submission.data)) {
      setEditedData([...submission.data]);
      console.log('All fields in submission data:', submission.data.map((f: FieldData) => `${f.name} (${f.field_type}): ${JSON.stringify(f.value)}`));
      
      // Tìm trạng thái hiện tại trong dữ liệu submission
      // Mở rộng tìm kiếm với nhiều tên khả dĩ cho trường status
      const statusField = submission.data.find((field: FieldData) => 
        field.name.toLowerCase().includes('trạng thái') || 
        field.name.toLowerCase() === 'status' ||
        field.name.toLowerCase() === 'trang_thai' ||
        field.name.toLowerCase() === 'state' ||
        field.name.toLowerCase().includes('loại dừng'));
      
      if (statusField && workflowId) {
        console.log('Found status field for transitions:', statusField);
        setCurrentStatusId(String(statusField.value));
      } else {
        console.log('Status field or workflowId not found. workflowId:', workflowId);
        // Sử dụng giá trị mặc định "CREATED" hoặc một UUID tương ứng từ database
        // Đây là ID của trạng thái "Created" trong cấu hình workflow
        setCurrentStatusId("bb116ed7-f781-4d42-81d1-9cdfbaeb2e5c");
        
        // Gọi API để lấy transitions, giả định rằng trạng thái hiện tại là "CREATED"
        console.log('Using default status ID for API call:', "bb116ed7-f781-4d42-81d1-9cdfbaeb2e5c");
      }
    } else {
      setEditedData([]);
      setCurrentStatusId(''); // Reset status ID
    }
    setDialogOpen(true);
    setIsEditing(false);
  };
  
  // Xử lý khi nhấn vào một trường cụ thể để chỉnh sửa
  const handleEditField = (submission: any, fieldId: string) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.data)) {
      // Tìm field cần chỉnh sửa trong data
      const fieldToEdit = submission.data.find((field: FieldData) => field.id === fieldId);
      if (fieldToEdit) {
        // Chỉ lấy trường cụ thể để chỉnh sửa
        setEditedData([fieldToEdit]);
        setDialogOpen(true);
        setIsEditing(true); // Mở chế độ chỉnh sửa ngay lập tức
      }
    }
  };

  // Xử lý khi thay đổi giá trị field
  const handleValueChange = (index: number, value: FieldValue) => {
    const newData = [...editedData];
    // Kiểm tra xem giá trị có thay đổi không để tối ưu render
    if (JSON.stringify(newData[index].value) !== JSON.stringify(value)) {
      newData[index] = { ...newData[index], value };
      setEditedData(newData);
      setDataChanged(true); // Đánh dấu dữ liệu đã thay đổi
    }
  };
  
  // Theo dõi sự thay đổi dữ liệu và tối ưu re-render
  useEffect(() => {
    if (dataChanged) {
      // Sử dụng requestAnimationFrame để đảm bảo UI mượt mà
      const timerId = requestAnimationFrame(() => {
        setDataChanged(false);
      });
      return () => cancelAnimationFrame(timerId);
    }
  }, [dataChanged]);

  // Xử lý khi lưu thay đổi
  const handleSave = async () => {
    if (onSave && selectedSubmission) {
      try {
        if (editedData.length === 1 && Array.isArray(selectedSubmission.data)) {
          // Nếu đang chỉnh sửa một trường duy nhất, cần cập nhật đúng trường đó trong tất cả dữ liệu
          const allSubmissionData = [...selectedSubmission.data];
          const editedFieldIndex = allSubmissionData.findIndex(field => field.id === editedData[0].id);
          
          if (editedFieldIndex !== -1) {
            // Cập nhật trường đã chỉnh sửa trong tất cả dữ liệu
            allSubmissionData[editedFieldIndex] = editedData[0];
            // Gửi tất cả dữ liệu để cập nhật
            await onSave(allSubmissionData);
          } else {
            // Nếu không tìm thấy, vẫn gửi dữ liệu đã chỉnh sửa
            await onSave(editedData);
          }
        } else {
          // Trường hợp chỉnh sửa tất cả các trường
          await onSave(editedData);
        }
        
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  // Mock data for choices, should come from API
  const getChoices = (fieldType: string): { label: string; value: string }[] => {
    return [
      { label: 'Lựa chọn 1', value: '1' },
      { label: 'Lựa chọn 2', value: '2' },
      { label: 'Lựa chọn 3', value: '3' },
      { label: 'Lựa chọn 4', value: '4' }
    ];
  };

  // Render form field dựa vào loại
  const renderFieldInput = (field: FieldData, index: number) => {
    if (isEditing) {
      switch (field.field_type) {
        case 'TEXT':
          return (
            <div className="border rounded-md p-4 w-full">
              <Input
                placeholder="Nhập văn bản"
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
        case 'PARAGRAPH':
          return (
            <div className="border rounded-md p-4 w-full">
              <Textarea
                placeholder="Nhập đoạn văn bản dài"
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0 min-h-[100px]"
              />
            </div>
          );
        case 'NUMBER':
          return (
            <div className="border rounded-md p-4 w-full">
              <Input
                type="number"
                placeholder="0"
                value={field.value as number || 0}
                onChange={(e) => handleValueChange(index, Number(e.target.value))}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
        case 'DATE':
          return (
            <div className="border rounded-md p-4 w-full">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <Input
                  type="date"
                  placeholder="Chọn một ngày"
                  value={field.value ? new Date(field.value as number).toISOString().slice(0, 10) : ''}
                  onChange={(e) => handleValueChange(index, new Date(e.target.value).getTime())}
                  className="w-full border-none focus:ring-0 p-0"
                />
              </div>
            </div>
          );
        case 'SINGLE_CHOICE':
          return (
            <div className="border rounded-md p-4 w-full">
              <div className="space-y-2">
                {getChoices(field.field_type).map((choice) => (
                  <div key={choice.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`choice-${field.id}-${choice.value}`}
                      name={`choice-group-${field.id}`}
                      value={choice.value}
                      checked={field.value === choice.value}
                      onChange={() => handleValueChange(index, choice.value)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
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
            <div className="border rounded-md p-4 w-full">
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
                        handleValueChange(index, newValues);
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
            <div className="border rounded-md p-4 w-full">
              <Input
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
      }
    } else {
      // Chế độ xem
      switch (field.field_type) {
        case 'DATE':
          return formatDate(field.value as number);
        case 'MULTI_CHOICE':
          return Array.isArray(field.value) ? 
            field.value.map(v => {
              const choice = getChoices(field.field_type).find(c => c.value === v);
              return choice ? choice.label : v;
            }).join(', ') : 
            field.value;
        case 'SINGLE_CHOICE':
          const choice = getChoices(field.field_type).find(c => c.value === field.value);
          return choice ? choice.label : field.value;
        default:
          return field.value;
      }
    }
  };

  // Xử lý khi thay đổi chế độ hiển thị
  const toggleViewMode = () => {
    setCurrentViewMode(prevMode => prevMode === 'card' ? 'table' : 'card');
  };

  // Lấy danh sách tất cả loại trường duy nhất từ dữ liệu
  const getUniqueFieldTypes = () => {
    const fieldTypes = new Set<string>();
    data.forEach(submission => {
      if (Array.isArray(submission.data)) {
        submission.data.forEach((field: FieldData) => {
          fieldTypes.add(field.name);
        });
      }
    });
    return Array.from(fieldTypes);
  };
  
  // Lọc dữ liệu dựa trên truy vấn tìm kiếm và bộ lọc
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() && activeFilters.length === 0) {
      return data;
    }
    
    return data.filter(submission => {
      if (!Array.isArray(submission.data)) {
        return false;
      }
      
      // Lọc theo bộ lọc hoạt động
      if (activeFilters.length > 0) {
        const hasAllActiveFilters = activeFilters.every(filterName => {
          return submission.data.some((field: FieldData) => field.name === filterName);
        });
        
        if (!hasAllActiveFilters) {
          return false;
        }
      }
      
      // Lọc theo truy vấn tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        
        // Tìm trong tất cả các trường
        return submission.data.some((field: FieldData) => {
          const fieldValue = field.value;
          
          if (fieldValue === null || fieldValue === undefined) {
            return false;
          }
          
          // Kiểm tra giá trị dựa vào loại dữ liệu
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(query);
          } else if (typeof fieldValue === 'number') {
            return fieldValue.toString().includes(query);
          } else if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => 
              item !== null && 
              item !== undefined && 
              item.toString().toLowerCase().includes(query)
            );
          }
          
          return false;
        });
      }
      
      return true;
    });
  }, [data, searchQuery, activeFilters]);

  // Hiển thị giá trị của trường
  const renderFieldValue = (value: FieldValue, fieldType: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (fieldType) {
      case 'DATE':
        return formatDate(value as number);
      case 'MULTI_CHOICE':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return typeof value === 'string' 
          ? value 
          : Array.isArray(value) 
            ? value.join(', ') 
            : String(value);
    }
  };
  
  // Hiển thị các nút action (transitions) từ workflow
  const renderActionButtons = () => {
    // Sử dụng dữ liệu transitions từ API nếu có
    const transitions = transitionsData?.data?.core_core_dynamic_workflow_transitions || [];
    
    // Nếu không có dữ liệu hoặc dữ liệu rỗng, không hiển thị phần này
    if (transitions.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 py-4 px-2 border-b border-border bg-muted/20">
        <div className="w-full mb-2 text-sm font-medium text-primary">
          {t('workflow.availableActions', 'Hành động có sẵn:')}
        </div>
        {transitions.map((button: { id: string, name: string, form_id: string }) => (
          <Button
            key={button.id}
            size="sm"
            variant="outline"
            className="flex items-center gap-1 bg-background hover:bg-primary hover:text-white transition-colors"
            onClick={() => {
              console.log('Transition clicked:', button);
              // TODO: Thực hiện chuyển đổi trạng thái workflow
            }}
          >
            {button.name}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    );
  };

  // Ưu tiên sử dụng trường dữ liệu từ API fetchMenuViewForm
  const viewFormFields = useMemo(() => {
    // Ưu tiên sử dụng formData từ prop, nếu không có thì dùng formDataFromAPI
    const formDataToUse = formData || formDataFromAPI;
    
    if (formDataToUse?.data?.core_core_dynamic_menu_forms?.[0]?.core_dynamic_form?.core_dynamic_form_fields) {
      return formDataToUse.data.core_core_dynamic_menu_forms[0].core_dynamic_form.core_dynamic_form_fields.map(
        (ff: any) => ff.core_dynamic_field?.name
      ).filter(Boolean);
    }
    return [];
  }, [formData, formDataFromAPI]);
  
  // Render chế độ xem dạng bảng
  const renderTableView = () => {
    // Sử dụng trường từ API nếu có, nếu không sử dụng các trường từ dữ liệu
    const fieldNames = viewFormFields.length > 0 ? viewFormFields : getUniqueFieldTypes();
    
    return (
      <div className="w-full overflow-auto rounded-md border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/70 text-primary-foreground">
              {fieldNames.map((fieldName: string) => (
                <th key={fieldName} className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border">
                  <div className="flex items-center">
                    <span>{fieldName}</span>
                  </div>
                </th>
              ))}
              <th className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <div className="flex items-center justify-center">
                  {t('actions.actions', 'Thao tác')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredData.map((submission, rowIndex) => {
              if (!Array.isArray(submission.data)) return null;
              
              return (
                <tr 
                  key={submission.id} 
                  className={`group transition-colors duration-150 ${
                    rowIndex % 2 === 0 ? 'bg-background/40' : 'bg-background/80'
                  } hover:bg-primary/5`}
                >
                  {fieldNames.map((fieldName: string) => {
                    const field = submission.data.find(
                      (f: FieldData) => f.name === fieldName
                    );
                    
                    return (
                      <td 
                        key={`${submission.id}-${fieldName}`} 
                        className={`p-3 border-r last:border-r-0 border-border text-sm relative ${
                          field && !readOnly ? 'cursor-pointer hover:bg-primary/10' : ''
                        }`}
                        onClick={() => field && !readOnly && handleEditField(submission, field.id)}
                      >
                        {field ? (
                          <div className="relative">
                            <div className="mr-6">
                              {renderFieldValue(field.value, field.field_type)}
                            </div>
                            {!readOnly && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleView(submission)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(submission)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render chế độ xem dạng card
  const renderCardView = () => {
    return (
      <div className="space-y-6">
        {filteredData.map((submission) => (
          <div 
            key={submission.id} 
            className="group mb-6 p-5 border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 bg-card"
          >
            {Array.isArray(submission.data) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submission.data.map((field: FieldData) => (
                  <div 
                    key={field.id} 
                    className="flex flex-col border border-transparent bg-background/50 p-3 rounded-md hover:border-primary/20 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                    onClick={() => !readOnly && handleEditField(submission, field.id)}
                    title={readOnly ? undefined : t('submission.clickToEdit', 'Nhấp để chỉnh sửa trường này')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-primary mb-2 inline-flex items-center">
                        {field.name}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {field.field_type}
                        </span>
                      </span>
                      {!readOnly && (
                        <Edit className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity duration-200" />
                      )}
                    </div>
                    <div className="mt-1 font-medium">
                      {typeof field.value === 'string' 
                        ? field.value || <span className="text-muted-foreground italic text-sm">Chưa có dữ liệu</span>
                        : Array.isArray(field.value) 
                          ? field.value.length > 0 
                            ? field.value.map((v, i) => (
                                <span key={i} className="inline-flex items-center mr-2 mb-1 px-2 py-1 bg-primary/10 text-sm rounded">
                                  {v}
                                </span>
                              ))
                            : <span className="text-muted-foreground italic text-sm">Chưa có dữ liệu</span>
                          : String(field.value) || <span className="text-muted-foreground italic text-sm">Chưa có dữ liệu</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-40 p-3 bg-muted rounded-md font-mono">
                {JSON.stringify(submission.data, null, 2)}
              </pre>
            )}
            <div className="flex justify-end gap-2 mt-6 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleView(submission)}
                className="flex items-center hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('actions.view', 'Xem')}
              </Button>
              {!readOnly && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(submission)}
                  className="flex items-center border-primary/20 hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('actions.edit', 'Sửa')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-lg font-semibold text-primary">
            {t('submission.title', 'Dữ liệu đã nộp')}
          </h3>
          
          <div className="flex items-center gap-2 p-1 bg-background rounded-md border shadow-sm">
            <Button 
              variant={currentViewMode === 'card' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setCurrentViewMode('card')}
              className={`flex items-center ${
                currentViewMode === 'card' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } transition-all`}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              {t('viewMode.card', 'Thẻ')}
            </Button>
            <Button 
              variant={currentViewMode === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setCurrentViewMode('table')}
              className={`flex items-center ${
                currentViewMode === 'table' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } transition-all`}
            >
              <Table className="h-4 w-4 mr-2" />
              {t('viewMode.table', 'Bảng')}
            </Button>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="px-4 py-3 border-b border-border/80 bg-background/70">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className={`relative flex-1 w-full sm:max-w-xs transition-all duration-200 ${isSearchFocused ? 'sm:max-w-sm' : ''}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder', 'Tìm kiếm trong dữ liệu...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-9 bg-background border-muted pr-10 focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getUniqueFieldTypes().slice(0, 4).map((fieldName: string) => (
                <Button 
                  key={fieldName}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFilters(prev => 
                      prev.includes(fieldName) 
                        ? prev.filter(f => f !== fieldName)
                        : [...prev, fieldName]
                    );
                  }}
                  className={`text-xs border-border hover:bg-primary/5 transition-colors ${
                    activeFilters.includes(fieldName) 
                      ? 'bg-primary/10 text-primary border-primary/30' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {fieldName}
                  {activeFilters.includes(fieldName) && (
                    <Check className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
              
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilters([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('filters.clear', 'Xóa bộ lọc')}
                </Button>
              )}
            </div>
          </div>
          
          {/* Hiển thị kết quả tìm kiếm */}
          {searchQuery.trim() && (
            <div className="mt-2 text-sm text-muted-foreground">
              {t('search.results', 'Hiển thị {count} kết quả cho "{query}"', { 
                count: filteredData.length,
                query: searchQuery.trim()
              })}
            </div>
          )}
        </div>
        
        {/* Hiển thị các action buttons */}
        {renderActionButtons()}
        
        <div className="p-4">
          {data.length === 0 ? (
            <div className="py-20 px-4 text-center bg-background/50 rounded-lg border border-dashed">
              <div className="mx-auto max-w-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="42" 
                  height="42" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mx-auto mb-4 text-muted-foreground/50"
                >
                  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2z"></path>
                  <path d="M7 7h10"></path>
                  <path d="M7 11h10"></path>
                  <path d="M7 15h4"></path>
                </svg>
                <p className="text-muted-foreground font-medium mb-2">
                  {t('submission.noData', 'Chưa có dữ liệu nào được gửi')}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t('submission.noDataDescription', 'Các biểu mẫu đã nộp sẽ hiển thị ở đây.')}
                </p>
              </div>
            </div>
          ) : filteredData.length === 0 && (searchQuery || activeFilters.length > 0) ? (
            <div className="py-16 px-4 text-center bg-background/50 rounded-lg border border-dashed">
              <div className="mx-auto max-w-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="42" 
                  height="42" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mx-auto mb-4 text-muted-foreground/50"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <p className="text-muted-foreground font-medium mb-2">
                  {t('search.noResults', 'Không tìm thấy kết quả nào')}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t('search.noResultsDescription', 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem tất cả dữ liệu.')}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setActiveFilters([]); }}
                  className="mt-4 border-primary/20 hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('search.resetFilters', 'Xóa tất cả bộ lọc')}
                </Button>
              </div>
            </div>
          ) : (
            currentViewMode === 'card' ? renderCardView() : renderTableView()
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-none shadow-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-primary">
              {isEditing 
                ? editedData.length === 1
                  ? t('submission.editSingleField', 'Chỉnh sửa trường: {fieldName}', { fieldName: editedData[0]?.name })
                  : t('submission.editData', 'Chỉnh sửa dữ liệu biểu mẫu')
                : editedData.length === 1
                  ? t('submission.viewSingleField', 'Xem trường: {fieldName}', { fieldName: editedData[0]?.name })
                  : t('submission.viewData', 'Xem dữ liệu biểu mẫu')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              {isEditing 
                ? editedData.length === 1
                  ? t('submission.editSingleFieldDescription', 'Chỉnh sửa giá trị cho trường này.')
                  : t('submission.editDescription', 'Chỉnh sửa thông tin của biểu mẫu đã nộp.')
                : t('submission.viewDescription', 'Chi tiết thông tin của biểu mẫu đã nộp.')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Hiển thị action buttons workflow từ transitions */}
          {!isEditing && workflowId && (
            <>
              {transitionsData?.data?.core_core_dynamic_workflow_transitions?.length > 0 && (
                <div className="flex flex-wrap gap-2 py-3 px-4 border-b border-border bg-muted/20">
                  <div className="w-full mb-1 text-sm font-medium text-primary">
                    {t('workflow.availableActions', 'Hành động có sẵn:')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transitionsData?.data?.core_core_dynamic_workflow_transitions?.map((transition: any) => (
                      <Button
                        key={transition.id}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 bg-background hover:bg-primary hover:text-white transition-colors"
                        onClick={() => {
                          console.log('Transition clicked:', transition);
                          // TODO: Thực hiện chuyển đổi trạng thái workflow
                        }}
                      >
                        {transition.name}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="divide-y divide-border">
            {editedData.map((field, index) => (
              <div 
                key={field.id} 
                className={`py-4 ${isEditing ? 'hover:bg-muted/40' : ''} rounded-md transition-colors`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6 px-1">
                  <div className="w-full md:w-1/4 flex items-center">
                    <span className="font-semibold text-sm text-primary inline-flex items-center">
                      {field.name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {field.field_type}
                      </span>
                    </span>
                  </div>
                  <div className="w-full md:w-3/4 flex-1">
                    {renderFieldInput(field, index)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-between border-t pt-4 mt-4">
            {!readOnly && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 border-gray-300"
                    >
                      <X className="h-4 w-4" />
                      <span>{t('actions.cancel', 'Hủy')}</span>
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t('actions.save', 'Lưu')}</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{t('actions.edit', 'Chỉnh sửa')}</span>
                  </Button>
                )}
              </>
            )}
            {(readOnly || !isEditing) && (
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="flex items-center gap-1 border-gray-300"
              >
                <span>{t('actions.close', 'Đóng')}</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}