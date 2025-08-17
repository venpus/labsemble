import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import './MJProjectDetailProjInfo.css';

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

interface MJProjectDetailProjInfoProps {
  project: MJProject;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
}

const MJProjectDetailProjInfo: React.FC<MJProjectDetailProjInfoProps> = ({ project, currentUser }) => {
  const [purchaseLinkEdit, setPurchaseLinkEdit] = useState(project.purchase_link || '');
  const [savingLink, setSavingLink] = useState(false);
  
  const [quantityEdit, setQuantityEdit] = useState(project.quantity || 0);
  const [savingQuantity, setSavingQuantity] = useState(false);
  
  const [priceEdit, setPriceEdit] = useState(project.price || 0);
  const [savingPrice, setSavingPrice] = useState(false);

  // project 값이 변경될 때마다 입력 필드 값들을 동기화
  useEffect(() => {
    setPurchaseLinkEdit(project.purchase_link || '');
    setQuantityEdit(project.quantity || 0);
    setPriceEdit(project.price || 0);
  }, [project.purchase_link, project.quantity, project.price]);

  const handleSavePurchaseLink = async () => {
    if (savingLink) return;
    
    try {
      setSavingLink(true);
      await apiService.updateMJProjectPurchaseLink(project.id, purchaseLinkEdit);
      // 성공적으로 저장된 경우 프로젝트 객체 업데이트
      project.purchase_link = purchaseLinkEdit;
      // 성공 시에는 팝업 메시지 없이 조용히 처리
    } catch (error: any) {
      console.error('구매링크 저장 오류:', error);
      const errorMessage = error.response?.data?.error || '구매링크 저장 중 오류가 발생했습니다.';
      alert(`구매링크 저장 실패: ${errorMessage}`);
    } finally {
      setSavingLink(false);
    }
  };

  const handleSaveQuantity = async () => {
    if (savingQuantity) return;
    
    console.log('수량 저장 시도 - 현재 사용자:', currentUser);
    console.log('프로젝트 정보:', project);
    console.log('수량 수정 값:', quantityEdit);
    
    try {
      setSavingQuantity(true);
      await apiService.updateMJProjectQuantity(project.id, quantityEdit);
      // 성공적으로 저장된 경우 프로젝트 객체 업데이트
      project.quantity = quantityEdit;
      // 성공 시에는 팝업 메시지 없이 조용히 처리
    } catch (error: any) {
      console.error('수량 저장 오류:', error);
      const errorMessage = error.response?.data?.error || '수량 저장 중 오류가 발생했습니다.';
      alert(`수량 저장 실패: ${errorMessage}`);
    } finally {
      setSavingQuantity(false);
    }
  };

  const handleSavePrice = async () => {
    if (savingPrice) return;
    
    console.log('단가 저장 시도 - 현재 사용자:', currentUser);
    console.log('프로젝트 정보:', currentUser);
    console.log('단가 수정 값:', priceEdit);
    
    try {
      setSavingPrice(true);
      await apiService.updateMJProjectPrice(project.id, priceEdit);
      // 성공적으로 저장된 경우 프로젝트 객체 업데이트
      project.price = priceEdit;
      // 성공 시에는 팝업 메시지 없이 조용히 처리
    } catch (error: any) {
      console.error('단가 저장 오류:', error);
      const errorMessage = error.response?.data?.error || '단가 저장 중 오류가 발생했습니다.';
      alert(`단가 저장 실패: ${errorMessage}`);
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div className="detail-section project-info-section">
      <h3>📊 프로젝트 정보</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">상품명:</span>
          <span className="info-value">{project.product_name}</span>
        </div>
        <div className="info-item has-input">
          <span className="info-label">수량:</span>
          <span className="info-value editable-field">
            {currentUser && (currentUser.is_admin || currentUser.id === project.user_id) ? (
              <div className="edit-container">
                <input
                  type="number"
                  value={quantityEdit}
                  onChange={(e) => setQuantityEdit(Number(e.target.value) || 0)}
                  onBlur={handleSaveQuantity}
                  placeholder="수량 입력"
                  className="info-input"
                  min="1"
                />
              </div>
            ) : (
              <span>{project.quantity?.toLocaleString()}개</span>
            )}
          </span>
        </div>
        <div className="info-item has-input">
          <span className="info-label">단가:</span>
          <span className="info-value editable-field">
            {currentUser?.is_admin ? (
              <div className="edit-container">
                <input
                  type="number"
                  value={priceEdit}
                  onChange={(e) => setPriceEdit(Number(e.target.value) || 0)}
                  onBlur={handleSavePrice}
                  placeholder="단가 입력"
                  className="info-input"
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <span>{project.price ? `¥${project.price.toLocaleString()}` : '미정'}</span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">사용자명:</span>
          <span className="info-value">{project.username || '알 수 없음'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">회사명:</span>
          <span className="info-value">{project.company_name || '없음'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">이메일:</span>
          <span className="info-value">{project.email || '없음'}</span>
        </div>
      </div>
      
      {/* 참조 링크를 별도 줄에 표시 */}
      <div className="info-grid">
        <div className="info-item full-width">
          <span className="info-label">참조 링크:</span>
          <span className="info-value">
            {project.reference_link ? (
              <a 
                href={project.reference_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="reference-link clickable-link"
                title="클릭하여 새 탭에서 참조 링크 열기"
              >
                {project.reference_link}
                <span className="link-icon">🔗</span>
              </a>
            ) : '없음'}
          </span>
        </div>
        
        {/* 구매 링크를 별도 줄에 표시 (수정 가능) */}
        <div className="info-item full-width has-input">
          <span className="info-label">구매 링크:</span>
          <span className="info-value">
            {currentUser?.is_admin ? (
              <div className="edit-link-container">
                <input
                  type="text"
                  value={purchaseLinkEdit}
                  onChange={(e) => setPurchaseLinkEdit(e.target.value)}
                  onBlur={handleSavePurchaseLink}
                  className="link-edit-input"
                  placeholder="구매 링크를 입력하세요"
                />
              </div>
            ) : (
              <div className="link-display">
                {project.purchase_link ? (
                  <div className="link-with-actions">
                    <a 
                      href={project.purchase_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="purchase-link clickable-link"
                      title="클릭하여 새 탭에서 구매 링크 열기"
                    >
                      {project.purchase_link}
                      <span className="link-icon">🔗</span>
                    </a>
                    <button
                      type="button"
                      className="copy-link-btn"
                      onClick={() => {
                        if (project.purchase_link) {
                          navigator.clipboard.writeText(project.purchase_link);
                          // 복사 성공 피드백 (선택사항)
                        }
                      }}
                      title="링크 복사"
                    >
                      📋
                    </button>
                  </div>
                ) : '없음'}
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MJProjectDetailProjInfo; 