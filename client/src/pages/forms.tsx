import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { FormLayout } from '@/components/FormLayout';
import { FormFields } from '@/components/FormFields';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Form, Field } from '@/lib/types';
import { fetchForms, fetchFormFields } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showFormList, setShowFormList] = useState(true);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Fetch forms list
  const {
    data: formsData,
    isLoading: isLoadingForms,
    error: formsError
  } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      const response = await fetchForms();
      return response.data.core_core_dynamic_forms;
    }
  });

  // Fetch form fields when a form is selected
  const {
    data: fieldsData,
    isLoading: isLoadingFields,
    error: fieldsError
  } = useQuery({
    queryKey: ['/api/form-fields', selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null;
      const response = await fetchFormFields(selectedFormId);
      return response.data.core_core_dynamic_fields;
    },
    enabled: !!selectedFormId
  });

  // Set the first form as selected when data loads
  useEffect(() => {
    if (formsData && formsData.length > 0 && !selectedFormId) {
      setSelectedFormId(formsData[0].id);
    }
  }, [formsData, selectedFormId]);

  // Show error toast if data fetching fails
  useEffect(() => {
    if (formsError) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách form. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    }

    if (fieldsError) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết form. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    }
  }, [formsError, fieldsError, toast]);

  // Filter forms by search term
  const filteredForms = formsData?.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected form details
  const selectedForm = formsData?.find(form => form.id === selectedFormId);

  // Handle form selection
  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
  };

  // Toggle between form list and form details on mobile
  const handleSelectFormOnMobile = (formId: string) => {
    setSelectedFormId(formId);
    if (isMobile) {
      setShowFormList(false);
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setShowFormList(true);
  };

  return (
    <FormLayout>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Forms List - hidden on mobile when a form is selected */}
        {(!isMobile || (isMobile && showFormList)) && (
          <div className="md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Danh sách Form</h2>
                  <button 
                    type="button" 
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                <div className="mt-3">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder="Tìm kiếm form..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingForms ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredForms && filteredForms.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredForms.map((form) => (
                      <li
                        key={form.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          selectedFormId === form.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                        onClick={() => handleSelectFormOnMobile(form.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{form.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              <Badge variant="status">
                                {form.status}
                              </Badge>
                            </p>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy form phù hợp' : 'Không có form nào'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Detail - show on mobile only when a form is selected */}
        {(!isMobile || (isMobile && !showFormList)) && (
          <div className={isMobile ? "col-span-1" : "md:col-span-8 lg:col-span-9"}>
            <Card>
              <CardHeader className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      className="mr-2" 
                      onClick={handleBackToList}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      Quay lại
                    </Button>
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    {isLoadingForms ? (
                      <Skeleton className="h-6 w-48" />
                    ) : selectedForm ? (
                      selectedForm.name
                    ) : (
                      'Chọn một form'
                    )}
                  </h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hidden sm:flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Chỉnh sửa
                    </Button>
                  </div>
                </div>
                {isLoadingForms ? (
                  <div className="mt-1 text-sm h-4"><Skeleton className="h-4 w-full" /></div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedForm ? (
                      selectedForm.description || 'Nhấn vào các trường để điền thông tin'
                    ) : (
                      'Vui lòng chọn một form từ danh sách'
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {isLoadingFields ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-10 w-full mt-2" />
                      </div>
                    ))}
                  </div>
                ) : selectedFormId && fieldsData ? (
                  <FormFields formId={selectedFormId} fields={fieldsData} />
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p className="text-gray-500">Vui lòng chọn một form để xem chi tiết</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FormLayout>
  );
}
