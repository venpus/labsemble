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


  return (
    <div className="detail-section statuses-section">
      <h3>📋 상태 정보</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">프로젝트 상태:</span>
          <span className="info-value status-field">{project.status}</span>
        </div>
        <div className="info-item">
          <span className="info-label">결제 상태:</span>
          <span className="info-value status-field">{project.payment_status || '미정'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">배송 상태:</span>
          <span className="info-value status-field">{project.delivery_status || '미정'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">인보이스 상태:</span>
          <span className="info-value status-field">{project.invoice_status || '미정'}</span>
        </div>
      </div>
      

    </div>
  );
};

export default MJProjectDetailStatuses; 