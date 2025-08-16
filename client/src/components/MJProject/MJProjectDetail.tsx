import React, { useState } from 'react';
import './MJProjectDetail.css';
import MJProjectDetailHeader from './MJProjectDetails/MJProjectDetailHeader';
import MJProjectDetailProjInfo from './MJProjectDetails/MJProjectDetailProjInfo';
import MJProjectDetailStatuses from './MJProjectDetails/MJProjectDetailStatuses';
import MJProjectDetailPaymentsStatuses from './MJProjectDetails/MJProjectDetailPaymentsStatuses';

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

interface MJProjectDetailProps {
  project: MJProject;
  onClose: () => void;
  onEdit?: (project: MJProject) => void;
  onDelete?: (projectId: number) => void;
}

const MJProjectDetail: React.FC<MJProjectDetailProps> = ({ project, onClose, onEdit, onDelete }) => {
  const [editingPurchaseLink, setEditingPurchaseLink] = useState(false);
  const [purchaseLinkEdit, setPurchaseLinkEdit] = useState(project.purchase_link || '');
  const [savingLink, setSavingLink] = useState(false);



  const handleSavePurchaseLink = async () => {
    if (savingLink) return;
    
    try {
      setSavingLink(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/purchase-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ purchaseLink: purchaseLinkEdit })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.purchase_link = purchaseLinkEdit;
        setEditingPurchaseLink(false);
        alert('구매링크가 성공적으로 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(`구매링크 저장에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('구매링크 저장 오류:', error);
      alert('구매링크 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingLink(false);
    }
  };



  return (
    <div className="mj-project-detail">
      <MJProjectDetailHeader
        project={project}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />

      <div className="detail-content">
        <MJProjectDetailProjInfo project={project} />

        <MJProjectDetailStatuses project={project} />

        <MJProjectDetailPaymentsStatuses project={project} />




      </div>
    </div>
  );
};

export default MJProjectDetail; 