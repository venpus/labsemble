import React from 'react';
import './MJProjectDetailHeader.css';

interface MJProject {
  id: number;
  user_id: number;
  product_name: string;
  quantity: number;
  reference_link?: string;
  purchase_link?: string;
  image_paths?: string[];
  status: string;
  price?: number;
  payment_status?: 'pending' | 'completed' | 'failed';
  delivery_status?: 'waiting' | 'processing' | 'completed' | 'delivered';
  invoice_status?: 'not_issued' | 'issued';
  expected_shipping_date?: string;
  project_code?: string;
  quotation_approval?: string;
  created_at: string;
  updated_at: string;
  username?: string;
  company_name?: string;
  email?: string;
}

interface MJProjectDetailHeaderProps {
  project: MJProject;
  onEdit?: (project: MJProject) => void;
  onDelete?: (projectId: number) => void;
  onClose: () => void;
}

const MJProjectDetailHeader: React.FC<MJProjectDetailHeaderProps> = ({ 
  project, 
  onEdit, 
  onDelete, 
  onClose 
}) => {
  return (
    <div className="detail-content-header">
      <div className="title-with-thumbnail">
        <div className="project-thumbnail">
          {(() => {
            let imagePaths = project.image_paths;
            if (typeof imagePaths === 'string') {
              try {
                imagePaths = JSON.parse(imagePaths);
              } catch (e) {
                console.error('이미지 경로 파싱 실패:', e);
                imagePaths = [];
              }
            }
            
            if (imagePaths && imagePaths.length > 0) {
              return (
                <img 
                  src={`http://localhost:5001/uploads/mj-projects/${imagePaths[0]}`}
                  alt="프로젝트 썸네일"
                  className="thumbnail-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              );
            } else {
              return (
                <div className="no-thumbnail">
                  <span>📷</span>
                </div>
              );
            }
          })()}
        </div>
        <h2 className="detail-content-title">
          📋 {project.project_code || `MJ-${project.id.toString().padStart(6, '0')}`}
        </h2>
      </div>
      <div className="detail-content-actions">
        {onEdit && (
          <button 
            className="edit-btn"
            onClick={() => onEdit(project)}
          >
            수정
          </button>
        )}
        {onDelete && (
          <button 
            className="delete-btn"
            onClick={() => onDelete(project.id)}
          >
            삭제
          </button>
        )}
        <button 
          className="close-btn"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default MJProjectDetailHeader; 