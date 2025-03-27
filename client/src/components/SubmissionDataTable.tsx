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
import { Edit, X, Save, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FieldData {
  id: string;
  name: string;
  value: FieldValue;
  field_type: string;
}

interface SubmissionDataTableProps {
  data: any[];
  onSave?: (data: FieldData[]) => Promise<boolean | void>;
  readOnly?: boolean;
}

export function SubmissionDataTable({ data, onSave, readOnly = false }: SubmissionDataTableProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FieldData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Render form field dựa vào loại
  const renderFieldInput = (field: FieldData, index: number) => {
    if (isEditing) {
      switch (field.field_type) {
        case 'TEXT':
          return (
            <Input
              value={field.value as string || ''}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className="w-full"
            />
          );
        case 'PARAGRAPH':
          return (
            <Textarea
              value={field.value as string || ''}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className="w-full"
              rows={3}
            />
          );
        case 'NUMBER':
          return (
            <Input
              type="number"
              value={field.value as number || 0}
              onChange={(e) => handleValueChange(index, Number(e.target.value))}
              className="w-full"
            />
          );
        case 'DATE':
          return (
            <Input
              type="datetime-local"
              value={field.value ? new Date(field.value as number).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleValueChange(index, new Date(e.target.value).getTime())}
              className="w-full"
            />
          );
        case 'SINGLE_CHOICE':
          return (
            <Input
              value={field.value as string || ''}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className="w-full"
            />
          );
        case 'MULTI_CHOICE':
          return (
            <Textarea
              value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string || ''}
              onChange={(e) => handleValueChange(index, e.target.value.split(', '))}
              className="w-full"
              rows={2}
            />
          );
        default:
          return (
            <Input
              value={field.value as string || ''}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className="w-full"
            />
          );
      }
    } else {
      // Chế độ xem
      switch (field.field_type) {
        case 'DATE':
          return formatDate(field.value as number);
        case 'MULTI_CHOICE':
          return Array.isArray(field.value) ? field.value.join(', ') : field.value;
        default:
          return field.value;
      }
    }
  };

  return (
    <>
      <div className="p-4 border rounded-lg shadow-sm">
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
        {data.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t('submission.noData', 'Chưa có dữ liệu nào được gửi')}</p>
          </div>
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