import React from 'react';
import './MJProjectDetail.css';


// test 2025-08-13

interface MJProjectDetailProps {
  project: any;
  onClose: () => void;
  onEdit?: (project: any) => void;
  onDelete?: (projectId: number) => void;
}

const MJProjectDetail: React.FC<MJProjectDetailProps> = ({ project, onClose, onEdit, onDelete }) => {
  return (
    <div>
      {/* 컴포넌트 내용은 여기에 구현 예정 */}
    </div>
  );
};

export default MJProjectDetail; 