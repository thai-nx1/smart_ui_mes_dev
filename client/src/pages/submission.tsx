import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { fetchSubmissionForms } from '@/lib/api';
import { SubmissionForm } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export default function SubmissionPage() {
  const { t } = useTranslation();
  const params = useParams<{ workflowId: string }>();
  const workflowId = params.workflowId;
  
  // Fetch submission forms for the specified workflowId
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/submission-forms', workflowId],
    queryFn: async () => {
      const response = await fetchSubmissionForms(workflowId);
      return response.data.core_core_submission_forms;
    },
    enabled: !!workflowId
  });

  if (isLoading) {
    return (
      <MainLayout title={t('submission.title', 'Dữ liệu đã nộp')}>
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-block">
                <Skeleton className="h-8 w-[250px]" />
              </span>
            </CardTitle>
            <CardDescription>
              <span className="inline-block">
                <Skeleton className="h-4 w-[350px]" />
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout title={t('submission.title', 'Dữ liệu đã nộp')}>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('error.title', 'Đã xảy ra lỗi')}
            </CardTitle>
            <CardDescription>
              {t('error.failedToLoad', 'Không thể tải dữ liệu biểu mẫu đã nộp')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('submission.title', 'Dữ liệu đã nộp')}>
      <Card>
        <CardHeader>
          <CardTitle>{t('submission.formData', 'Dữ liệu biểu mẫu đã nộp')}</CardTitle>
          <CardDescription>
            {t('submission.description', 'Danh sách các biểu mẫu đã được gửi qua workflow này')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{t('submission.noData', 'Chưa có dữ liệu nào được gửi qua workflow này')}</p>
            </div>
          ) : (
            <Table>
              <TableCaption>{t('submission.tableCaption', 'Danh sách biểu mẫu đã nộp')}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('submission.id', 'ID')}</TableHead>
                  <TableHead>{t('submission.data', 'Dữ liệu')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((submission: SubmissionForm) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      {typeof submission.submission_data === 'string' 
                        ? submission.submission_data
                        : <pre className="text-xs overflow-auto max-h-40 p-2 bg-muted rounded-md">
                            {JSON.stringify(submission.submission_data, null, 2)}
                          </pre>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}