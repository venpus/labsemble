import React, { useState } from 'react';
import './MJProjectDetail.css';

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

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

      <div className="detail-content">
        <div className="detail-section">
          <h3>📊 프로젝트 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">상품명:</span>
              <span className="info-value">{project.product_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">수량:</span>
              <span className="info-value">{project.quantity?.toLocaleString()}개</span>
            </div>
            <div className="info-item">
              <span className="info-label">견적가:</span>
              <span className="info-value">
                {project.price ? `¥${project.price.toLocaleString()}` : '미정'}
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
            
            {/* 참조 링크를 별도 줄에 표시 */}
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
            <div className="info-item full-width">
              <span className="info-label">구매 링크:</span>
              <span className="info-value">
                {editingPurchaseLink ? (
                  <div className="edit-link-container">
                    <input
                      type="text"
                      value={purchaseLinkEdit}
                      onChange={(e) => setPurchaseLinkEdit(e.target.value)}
                      className="link-edit-input"
                      placeholder="구매 링크를 입력하세요"
                    />
                    <div className="edit-actions">
                      <button 
                        className="save-link-btn"
                        onClick={handleSavePurchaseLink}
                      >
                        저장
                      </button>
                      <button 
                        className="cancel-link-btn"
                        onClick={() => setEditingPurchaseLink(false)}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="link-display">
                    {project.purchase_link ? (
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
                    ) : '없음'}
                    <button 
                      className="edit-link-btn"
                      onClick={() => {
                        setPurchaseLinkEdit(project.purchase_link || '');
                        setEditingPurchaseLink(true);
                      }}
                    >
                      수정
                    </button>
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>📈 상태 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">프로젝트 상태:</span>
              <span className="info-value">{project.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">결제 상태:</span>
              <span className="info-value">
                {project.payment_status === 'completed' ? '완료' : 
                 project.payment_status === 'failed' ? '실패' : 
                 project.payment_status === 'pending' ? '대기중' : '미정'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">배송 상태:</span>
              <span className="info-value">
                {project.delivery_status === 'delivered' ? '배송완료' :
                 project.delivery_status === 'processing' ? '처리중' :
                 project.delivery_status === 'completed' ? '완료' : 
                 project.delivery_status === 'waiting' ? '대기중' : '미정'}
              </span>
            </div>

          </div>
        </div>

        <div className="detail-section">
          <h3>📅 납기 정보</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">등록일:</span>
              <span className="info-value">{formatDate(project.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">수정일:</span>
              <span className="info-value">{formatDate(project.updated_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">출고 예정일:</span>
              <span className="info-value">
                {project.expected_shipping_date ? formatDate(project.expected_shipping_date) : '미정'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">출고 상태:</span>
              <span className="info-value">없음</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>💰 결제상태</h3>
          <div className="payment-info-row">
            <div className="payment-item">
              <span className="payment-label">구매원가:</span>
              <span className="payment-value">¥0</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">중국내 배송비:</span>
              <span className="payment-value">¥0</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">수수료율:</span>
              <span className="payment-value">0%</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">수수료:</span>
              <span className="payment-value">¥0</span>
            </div>
            <div className="payment-item total">
              <span className="payment-label">총 결제 금액:</span>
              <span className="payment-value">¥0</span>
            </div>
          </div>
        </div>




      </div>
    </div>
  );
};

export default MJProjectDetail; 