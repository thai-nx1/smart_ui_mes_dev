import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/MainLayout';
import { SubmissionForm } from '@/components/SubmissionForm';
import { FormSubmission } from '@/lib/types';
import { submitFormData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SubmissionCreatePage() {
  const { t } = useTranslation();
  const params = useParams<{ workflowId: string }>();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const workflowId = params.workflowId;

  // Xử lý khi submit form
  const handleSubmit = async (submission: FormSubmission) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Gọi API để tạo submission mới
      const response = await submitFormData(submission);
      
      // Hiển thị thông báo thành công
      toast({
        title: t('submission.createSuccess', 'Tạo biểu mẫu thành công'),
        description: t('submission.recordSaved', 'Dữ liệu đã được lưu thành công'),
      });
      
      // Quay lại trang danh sách sau khi tạo thành công
      navigate(`/submission/${workflowId}`);
      
      return response;
    } catch (error) {
      console.error("Error creating submission:", error);
      
      // Hiển thị thông báo lỗi
      toast({
        title: t('error.submissionFailed', 'Lỗi tạo biểu mẫu'),
        description: t('error.tryAgain', 'Vui lòng thử lại sau'),
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý khi hủy form
  const handleCancel = () => {
    navigate(`/submission/${workflowId}`);
  };

  return (
    <MainLayout title={t('submission.create', 'Tạo biểu mẫu')}>
      <div className="container mx-auto py-6">
        <SubmissionForm 
          workflowId={workflowId} 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </MainLayout>
  );
}