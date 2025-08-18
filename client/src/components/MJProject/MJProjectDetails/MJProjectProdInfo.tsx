import React from 'react';
import { ProdRealImage } from './ProdInfo';
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
  onProjectUpdate?: () => void; // 프로젝트 데이터 새로고침을 위한 콜백
}

const MJProjectProdInfo: React.FC<MJProjectProdInfoProps> = ({ project, currentUser, onProjectUpdate }) => {
  const isEditable = currentUser?.is_admin || currentUser?.id === project.user_id;

  // 디버깅을 위한 로그
  console.log('MJProjectProdInfo project data:', {
    id: project.id,
    image_paths: project.image_paths,
    image_paths_type: typeof project.image_paths,
    isArray: Array.isArray(project.image_paths)
  });

  const handleImagesUpdate = (newImages: string[]) => {
    // 이미지 업데이트 시 부모 컴포넌트에 알림
    console.log('이미지가 업데이트되었습니다:', newImages);
    
    // 부모 컴포넌트에 프로젝트 데이터 새로고침 요청
    if (onProjectUpdate) {
      onProjectUpdate();
    }
  };

  return (
    <div className="detail-section prod-info-section">
      <h3>🛍️ 상품 정보</h3>
      
      {/* 상품 사진 업로드 컴포넌트 */}
      <ProdRealImage
        projectId={project.id}
        projectCode={project.project_code}
        currentImages={Array.isArray(project.image_paths) ? project.image_paths : []}
        onImagesUpdate={handleImagesUpdate}
        isEditable={isEditable}
      />
    </div>
  );
};

export default MJProjectProdInfo; 