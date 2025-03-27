import React, { useState } from 'react';
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
import { Edit, X, Save, Eye, Calendar, Table, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
}

export function SubmissionDataTable({ data, onSave, readOnly = false, viewMode = 'card' }: SubmissionDataTableProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FieldData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);

  // Format thời gian từ timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Xử lý khi nhấn nút chỉnh sửa tất cả
  const handleEdit = (submission: any) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.submission_data)) {
      setEditedData([...submission.submission_data]);
    } else {
      setEditedData([]);
    }
    setDialogOpen(true);
    setIsEditing(false);
  };

  // Xử lý khi nhấn nút xem tất cả
  const handleView = (submission: any) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.submission_data)) {
      setEditedData([...submission.submission_data]);
    } else {
      setEditedData([]);
    }
    setDialogOpen(true);
    setIsEditing(false);
  };
  
  // Xử lý khi nhấn vào một trường cụ thể để chỉnh sửa
  const handleEditField = (submission: any, fieldId: string) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.submission_data)) {
      // Tìm field cần chỉnh sửa trong submission_data
      const fieldToEdit = submission.submission_data.find((field: FieldData) => field.id === fieldId);
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
    newData[index] = { ...newData[index], value };
    setEditedData(newData);
  };

  // Xử lý khi lưu thay đổi
  const handleSave = async () => {
    if (onSave && selectedSubmission) {
      try {
        if (editedData.length === 1 && Array.isArray(selectedSubmission.submission_data)) {
          // Nếu đang chỉnh sửa một trường duy nhất, cần cập nhật đúng trường đó trong tất cả dữ liệu
          const allSubmissionData = [...selectedSubmission.submission_data];
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
      if (Array.isArray(submission.submission_data)) {
        submission.submission_data.forEach((field: FieldData) => {
          fieldTypes.add(field.name);
        });
      }
    });
    return Array.from(fieldTypes);
  };

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

  // Render chế độ xem dạng bảng
  const renderTableView = () => {
    const fieldNames = getUniqueFieldTypes();
    
    return (
      <div className="w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              {fieldNames.map(fieldName => (
                <th key={fieldName} className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border">
                  {fieldName}
                </th>
              ))}
              <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border">
                {t('actions.actions', 'Thao tác')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((submission) => {
              if (!Array.isArray(submission.submission_data)) return null;
              
              return (
                <tr key={submission.id} className="hover:bg-muted/50">
                  {fieldNames.map(fieldName => {
                    const field = submission.submission_data.find(
                      (f: FieldData) => f.name === fieldName
                    );
                    
                    return (
                      <td 
                        key={`${submission.id}-${fieldName}`} 
                        className="p-3 border text-sm"
                        onClick={() => field && !readOnly && handleEditField(submission, field.id)}
                      >
                        {field ? renderFieldValue(field.value, field.field_type) : '-'}
                      </td>
                    );
                  })}
                  <td className="p-3 border text-center">
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleView(submission)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(submission)}
                          className="h-8 w-8 p-0"
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
      <div>
        {data.map((submission) => (
          <div key={submission.id} className="mb-6 p-4 border rounded-lg">
            {Array.isArray(submission.submission_data) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.submission_data.map((field: FieldData) => (
                  <div 
                    key={field.id} 
                    className="flex flex-col border-b pb-2 hover:bg-muted p-2 rounded cursor-pointer transition-colors"
                    onClick={() => !readOnly && handleEditField(submission, field.id)}
                    title={readOnly ? undefined : t('submission.clickToEdit', 'Nhấp để chỉnh sửa trường này')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm mb-1">{field.name}:</span>
                      {!readOnly && (
                        <Edit className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100" />
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {typeof field.value === 'string' 
                        ? field.value
                        : Array.isArray(field.value) 
                          ? field.value.join(', ')
                          : String(field.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-muted rounded-md">
                {JSON.stringify(submission.submission_data, null, 2)}
              </pre>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleView(submission)}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('actions.view', 'Xem')}
              </Button>
              {!readOnly && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(submission)}
                  className="flex items-center"
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
      <div className="p-4 border rounded-lg shadow-sm">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {t('submission.title', 'Dữ liệu đã nộp')}
          </h3>
          <div className="flex items-center gap-2">
            <Button 
              variant={currentViewMode === 'card' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setCurrentViewMode('card')}
              className="flex items-center"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              {t('viewMode.card', 'Thẻ')}
            </Button>
            <Button 
              variant={currentViewMode === 'table' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setCurrentViewMode('table')}
              className="flex items-center"
            >
              <Table className="h-4 w-4 mr-2" />
              {t('viewMode.table', 'Bảng')}
            </Button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t('submission.noData', 'Chưa có dữ liệu nào được gửi')}</p>
          </div>
        ) : (
          currentViewMode === 'card' ? renderCardView() : renderTableView()
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing 
                ? editedData.length === 1
                  ? t('submission.editSingleField', 'Chỉnh sửa trường: {fieldName}', { fieldName: editedData[0]?.name })
                  : t('submission.editData', 'Chỉnh sửa dữ liệu biểu mẫu')
                : editedData.length === 1
                  ? t('submission.viewSingleField', 'Xem trường: {fieldName}', { fieldName: editedData[0]?.name })
                  : t('submission.viewData', 'Xem dữ liệu biểu mẫu')}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? editedData.length === 1
                  ? t('submission.editSingleFieldDescription', 'Chỉnh sửa giá trị cho trường này.')
                  : t('submission.editDescription', 'Chỉnh sửa thông tin của biểu mẫu đã nộp.')
                : t('submission.viewDescription', 'Chi tiết thông tin của biểu mẫu đã nộp.')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editedData.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[150px_1fr] gap-4 items-start">
                <div className="font-medium">{field.name}:</div>
                <div>{renderFieldInput(field, index)}</div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-between">
            {!readOnly && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('actions.cancel', 'Hủy')}
                    </Button>
                    <Button 
                      onClick={handleSave}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {t('actions.save', 'Lưu')}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('actions.edit', 'Chỉnh sửa')}
                  </Button>
                )}
              </>
            )}
            {(readOnly || !isEditing) && (
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                {t('actions.close', 'Đóng')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}