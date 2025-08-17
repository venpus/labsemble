import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import './MJProjectDetailDeliveryInfo.css';

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
  production_days?: number;
  project_code?: string;
  quotation_approval?: string;
  created_at: string;
  updated_at: string;
  username?: string;
  company_name?: string;
  email?: string;
}

interface MJProjectDetailDeliveryInfoProps {
  project: MJProject;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
  onProjectUpdate?: () => void; // 프로젝트 정보 업데이트 콜백
}

const MJProjectDetailDeliveryInfo: React.FC<MJProjectDetailDeliveryInfoProps> = ({ project, currentUser, onProjectUpdate }) => {
  const [expectedShippingDateEdit, setExpectedShippingDateEdit] = useState<string>('');
  const [productionDaysEdit, setProductionDaysEdit] = useState<number | null>(null);

  useEffect(() => {
    console.log('프로젝트 데이터 변경됨:', project);
    console.log('출고 예정일 원본 값:', project.expected_shipping_date);
    console.log('생산소요일 원본 값:', project.production_days);
    console.log('프로젝트 객체 전체:', JSON.stringify(project, null, 2));
    console.log('출고 예정일 타입:', typeof project.expected_shipping_date);
    console.log('프로젝트 키들:', Object.keys(project));
    console.log('현재 사용자:', currentUser);
    console.log('Admin 권한 여부:', currentUser?.is_admin);
    
    if (project.expected_shipping_date) {
      // MySQL 날짜 형식을 HTML date input 형식으로 변환
      const date = new Date(project.expected_shipping_date);
      const formattedDate = date.toISOString().split('T')[0];
      console.log('변환된 날짜:', formattedDate);
      setExpectedShippingDateEdit(formattedDate);
    } else {
      console.log('출고 예정일이 설정되지 않음');
      setExpectedShippingDateEdit('');
    }

    // 생산소요일 초기화
    setProductionDaysEdit(project.production_days || null);
  }, [project, currentUser]);

  // 출고 예정일 입력값이 변경될 때마다 출고 상태 실시간 업데이트
  useEffect(() => {
    console.log('출고 예정일 입력값 변경됨:', expectedShippingDateEdit);
  }, [expectedShippingDateEdit]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveExpectedShippingDate = async () => {
    try {
      const response = await apiService.updateMJProjectExpectedShippingDate(project.id, expectedShippingDateEdit);
      // 성공 시에는 팝업 메시지 없이 조용히 처리
      // 부모 컴포넌트에 업데이트 알림
      if (onProjectUpdate) {
        onProjectUpdate();
      } else {
        // 콜백이 없을 때는 콘솔에 로그만 출력
        console.log('출고 예정일 업데이트됨 - 콜백 없음');
      }
    } catch (error: any) {
      console.error('출고 예정일 수정 오류:', error);
      const errorMessage = error.response?.data?.error || '출고 예정일 수정에 실패했습니다.';
      alert(`출고 예정일 수정 실패: ${errorMessage}`);
    }
  };

  const handleClearExpectedShippingDate = async () => {
    try {
      // 로컬 상태를 즉시 업데이트하여 UI 반영
      setExpectedShippingDateEdit('');
      
      // null로 설정하여 DB에서 NULL로 저장
      const response = await apiService.updateMJProjectExpectedShippingDate(project.id, null);
      
      // 성공 시에는 팝업 메시지 없이 조용히 처리
      if (onProjectUpdate) {
        onProjectUpdate();
      } else {
        console.log('출고 예정일 삭제됨 - 콜백 없음');
      }
    } catch (error: any) {
      console.error('출고 예정일 삭제 오류:', error);
      const errorMessage = error.response?.data?.error || '출고 예정일 삭제에 실패했습니다.';
      alert(`출고 예정일 삭제 실패: ${errorMessage}`);
      
      // 실패 시 원래 값으로 복원
      if (project.expected_shipping_date) {
        const date = new Date(project.expected_shipping_date);
        const formattedDate = date.toISOString().split('T')[0];
        setExpectedShippingDateEdit(formattedDate);
      }
    }
  };

  const handleSaveProductionDays = async () => {
    try {
      await apiService.updateMJProjectProductionDays(project.id, productionDaysEdit);
      // 성공 시에는 팝업 메시지 없이 조용히 처리
      if (onProjectUpdate) {
        onProjectUpdate();
      } else {
        console.log('생산소요일 업데이트됨 - 콜백 없음');
      }
    } catch (error: any) {
      console.error('생산소요일 수정 오류:', error);
      const errorMessage = error.response?.data?.error || '생산소요일 수정에 실패했습니다.';
      alert(`생산소요일 수정 실패: ${errorMessage}`);
    }
  };



  const getDeliveryStatusText = () => {
    console.log('getDeliveryStatusText 호출됨');
    console.log('expectedShippingDateEdit:', expectedShippingDateEdit);
    console.log('project.expected_shipping_date:', project.expected_shipping_date);
    
    // 현재 입력 중인 출고 예정일을 우선 사용 (실시간 반영)
    const currentExpectedDate = expectedShippingDateEdit || project.expected_shipping_date;
    console.log('현재 사용할 출고 예정일:', currentExpectedDate);
    console.log('currentExpectedDate 타입:', typeof currentExpectedDate);
    console.log('currentExpectedDate 값이 falsy인가?', !currentExpectedDate);
    
    // 출고 예정일이 없으면 '검토중'
    if (!currentExpectedDate || currentExpectedDate === '' || currentExpectedDate === 'null') {
      console.log('출고 예정일 없음 -> 검토중');
      return '검토중';
    }

    const today = new Date();
    const expectedDate = new Date(currentExpectedDate);
    
    console.log('오늘 날짜:', today);
    console.log('예상 출고일:', expectedDate);
    
    // 시간을 제거하고 날짜만 비교
    today.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);
    
    console.log('비교용 오늘:', today);
    console.log('비교용 예상 출고일:', expectedDate);

    // 출고 예정일이 지났으면 '출고연기'
    if (expectedDate < today) {
      console.log('출고 예정일이 지남 -> 출고연기');
      return '출고연기';
    }
    
    // 출고 예정일이 앞서있으면 '출고대기'
    if (expectedDate > today) {
      console.log('출고 예정일이 앞서있음 -> 출고대기');
      return '출고대기';
    }
    
    // 출고 예정일이 오늘이면 '출고대기'
    console.log('출고 예정일이 오늘 -> 출고대기');
    return '출고대기';
  };

  const getDeliveryStatusClass = () => {
    // 현재 입력 중인 출고 예정일을 우선 사용 (실시간 반영)
    const currentExpectedDate = expectedShippingDateEdit || project.expected_shipping_date;
    
    // 출고 예정일이 없으면 '검토중' 스타일
    if (!currentExpectedDate || currentExpectedDate === '' || currentExpectedDate === 'null') {
      return 'status-review';
    }

    const today = new Date();
    const expectedDate = new Date(currentExpectedDate);
    
    // 시간을 제거하고 날짜만 비교
    today.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);

    // 출고 예정일이 지났으면 '출고연기' 스타일 (warning)
    if (expectedDate < today) {
      return 'status-delayed';
    }
    
    // 출고 예정일이 앞서있거나 오늘이면 '출고대기' 스타일 (success)
    return 'status-waiting';
  };

  return (
    <div className="detail-section delivery-info-section">
      <h3>📅 납기 정보</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">생성일:</span>
          <span className="info-value">{formatDate(project.created_at)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">생산소요일:</span>
          <span className="info-value">
            {currentUser?.is_admin ? (
              <div className="edit-container">
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={productionDaysEdit ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('생산소요일 입력값 변경:', value);
                      setProductionDaysEdit(value === '' ? null : Number(value));
                    }}
                    onBlur={handleSaveProductionDays}
                    className="info-input"
                    placeholder="일수 입력"
                    min="1"
                  />
                  <span className="unit-text">일</span>
                </div>
              </div>
            ) : (
              <span className="editable-field">
                {project.production_days ? `${project.production_days}일` : '미정'}
              </span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">출고 예정일:</span>
          <span className="info-value">
            {currentUser?.is_admin ? (
              <div className="edit-container">
                <div className="input-with-clear">
                  <input
                    type="date"
                    value={expectedShippingDateEdit}
                    onChange={(e) => {
                      setExpectedShippingDateEdit(e.target.value);
                      console.log('출고 예정일 입력값 변경됨:', e.target.value);
                    }}
                    onBlur={handleSaveExpectedShippingDate}
                    className="info-input"
                  />
                  {expectedShippingDateEdit && (
                    <button
                      type="button"
                      className="clear-date-btn"
                      onClick={handleClearExpectedShippingDate}
                      title="출고 예정일 삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <span className="editable-field">
                {project.expected_shipping_date ? formatDate(project.expected_shipping_date) : '미정'}
              </span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">출고 상태:</span>
          <span className="info-value">
            <span className={`status-field ${getDeliveryStatusClass()}`}>
              {getDeliveryStatusText()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MJProjectDetailDeliveryInfo; 