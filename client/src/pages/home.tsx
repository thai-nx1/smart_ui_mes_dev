import React from 'react';
import { Link } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <MainLayout title={t('Trang chủ')}>
      <div className="flex justify-center items-center w-full h-full p-4">
        <img 
          src="/home.svg" 
          alt="logo" 
          className="w-full h-full max-w-4xl object-contain"
        />
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
