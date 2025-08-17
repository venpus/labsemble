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
  logistic_cost?: number | null;
  commission_rate?: number;
  commission?: number;
  total_payment?: number;
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
  const [logisticCost, setLogisticCost] = useState<number | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [commission, setCommission] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);

  // 컴포넌트 마운트 시 상태 초기화 및 초기 계산
  useEffect(() => {
    // 1. 기본 값들 초기화
    const initialQuantity = project.quantity || 0;
    const initialPrice = project.price || 0;
    const initialLogisticCost = project.logistic_cost || 0;
    const initialCommissionRate = project.commission_rate || 0;
    
    // 2. 구매원가 계산
    const initialPurchaseCost = initialQuantity * initialPrice;
    setPurchaseCost(initialPurchaseCost);
    
    // 3. logistic_cost 초기화
    setLogisticCost(project.logistic_cost || null);
    
    // 4. commission_rate 초기화
    console.log('DB commission_rate:', project.commission_rate, '타입:', typeof project.commission_rate);
    console.log('초기화할 commission_rate:', initialCommissionRate);
    
    // commission_rate가 null이거나 undefined인 경우 0으로 설정
    const finalCommissionRate = project.commission_rate !== null && project.commission_rate !== undefined ? Number(project.commission_rate) : 0;
    setCommissionRate(finalCommissionRate);
    console.log('최종 설정된 commission_rate:', finalCommissionRate);
    
    // 5. 수수료 계산 (구매원가 × 수수료율)
    const initialCommission = initialPurchaseCost * (finalCommissionRate / 100);
    setCommission(initialCommission);
    
    // 6. 총 결제 금액 결정 (DB 값 우선, 없으면 계산값 사용)
    let finalTotal;
    if (project.total_payment !== undefined && project.total_payment !== null && project.total_payment > 0) {
      finalTotal = Number(project.total_payment);
    } else {
      finalTotal = initialPurchaseCost + initialLogisticCost + initialCommission;
    }
    setTotalPayment(finalTotal);
    
  }, [project.id, project.quantity, project.price, project.logistic_cost, project.commission_rate, project.commission]);

  // 실시간 수수료 계산 (구매원가 × 수수료율) 및 DB 저장
  useEffect(() => {
    // 초기화가 완료된 후에만 계산 실행
    if (purchaseCost > 0 || commissionRate > 0) {
      const commissionAmount = purchaseCost * (commissionRate / 100);
      setCommission(commissionAmount);
      
      // 수수료가 변경되었고, Admin 사용자인 경우 DB에 저장
      if (currentUser?.is_admin && project.id && commissionAmount !== project.commission) {
        handleCommissionChange(commissionAmount);
      }
    }
  }, [purchaseCost, commissionRate, currentUser?.is_admin, project.id, project.commission]);

  // 실시간 총 결제 금액 계산 (구매원가 + Logistic_cost + 수수료) 및 DB 저장
  useEffect(() => {
    // 초기화가 완료된 후에만 계산 실행
    if (purchaseCost > 0 || (logisticCost && logisticCost > 0) || commission > 0) {
      const calculatedTotal = purchaseCost + (logisticCost || 0) + commission;
      
      // DB 값과 계산값이 다르면 계산값 사용, 같으면 DB 값 유지
      if (Math.abs(calculatedTotal - (project.total_payment || 0)) > 0.01) {
        setTotalPayment(calculatedTotal);
        
        // Admin 사용자인 경우 DB에 저장
        if (currentUser?.is_admin && project.id) {
          handleTotalPaymentChange(calculatedTotal);
        }
      } else {
        setTotalPayment(project.total_payment || 0);
      }
    }
  }, [purchaseCost, logisticCost, commission, currentUser?.is_admin, project.id, project.total_payment]);

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

  const handleLogisticCostChange = async (newCost: number | null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/logistic-cost`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logistic_cost: newCost })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.logistic_cost = newCost;
        // 성공 시에는 팝업 메시지 없이 조용히 처리
      } else {
        const errorData = await response.json();
        alert(`logistic_cost 업데이트에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('logistic_cost 업데이트 오류:', error);
      alert('logistic_cost 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleCommissionRateChange = async (newRate: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/commission-rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commission_rate: newRate })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.commission_rate = newRate;
        // 성공 시에는 팝업 메시지 없이 조용히 처리
      } else {
        const errorData = await response.json();
        alert(`commission_rate 업데이트에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('commission_rate 업데이트 오류:', error);
      alert('commission_rate 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleCommissionChange = async (newCommission: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/commission`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commission: newCommission })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.commission = newCommission;
        // 성공 시에는 팝업 메시지 없이 조용히 처리
      } else {
        const errorData = await response.json();
        alert(`commission 업데이트에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('commission 업데이트 오류:', error);
      alert('commission 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleTotalPaymentChange = async (newTotal: number) => {
    try {
      // 값 검증
      if (newTotal === undefined || newTotal === null || isNaN(newTotal)) {
        console.error('유효하지 않은 total_payment 값:', newTotal);
        return;
      }

      console.log('total_payment 업데이트 시도:', newTotal);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/total-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ total_payment: newTotal })
      });

      if (response.ok) {
        // 성공적으로 저장된 경우 프로젝트 객체 업데이트
        project.total_payment = newTotal;
        console.log('total_payment 업데이트 성공:', newTotal);
        // 성공 시에는 팝업 메시지 없이 조용히 처리
      } else {
        const errorData = await response.json();
        console.error('total_payment 업데이트 실패:', errorData);
        alert(`total_payment 업데이트에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
        if (errorData.details) {
          console.error('상세 오류:', errorData.details);
        }
      }
    } catch (error) {
      console.error('total_payment 업데이트 오류:', error);
      alert('total_payment 업데이트 중 오류가 발생했습니다.');
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
          <span className="info-label">Logistic Cost:</span>
          <span className="info-value editable-field">
            {currentUser?.is_admin ? (
              <input
                type="number"
                value={logisticCost ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setLogisticCost(value === '' ? null : Number(value));
                }}
                onBlur={() => handleLogisticCostChange(logisticCost)}
                placeholder="Logistic Cost 입력"
                className="payment-input"
                min="0"
                step="0.01"
              />
            ) : (
              <span>{logisticCost ? formatCurrency(logisticCost) : '미정'}</span>
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">수수료율:</span>
          <span className="info-value editable-field">
            {currentUser?.is_admin ? (
              <select
                key={`commission-rate-${project.id}-${commissionRate}`}
                value={commissionRate}
                onChange={(e) => {
                  const newRate = Number(e.target.value);
                  setCommissionRate(newRate);
                  handleCommissionRateChange(newRate);
                }}
                className="payment-select"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={7}>7%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
              </select>
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
            <span className="calculation-note">(구매원가 + Logistic Cost + 수수료)</span>
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