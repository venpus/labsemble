import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import './MJProjectSearch.css';

export interface SearchFilters {
  user: string;
  company: string;
  date: string;
  projectCode: string;
  productName: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
}

interface WorkStatus {
  id: number;
  name: string;
  description: string;
  color: string;
  order: number;
  is_active: boolean;
  category: string;
  status_type: string;
}

interface MJProjectSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  totalCount: number;
  filteredCount: number;
  isAdmin?: boolean;
}

const MJProjectSearch: React.FC<MJProjectSearchProps> = ({ onSearch, onClear, totalCount, filteredCount, isAdmin = false }) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    user: '',
    company: '',
    date: '',
    projectCode: '',
    productName: '',
    status: '',
    paymentStatus: '',
    deliveryStatus: ''
  });

  const [mjProjectStatuses, setMjProjectStatuses] = useState<WorkStatus[]>([]);
  const [mjPaymentStatuses, setMjPaymentStatuses] = useState<WorkStatus[]>([]);
  const [mjDeliveryStatuses, setMjDeliveryStatuses] = useState<WorkStatus[]>([]);
  const [loading, setLoading] = useState(false);

  // MJ 프로젝트 상태 목록 로드
  useEffect(() => {
    loadMJProjectStatuses();
    loadMJPaymentStatuses();
    loadMJDeliveryStatuses();
  }, []);

  const loadMJProjectStatuses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMJProjectStatuses();
      if (response.data.success) {
        setMjProjectStatuses(response.data.statuses || []);
      }
    } catch (error) {
      console.error('MJ 프로젝트 상태 로드 오류:', error);
      // 기본 상태 목록으로 폴백
      setMjProjectStatuses([
        { id: 1, name: '요청접수', description: '새로운 MJ 서비스 요청이 접수됨', color: '#3B82F6', order: 1, is_active: true, category: 'mj', status_type: 'work' },
        { id: 2, name: '검토중', description: 'MJ 서비스 요청을 검토 중', color: '#F59E0B', order: 2, is_active: true, category: 'mj', status_type: 'work' },
        { id: 3, name: '승인됨', description: 'MJ 서비스 요청이 승인됨', color: '#10B981', order: 3, is_active: true, category: 'mj', status_type: 'work' },
        { id: 4, name: '처리중', description: 'MJ 서비스가 처리 중', color: '#8B5CF6', order: 4, is_active: true, category: 'mj', status_type: 'work' },
        { id: 5, name: '완료', description: 'MJ 서비스가 완료됨', color: '#059669', order: 5, is_active: true, category: 'mj', status_type: 'work' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMJPaymentStatuses = async () => {
    try {
      const response = await apiService.getMJPaymentStatuses();
      if (response.data.success) {
        setMjPaymentStatuses(response.data.statuses || []);
      }
    } catch (error) {
      console.error('MJ 결제 상태 로드 오류:', error);
      // 기본 결제 상태 목록으로 폴백
      setMjPaymentStatuses([
        { id: 1, name: 'pending', description: '결제 대기 중', color: '#EF4444', order: 1, is_active: true, category: 'mj', status_type: 'payment' },
        { id: 2, name: 'completed', description: '결제가 완료됨', color: '#10B981', order: 2, is_active: true, category: 'mj', status_type: 'payment' },
        { id: 3, name: 'failed', description: '결제 실패', color: '#DC2626', order: 3, is_active: true, category: 'mj', status_type: 'payment' }
      ]);
    }
  };

  const loadMJDeliveryStatuses = async () => {
    try {
      const response = await apiService.getMJDeliveryStatuses();
      if (response.data.success) {
        setMjDeliveryStatuses(response.data.statuses || []);
      }
    } catch (error) {
      console.error('MJ 배송 상태 로드 오류:', error);
      // 기본 배송 상태 목록으로 폴백
      setMjDeliveryStatuses([
        { id: 1, name: 'waiting', description: '배송 준비 중', color: '#8B5CF6', order: 1, is_active: true, category: 'mj', status_type: 'delivery' },
        { id: 2, name: 'processing', description: '배송이 진행 중', color: '#EC4899', order: 2, is_active: true, category: 'mj', status_type: 'delivery' },
        { id: 3, name: 'completed', description: '배송이 완료됨', color: '#059669', order: 3, is_active: true, category: 'mj', status_type: 'delivery' },
        { id: 4, name: 'delivered', description: '배송 완료', color: '#10B981', order: 4, is_active: true, category: 'mj', status_type: 'delivery' }
      ]);
    }
  };

  const handleSearchChange = (field: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applySearch = () => {
    onSearch(searchFilters);
  };

  const clearSearch = () => {
    setSearchFilters({
      user: '',
      company: '',
      date: '',
      projectCode: '',
      productName: '',
      status: '',
      paymentStatus: '',
      deliveryStatus: ''
    });
    onClear();
  };

  const getPaymentStatusDisplayName = (statusName: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '대기중',
      'completed': '완료',
      'failed': '실패'
    };
    return statusMap[statusName] || statusName;
  };

  const getDeliveryStatusDisplayName = (statusName: string) => {
    const statusMap: { [key: string]: string } = {
      'waiting': '대기중',
      'processing': '처리중',
      'completed': '완료',
      'delivered': '배송완료'
    };
    return statusMap[statusName] || statusName;
  };

  return (
    <div className="search-filters">
      <h3>프로젝트 검색</h3>
      <div className="search-grid">
        {isAdmin && (
          <div className="search-field">
            <label>사용자</label>
            <input
              type="text"
              placeholder="사용자명 입력"
              value={searchFilters.user}
              onChange={(e) => handleSearchChange('user', e.target.value)}
              className="search-input"
            />
          </div>
        )}
        
        {isAdmin && (
          <div className="search-field">
            <label>회사명</label>
            <input
              type="text"
              placeholder="회사명 입력"
              value={searchFilters.company}
              onChange={(e) => handleSearchChange('company', e.target.value)}
              className="search-input"
            />
          </div>
        )}
        
        <div className="search-field">
          <label>등록일</label>
          <input
            type="date"
            value={searchFilters.date}
            onChange={(e) => handleSearchChange('date', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="search-field">
          <label>프로젝트 코드</label>
          <input
            type="text"
            placeholder="프로젝트 코드 입력"
            value={searchFilters.projectCode}
            onChange={(e) => handleSearchChange('projectCode', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="search-field">
          <label>상품명</label>
          <input
            type="text"
            placeholder="상품명 입력"
            value={searchFilters.productName}
            onChange={(e) => handleSearchChange('productName', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="search-field">
          <label>프로젝트 상태</label>
          <select
            value={searchFilters.status}
            onChange={(e) => handleSearchChange('status', e.target.value)}
            className="search-select"
            disabled={loading}
          >
            <option value="">전체</option>
            {mjProjectStatuses.map((status) => (
              <option key={status.id} value={status.name}>
                {status.name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-field">
          <label>결제 상태</label>
          <select
            value={searchFilters.paymentStatus}
            onChange={(e) => handleSearchChange('paymentStatus', e.target.value)}
            className="search-select"
          >
            <option value="">전체</option>
            {mjPaymentStatuses.map((status) => (
              <option key={status.id} value={status.name}>
                {getPaymentStatusDisplayName(status.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="search-field">
          <label>배송 상태</label>
          <select
            value={searchFilters.deliveryStatus}
            onChange={(e) => handleSearchChange('deliveryStatus', e.target.value)}
            className="search-select"
          >
            <option value="">전체</option>
            {mjDeliveryStatuses.map((status) => (
              <option key={status.id} value={status.name}>
                {getDeliveryStatusDisplayName(status.name)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="search-actions">
        <button onClick={applySearch} className="search-btn">
          검색
        </button>
        <button onClick={clearSearch} className="clear-btn">
          검색 초기화
        </button>
        <span className="search-results">
          검색 결과: {filteredCount}개 / 전체: {totalCount}개
        </span>
      </div>
    </div>
  );
};

export default MJProjectSearch; 