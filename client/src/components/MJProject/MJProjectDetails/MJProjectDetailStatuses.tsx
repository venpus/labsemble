import React from 'react';
import './MJProjectDetailStatuses.css';

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

interface MJProjectDetailStatusesProps {
  project: MJProject;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
}

const MJProjectDetailStatuses: React.FC<MJProjectDetailStatusesProps> = ({ project, currentUser }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="detail-section statuses-section">
      <h3>📋 상태 정보</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">프로젝트 상태:</span>
          <span className="info-value editable-field">{project.status}</span>
        </div>
        <div className="info-item">
          <span className="info-label">결제 상태:</span>
          <span className="info-value editable-field">{project.payment_status || '미정'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">배송 상태:</span>
          <span className="info-value editable-field">{project.delivery_status || '미정'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">인보이스 상태:</span>
          <span className="info-value editable-field">{project.invoice_status || '미정'}</span>
        </div>
      </div>
      
      <h3>📅 납기 정보</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">생성일:</span>
          <span className="info-value">{formatDate(project.created_at)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">수정일:</span>
          <span className="info-value">{formatDate(project.updated_at)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">출고 예정일:</span>
          <span className="info-value editable-field">
            {project.expected_shipping_date ? formatDate(project.expected_shipping_date) : '미정'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">출고 상태:</span>
          <span className="info-value editable-field">
            {project.delivery_status === 'waiting' ? '출고 대기' :
             project.delivery_status === 'processing' ? '출고 진행중' :
             project.delivery_status === 'completed' ? '출고 완료' :
             project.delivery_status === 'delivered' ? '배송 완료' : '미정'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MJProjectDetailStatuses; 