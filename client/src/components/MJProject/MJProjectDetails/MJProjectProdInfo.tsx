import React from 'react';
import './MJProjectProdInfo.css';

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

interface MJProjectProdInfoProps {
  project: MJProject;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
}

const MJProjectProdInfo: React.FC<MJProjectProdInfoProps> = ({ project, currentUser }) => {

  return (
    <div className="detail-section prod-info-section">
      <h3>🛍️ 상품 정보</h3>
      <div className="info-grid">
        {project.reference_link && (
          <div className="info-item">
            <span className="info-label">참고 링크:</span>
            <span className="info-value">
              <div className="link-display">
                <a
                  href={project.reference_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reference-link clickable-link"
                  title="클릭하여 새 탭에서 참고 링크 열기"
                >
                  {project.reference_link}
                  <span className="link-icon">🔗</span>
                </a>
              </div>
            </span>
          </div>
        )}
      </div>


    </div>
  );
};

export default MJProjectProdInfo; 