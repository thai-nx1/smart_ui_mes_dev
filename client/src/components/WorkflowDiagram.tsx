import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Cấu hình mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

interface WorkflowTransition {
  id: string;
  name: string;
  from_status_id: string;
  to_status_id: string;
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
  transitions: WorkflowTransition[];
  currentStatusId?: string;
  onClose: () => void;
}

export function WorkflowDiagram({ 
  workflowId, 
  workflowName, 
  transitions, 
  currentStatusId,
  onClose 
}: WorkflowDiagramProps) {
  const { t } = useTranslation();
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current) {
      renderDiagram();
    }
  }, [workflowId, transitions]);

  // Tạo sơ đồ Mermaid từ dữ liệu transitions
  const renderDiagram = async () => {
    if (!mermaidRef.current || !transitions.length) return;

    // Tập hợp các trạng thái từ transitions
    const statuses = new Map();
    
    // Thêm tất cả các trạng thái từ transitions
    transitions.forEach(transition => {
      if (transition.core_dynamic_from_status) {
        statuses.set(transition.from_status_id, transition.core_dynamic_from_status.name);
      }
      if (transition.core_dynamic_to_status) {
        statuses.set(transition.to_status_id, transition.core_dynamic_to_status.name);
      }
    });

    // Tạo mã nguồn Mermaid
    let mermaidCode = `
      flowchart LR
    `;

    // Thêm các node (trạng thái)
    statuses.forEach((name, id) => {
      const isCurrentStatus = id === currentStatusId;
      const style = isCurrentStatus ? 'fill:#00B1D2,color:white,stroke:#0091A8,stroke-width:2px' : '';
      mermaidCode += `
        ${id}("${name}")${isCurrentStatus ? ':::current' : ''}
      `;
    });

    // Thêm kết nối giữa các node
    transitions.forEach(transition => {
      mermaidCode += `
        ${transition.from_status_id} -->|${transition.name}| ${transition.to_status_id}
      `;
    });

    // Thêm định nghĩa style cho trạng thái hiện tại
    mermaidCode += `
      classDef current fill:#00B1D2,color:white,stroke:#0091A8,stroke-width:2px;
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

  // Hiển thị thông báo khi không có transitions
  const renderNoTransitions = () => (
    <div className="p-4 text-center text-muted-foreground">
      {t('workflow.noTransitions', 'Không có trạng thái chuyển đổi nào cho workflow này.')}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border border-border">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h3 className="text-lg font-medium">{t('workflow.diagram', 'Sơ đồ workflow')}: {workflowName}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="pt-6">
        {transitions.length > 0 ? (
          <div ref={mermaidRef} className="workflow-diagram overflow-auto max-w-full"></div>
        ) : (
          renderNoTransitions()
        )}
      </CardContent>
    </Card>
  );
}