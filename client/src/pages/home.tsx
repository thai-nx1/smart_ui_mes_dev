import React from 'react';
import { Link } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <MainLayout title={t('app.title', 'Hệ thống Quản lý Form Động')}>
      <div className="py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl">
            {t('app.title', 'Hệ thống Quản lý Form Động')}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            {t('home.description', 'Tạo, quản lý và gửi các biểu mẫu tùy chỉnh một cách nhanh chóng và dễ dàng.')}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            {icon}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
