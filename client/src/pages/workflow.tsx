import React, { useState } from 'react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkflowViewer } from '@/components/WorkflowViewer';

// Định nghĩa các trạng thái của node
type NodeStatus = 'todo' | 'doing' | 'done';

// Sample data for the workflow
const sampleWorkflowData = {
  nodes: [
    { id: 'start', title: 'Bắt đầu Dự án', status: 'done' as NodeStatus, x: 150, y: 100 },
    { id: 'requirements', title: 'Phân tích Yêu cầu', status: 'done' as NodeStatus, x: 350, y: 100 },
    { id: 'design', title: 'Thiết kế UI/UX', status: 'doing' as NodeStatus, x: 550, y: 100 },
    { id: 'frontend', title: 'Phát triển Frontend', status: 'todo' as NodeStatus, x: 550, y: 250 },
    { id: 'backend', title: 'Phát triển Backend', status: 'doing' as NodeStatus, x: 350, y: 250 },
    { id: 'database', title: 'Thiết kế Database', status: 'done' as NodeStatus, x: 150, y: 250 },
    { id: 'testing', title: 'Kiểm thử', status: 'todo' as NodeStatus, x: 350, y: 400 },
    { id: 'deployment', title: 'Triển khai', status: 'todo' as NodeStatus, x: 550, y: 400 },
    { id: 'feedback', title: 'Thu thập Feedback', status: 'todo' as NodeStatus, x: 750, y: 250 },
  ],
  connections: [
    { id: 'conn1', sourceId: 'start', targetId: 'requirements' },
    { id: 'conn2', sourceId: 'requirements', targetId: 'design' },
    { id: 'conn3', sourceId: 'requirements', targetId: 'backend' },
    { id: 'conn4', sourceId: 'requirements', targetId: 'database' },
    { id: 'conn5', sourceId: 'design', targetId: 'frontend' },
    { id: 'conn6', sourceId: 'database', targetId: 'backend' },
    { id: 'conn7', sourceId: 'frontend', targetId: 'testing' },
    { id: 'conn8', sourceId: 'backend', targetId: 'testing' },
    { id: 'conn9', sourceId: 'testing', targetId: 'deployment' },
    { id: 'conn10', sourceId: 'deployment', targetId: 'feedback' },
    { id: 'conn11', sourceId: 'feedback', targetId: 'design' },
  ]
};

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Workflow</h1>
          <p className="text-gray-500">Quản lý và theo dõi quy trình làm việc của dự án</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button variant="outline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Tạo mới
          </Button>
          <Button>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Chỉnh sửa
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4 bg-white border-b border-gray-200 w-full justify-start rounded-none px-0">
          <TabsTrigger 
            value="overview" 
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            onClick={() => setActiveTab('tasks')}
          >
            Danh sách công việc
          </TabsTrigger>
          <TabsTrigger 
            value="statistics" 
            className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            onClick={() => setActiveTab('statistics')}
          >
            Thống kê
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tổng công việc</CardTitle>
                <CardDescription>Số lượng công việc theo trạng thái</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sampleWorkflowData.nodes.length}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="bg-green-500">{sampleWorkflowData.nodes.filter(n => n.status === 'todo').length} Cần làm</Badge>
                  <Badge className="bg-yellow-500">{sampleWorkflowData.nodes.filter(n => n.status === 'doing').length} Đang làm</Badge>
                  <Badge className="bg-red-500">{sampleWorkflowData.nodes.filter(n => n.status === 'done').length} Hoàn thành</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tiến độ dự án</CardTitle>
                <CardDescription>Phần trăm hoàn thành</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold mr-2">
                    {Math.round((sampleWorkflowData.nodes.filter(n => n.status === 'done').length / sampleWorkflowData.nodes.length) * 100)}%
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${(sampleWorkflowData.nodes.filter(n => n.status === 'done').length / sampleWorkflowData.nodes.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Thời gian còn lại</CardTitle>
                <CardDescription>Ngày đến hạn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">14 ngày</div>
                <div className="text-sm text-gray-500 mt-1">Hạn: 10/04/2025</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sơ đồ Workflow</CardTitle>
              <CardDescription>Hiển thị quy trình làm việc và mối quan hệ giữa các công việc</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowViewer 
                nodes={sampleWorkflowData.nodes} 
                connections={sampleWorkflowData.connections} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách công việc</CardTitle>
              <CardDescription>Quản lý và phân chia công việc theo trạng thái</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-green-200 shadow-sm">
                  <CardHeader className="bg-green-50 pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      Cần làm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {sampleWorkflowData.nodes.filter(n => n.status === 'todo').map(node => (
                      <div key={node.id} className="p-3 bg-white rounded-md shadow-sm mb-2 border border-gray-100">
                        <div className="font-medium">{node.title}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {node.id}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card className="border border-yellow-200 shadow-sm">
                  <CardHeader className="bg-yellow-50 pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      Đang làm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {sampleWorkflowData.nodes.filter(n => n.status === 'doing').map(node => (
                      <div key={node.id} className="p-3 bg-white rounded-md shadow-sm mb-2 border border-gray-100">
                        <div className="font-medium">{node.title}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {node.id}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card className="border border-red-200 shadow-sm">
                  <CardHeader className="bg-red-50 pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      Hoàn thành
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {sampleWorkflowData.nodes.filter(n => n.status === 'done').map(node => (
                      <div key={node.id} className="p-3 bg-white rounded-md shadow-sm mb-2 border border-gray-100">
                        <div className="font-medium">{node.title}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {node.id}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê hiệu suất</CardTitle>
              <CardDescription>Biểu đồ phân tích tiến độ dự án theo thời gian</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-xl font-medium">Biểu đồ thống kê sẽ được hiển thị ở đây</p>
                <p className="mt-2">Đang trong quá trình phát triển</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}