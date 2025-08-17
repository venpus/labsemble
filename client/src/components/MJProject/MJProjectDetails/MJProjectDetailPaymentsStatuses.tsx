import React, { useEffect, useState } from 'react';
import './MJProjectDetailPaymentsStatuses.css';

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

interface MJProjectDetailPaymentsStatusesProps {
  project: MJProject;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
}

const MJProjectDetailPaymentsStatuses: React.FC<MJProjectDetailPaymentsStatusesProps> = ({ project, currentUser }) => {
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [domesticShippingFee, setDomesticShippingFee] = useState<number>(0);
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [commission, setCommission] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);

  // 구매원가 계산 (수량 × 단가)
  useEffect(() => {
    const cost = (project.quantity || 0) * (project.price || 0);
    setPurchaseCost(cost);
  }, [project.quantity, project.price]);

  // 수수료 계산 (구매원가 × 수수료율)
  useEffect(() => {
    const commissionAmount = purchaseCost * (commissionRate / 100);
    setCommission(commissionAmount);
  }, [purchaseCost, commissionRate]);

  // 총 결제 금액 계산 (구매원가 + 중국내 배송비 + 수수료)
  useEffect(() => {
    const total = purchaseCost + domesticShippingFee + commission;
    setTotalPayment(total);
  }, [purchaseCost, domesticShippingFee, commission]);

  const handleQuotationApprovalChange = async (newApproval: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/quotation-approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quotationApproval: newApproval })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.quotation_approval = newApproval;
        alert('견적승인이 성공적으로 업데이트되었습니다.');
      } else {
        const errorData = await response.json();
        alert(`견적승인 업데이트에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('견적승인 업데이트 오류:', error);
      alert('견적승인 업데이트 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatPercentage = (rate: number) => {
    return `${rate}%`;
  };

  return (
    <div className="detail-section payments-statuses-section">
      <h3>💰 결제상태</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">구매원가:</span>
          <span className="info-value auto-calculated">
            {formatCurrency(purchaseCost)}
            <span className="calculation-note">(수량 × 단가)</span>
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">중국내 배송비:</span>
          <span className="info-value editable-field">
            {currentUser?.is_admin ? (
              <input
                type="number"
                value={domesticShippingFee}
                onChange={(e) => setDomesticShippingFee(Number(e.target.value) || 0)}
                placeholder="배송비 입력"
                className="payment-input"
              />
            ) : (
              <span>{formatCurrency(domesticShippingFee)}</span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">수수료율:</span>
          <span className="info-value editable-field">
            {currentUser?.is_admin ? (
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                placeholder="수수료율 입력"
                className="payment-input"
                step="0.1"
                min="0"
                max="100"
              />
            ) : (
              <span>{formatPercentage(commissionRate)}</span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">수수료:</span>
          <span className="info-value auto-calculated">
            {formatCurrency(commission)}
            <span className="calculation-note">(구매원가 × 수수료율)</span>
          </span>
        </div>
      </div>
      
      {/* 총 결제 금액과 견적승인을 별도 줄에 배치 */}
      <div className="payment-bottom-row">
        <div className="info-item total-payment">
          <span className="info-label">총 결제 금액:</span>
          <span className="info-value auto-calculated">
            {formatCurrency(totalPayment)}
            <span className="calculation-note">(구매원가 + 배송비 + 수수료)</span>
          </span>
        </div>
        <div className="info-item quotation-approval">
          <span className="info-label">견적승인:</span>
          {currentUser?.is_admin ? (
            <select 
              value={project.quotation_approval || '승인 대기'} 
              onChange={(e) => handleQuotationApprovalChange(e.target.value)}
              className="quotation-select"
            >
              <option value="승인 대기">승인 대기</option>
              <option value="승인됨">승인됨</option>
              <option value="거절됨">거절됨</option>
            </select>
          ) : (
            <span className="info-value">{project.quotation_approval || '승인 대기'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MJProjectDetailPaymentsStatuses; 