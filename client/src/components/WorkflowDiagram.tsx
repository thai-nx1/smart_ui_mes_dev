import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWorkflowDetails, generateMermaidDiagram } from '../lib/workflow-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Cấu hình mermaid với các thiết lập tối ưu
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  logLevel: 'error', // Chỉ hiển thị lỗi, giảm logs
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'natural', // Smooth curves for better appearance
    defaultRenderer: 'dagre-d3' // Renderer tốc độ cao
  },
  themeVariables: {
    primaryColor: '#00B1D2',
    primaryTextColor: '#fff',
    primaryBorderColor: '#009ab8',
    lineColor: '#999',
    secondaryColor: '#f4f4f4',
    tertiaryColor: '#f9f9f9'
  }
});

export interface WorkflowTransition {
  id: string;
  name: string;
  from_status_id: string | null;
  to_status_id: string | null;
  core_dynamic_from_status?: {
    id: string;
    name: string;
    description?: string;
  };
  core_dynamic_to_status?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface WorkflowDiagramProps {
  workflowId: string;
  workflowName: string;
  currentStatusId?: string;
  onClose: () => void;
  useDialogStyle?: boolean;
}

export function WorkflowDiagram({ 
  workflowId, 
  workflowName, 
  currentStatusId,
  onClose,
  useDialogStyle = true
}: WorkflowDiagramProps) {
  const { t } = useTranslation();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);

  // Tải dữ liệu workflow
  useEffect(() => {
    async function loadWorkflowData() {
      try {
        setLoading(true);
        
        const response = await fetchWorkflowDetails(workflowId);
        
        if (response.data?.core_core_dynamic_workflows_by_pk) {
          const workflowDetail = response.data.core_core_dynamic_workflows_by_pk;
          setTransitions(workflowDetail.core_dynamic_workflow_transitions || []);
          
          // Render diagram sau khi có dữ liệu
          setTimeout(() => {
            if (mermaidRef.current) {
              renderDiagram(workflowDetail.core_dynamic_workflow_transitions || []);
            }
          }, 100);
        } else {
          setError('Không tìm thấy thông tin workflow');
        }
      } catch (err) {
        console.error('Error loading workflow data:', err);
        setError('Lỗi khi tải dữ liệu workflow');
      } finally {
        setLoading(false);
      }
    }
    
    loadWorkflowData();
  }, [workflowId, currentStatusId]);

  // Tạo sơ đồ Mermaid từ dữ liệu transitions
  const renderDiagram = async (workflowTransitions: WorkflowTransition[]) => {
    if (!mermaidRef.current) return;
    
    if (!workflowTransitions.length) {
      mermaidRef.current.innerHTML = `<div class="p-4 text-center text-muted-foreground">
        ${t('workflow.noTransitions', 'Không có trạng thái chuyển đổi nào cho workflow này.')}
      </div>`;
      return;
    }

    // Tập hợp các trạng thái từ transitions
    const statuses = new Map();
    
    // Thêm tất cả các trạng thái từ transitions
    workflowTransitions.forEach(transition => {
      if (transition.from_status_id && transition.core_dynamic_from_status) {
        statuses.set(transition.from_status_id, transition.core_dynamic_from_status.name);
      }
      if (transition.to_status_id && transition.core_dynamic_to_status) {
        statuses.set(transition.to_status_id, transition.core_dynamic_to_status.name);
      }
    });

    // Tạo mã nguồn Mermaid
    let mermaidCode = `
      flowchart LR
    `;

    // Thêm các node (trạng thái)
    statuses.forEach((name, id) => {
      const safeId = id.replace(/-/g, '_'); // Thay thế dấu - bằng _ để tránh lỗi cú pháp Mermaid
      const isCurrentStatus = id === currentStatusId;
      mermaidCode += `
        ${safeId}("${name}")${isCurrentStatus ? ':::current' : ''}
      `;
    });

    // Thêm kết nối giữa các node
    workflowTransitions.forEach(transition => {
      if (transition.from_status_id && transition.to_status_id) {
        const fromId = transition.from_status_id.replace(/-/g, '_');
        const toId = transition.to_status_id.replace(/-/g, '_');
        mermaidCode += `
          ${fromId} -->|${transition.name}| ${toId}
        `;
      } else if (!transition.from_status_id && transition.to_status_id) {
        // Trường hợp bắt đầu (không có trạng thái nguồn)
        const toId = transition.to_status_id.replace(/-/g, '_');
        mermaidCode += `
          Start((Bắt đầu)):::start -->|${transition.name}| ${toId}
        `;
      } else if (transition.from_status_id && !transition.to_status_id) {
        // Trường hợp kết thúc (không có trạng thái đích)
        const fromId = transition.from_status_id.replace(/-/g, '_');
        mermaidCode += `
          ${fromId} -->|${transition.name}| End((Kết thúc)):::end
        `;
      }
    });

    // Thêm định nghĩa style cho trạng thái hiện tại và cải thiện hiệu suất hiển thị
    mermaidCode += `
      classDef current fill:#00B1D2,color:white,stroke:#009ab8,stroke-width:2px;
      classDef start fill:#00B1D2,color:white,stroke:#009ab8,stroke-width:2px;
      classDef end fill:#00B1D2,color:white,stroke:#009ab8,stroke-width:2px;
      classDef default fill:#f9f9f9,stroke:#ccc,color:#333;
    `;

    try {
      // Xóa nội dung cũ
      mermaidRef.current.innerHTML = '';
      
      // Render sơ đồ mới
      const { svg } = await mermaid.render('workflow-diagram', mermaidCode);
      mermaidRef.current.innerHTML = svg;
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      mermaidRef.current.innerHTML = `<div class="p-4 text-red-500">
        ${t('workflow.diagramError', 'Không thể tạo sơ đồ. Vui lòng thử lại sau.')}
      </div>`;
    }
  };

  // Hiển thị thông báo khi đang tải
  const renderLoading = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );

  // Hiển thị thông báo lỗi
  const renderError = () => (
    <div className="p-4 text-center text-destructive">
      <p>{error}</p>
    </div>
  );

  // Dựa vào useDialogStyle để quyết định hiển thị dạng Dialog hoặc Card
  if (useDialogStyle) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex justify-between items-center">
                <span>{t('workflow.diagram', 'Sơ đồ quy trình')}: {workflowName}</span>
                {/* Nút X được cung cấp tự động bởi DialogContent, không cần thêm nút ở đây */}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border rounded-lg p-4 max-h-[60vh] overflow-auto">
              {loading ? (
                renderLoading()
              ) : error ? (
                renderError()
              ) : (
                <div ref={mermaidRef} className="workflow-diagram flex justify-center items-center"></div>
              )}
            </div>
            
            {!loading && !error && transitions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Trạng thái hiện tại: {
                  transitions.find(t => 
                    t.core_dynamic_from_status?.id === currentStatusId || 
                    t.core_dynamic_to_status?.id === currentStatusId
                  )?.core_dynamic_from_status?.id === currentStatusId
                    ? transitions.find(t => t.core_dynamic_from_status?.id === currentStatusId)?.core_dynamic_from_status?.name
                    : transitions.find(t => t.core_dynamic_to_status?.id === currentStatusId)?.core_dynamic_to_status?.name || 
                      'Không xác định'
                }
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white transition-colors duration-200">{t('common.close', 'Đóng')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  } else {
    // Trả về dạng Card
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg border border-border">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="text-lg font-medium">{t('workflow.diagram', 'Sơ đồ workflow')}: {workflowName}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-primary hover:bg-primary/10 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="pt-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <div ref={mermaidRef} className="workflow-diagram overflow-auto max-w-full"></div>
          )}
        </CardContent>
      </Card>
    );
  }
}