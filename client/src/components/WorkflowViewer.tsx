import React from 'react';
import { Card } from '@/components/ui/card';

// Định nghĩa các trạng thái của node
type NodeStatus = 'todo' | 'doing' | 'done';

// Định nghĩa dữ liệu cho node
interface WorkflowNode {
  id: string;
  title: string;
  status: NodeStatus;
  x: number;
  y: number;
}

// Định nghĩa dữ liệu cho liên kết giữa các node
interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

// Props cho component WorkflowViewer
interface WorkflowViewerProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

// Hàm lấy màu dựa trên trạng thái
const getStatusColor = (status: NodeStatus): string => {
  switch (status) {
    case 'todo':
      return 'bg-green-500';
    case 'doing':
      return 'bg-yellow-500';
    case 'done':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Component để hiển thị một node trong workflow
const WorkflowNode: React.FC<{ node: WorkflowNode }> = ({ node }) => {
  const statusColor = getStatusColor(node.status);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
    >
      <div className="w-48 h-32 rounded-lg bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            <span className="text-xs text-gray-500">{node.id}</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">{node.title}</h3>
          <div className="mt-auto">
            <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColor}`}>
              {node.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Connection points - 8 điểm kết nối quanh node */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

// Component để hiển thị liên kết giữa các node
const WorkflowConnection: React.FC<{
  connection: WorkflowConnection;
  sourceNode: WorkflowNode;
  targetNode: WorkflowNode;
}> = ({ connection, sourceNode, targetNode }) => {
  // Tính toán điểm bắt đầu và kết thúc cho đường nối
  const startX = sourceNode.x;
  const startY = sourceNode.y;
  const endX = targetNode.x;
  const endY = targetNode.y;

  // Tính toán các thuộc tính cho đường nối SVG
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const length = Math.sqrt(dx * dx + dy * dy);

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#94a3b8"
        strokeWidth="2"
        markerEnd={`url(#arrowhead-${connection.id})`}
      />
    </svg>
  );
};

// Component chính để hiển thị workflow
export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({ nodes, connections }) => {
  return (
    <div className="relative w-full h-[600px] bg-gray-50 bg-opacity-60 overflow-hidden rounded-lg shadow-inner">
      {/* Lưới nền với kích thước 20x20 pixel */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px' 
        }}
      />
      
      {/* Hiển thị các liên kết giữa các node */}
      {connections.map((connection) => {
        const sourceNode = nodes.find((node) => node.id === connection.sourceId);
        const targetNode = nodes.find((node) => node.id === connection.targetId);
        
        if (sourceNode && targetNode) {
          return (
            <WorkflowConnection
              key={connection.id}
              connection={connection}
              sourceNode={sourceNode}
              targetNode={targetNode}
            />
          );
        }
        
        return null;
      })}
      
      {/* Hiển thị các node */}
      {nodes.map((node) => (
        <WorkflowNode key={node.id} node={node} />
      ))}
    </div>
  );
};

// Dữ liệu mẫu để hiển thị
export const sampleWorkflowData = {
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
  ],
};