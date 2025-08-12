import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './UserDashboard.css';

interface User {
  id: number;
  username: string;
  email: string;
  company_name?: string;
  contact_person?: string;
  phone_number?: string;
  business_name?: string;
  business_number?: string;
  business_address?: string;
  ceo_name?: string;
  tax_email?: string;
  is_admin?: boolean;
  created_at: string;
}

interface VipPartner {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface UserPartner {
  id: number;
  name: string;
  assigned_at: string;
}



interface UserDashboardProps {
  currentUser: User;
  onOpenMJRegistration: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onOpenMJRegistration }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userPartners, setUserPartners] = useState<UserPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: currentUser.company_name || '',
    contact_person: currentUser.contact_person || '',
    phone_number: currentUser.phone_number || '',
    business_name: currentUser.business_name || '',
    business_number: currentUser.business_number || '',
    business_address: currentUser.business_address || '',
    ceo_name: currentUser.ceo_name || '',
    tax_email: currentUser.tax_email || ''
  });

  useEffect(() => {
    loadUserPartners();
  }, [currentUser.id]);

  const loadUserPartners = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUserPartners(currentUser.id);
      setUserPartners(response.data.partners || []);
    } catch (err) {
      console.error('파트너스 로드 오류:', err);
      setError('파트너스 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  const formatDateTime = (dateString: string) => {
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
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };





  // 수정 모드 토글
  const handleEditToggle = () => {
    if (isEditing) {
      // 수정 취소 시 원래 값으로 복원
      setEditForm({
        company_name: currentUser.company_name || '',
        contact_person: currentUser.contact_person || '',
        phone_number: currentUser.phone_number || '',
        business_name: currentUser.business_name || '',
        business_number: currentUser.business_number || '',
        business_address: currentUser.business_address || '',
        ceo_name: currentUser.ceo_name || '',
        tax_email: currentUser.tax_email || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // 폼 입력 처리
  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 정보 수정 저장
  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await apiService.updateUserProfile(currentUser.id, {
        username: currentUser.username,
        email: currentUser.email,
        company_name: editForm.company_name,
        contact_person: editForm.contact_person,
        phone_number: editForm.phone_number,
        business_name: editForm.business_name,
        business_number: editForm.business_number,
        business_address: editForm.business_address,
        ceo_name: editForm.ceo_name,
        tax_email: editForm.tax_email
      });
      
      // 현재 사용자 정보 업데이트
      Object.assign(currentUser, {
        company_name: editForm.company_name,
        contact_person: editForm.contact_person,
        phone_number: editForm.phone_number,
        business_name: editForm.business_name,
        business_number: editForm.business_number,
        business_address: editForm.business_address,
        ceo_name: editForm.ceo_name,
        tax_email: editForm.tax_email
      });
      
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || '정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="user-loading">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="user-sidebar">
        <div className="sidebar-header">
          <h2>👋 {currentUser.username}님</h2>
          <p>Labsemble 서비스</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">대시보드</span>
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="sidebar-icon">👤</span>
            <span className="sidebar-text">내 정보</span>
          </button>
          

          
          <button 
            className={`sidebar-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <span className="sidebar-icon">🛠️</span>
            <span className="sidebar-text">MJ 서비스</span>
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span className="sidebar-icon">📞</span>
            <span className="sidebar-text">문의 및 지원</span>
          </button>
        </nav>
      </div>

      <div className="user-main">
        {error && (
          <div className="user-error">
            <p>❌ {error}</p>
            <button onClick={() => setError('')}>닫기</button>
          </div>
        )}

        <div className="main-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div className="stat-info">
                    <h3>내 정보</h3>
                    <p className="stat-number">{currentUser.username}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💎</div>
                  <div className="stat-info">
                    <h3>할당된 파트너스</h3>
                    <p className="stat-number">{userPartners.length}개</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🛠️</div>
                  <div className="stat-info">
                    <h3>이용 가능 서비스</h3>
                    <p className="stat-number">5개</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>가입일</h3>
                    <p className="stat-status">{formatDate(currentUser.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <h2>📋 최근 활동</h2>
                </div>
                <div className="card-content">
                  <div className="info-row">
                    <span className="info-label">마지막 로그인</span>
                    <span className="info-value">오늘</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">할당된 파트너스</span>
                    <span className="info-value">{userPartners.length > 0 ? userPartners[0].name : '없음'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">계정 상태</span>
                    <span className="info-value">활성</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="dashboard-section">
              <div className="info-card">
                <div className="card-header">
                  <h2>👤 내 정보</h2>
                  <button 
                    className={`edit-toggle-btn ${isEditing ? 'cancel' : 'edit'}`}
                    onClick={handleEditToggle}
                    disabled={loading}
                  >
                    {isEditing ? '취소' : '수정'}
                  </button>
                </div>
                <div className="card-content">
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="info-label">사용자명</span>
                      <span className="info-value">{currentUser.username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">이메일</span>
                      <span className="info-value">{currentUser.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">회사명</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          className="edit-input"
                          placeholder="회사명을 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.company_name || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">담당자</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.contact_person}
                          onChange={(e) => handleInputChange('contact_person', e.target.value)}
                          className="edit-input"
                          placeholder="담당자명을 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.contact_person || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">전화번호</span>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editForm.phone_number}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          className="edit-input"
                          placeholder="전화번호를 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.phone_number || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">계정 유형</span>
                      <span className="info-value">{currentUser.is_admin ? '관리자' : '일반 사용자'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">가입일</span>
                      <span className="info-value">{formatDate(currentUser.created_at)}</span>
                    </div>
                  </div>

                  {/* 세금계산서 정보 섹션 */}
                  <div className="info-section-divider">
                    <h3>🧾 세금계산서 정보</h3>
                  </div>
                  
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="info-label">사업자명</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.business_name}
                          onChange={(e) => handleInputChange('business_name', e.target.value)}
                          className="edit-input"
                          placeholder="사업자명을 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.business_name || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">사업자등록번호</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.business_number}
                          onChange={(e) => handleInputChange('business_number', e.target.value)}
                          className="edit-input"
                          placeholder="사업자등록번호를 입력하세요 (예: 123-45-67890)"
                        />
                      ) : (
                        <span className="info-value">{currentUser.business_number || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">사업자주소</span>
                      {isEditing ? (
                        <textarea
                          value={editForm.business_address}
                          onChange={(e) => handleInputChange('business_address', e.target.value)}
                          className="edit-input"
                          placeholder="사업자주소를 입력하세요"
                          rows={3}
                        />
                      ) : (
                        <span className="info-value">{currentUser.business_address || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">대표자명</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.ceo_name}
                          onChange={(e) => handleInputChange('ceo_name', e.target.value)}
                          className="edit-input"
                          placeholder="대표자명을 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.ceo_name || '-'}</span>
                      )}
                    </div>
                    <div className="info-row">
                      <span className="info-label">세금계산서 이메일</span>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.tax_email}
                          onChange={(e) => handleInputChange('tax_email', e.target.value)}
                          className="edit-input"
                          placeholder="세금계산서 발행 이메일을 입력하세요"
                        />
                      ) : (
                        <span className="info-value">{currentUser.tax_email || '-'}</span>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="edit-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveChanges}
                        disabled={loading}
                      >
                        {loading ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* VIP 파트너스 정보 섹션 추가 */}
              <div className="info-card">
                <div className="card-header">
                  <h2>💎 할당된 VIP 파트너스</h2>
                </div>
                <div className="card-content">
                  {userPartners.length > 0 ? (
                    <div className="partners-list">
                      {userPartners.map((partner) => (
                        <div key={partner.id} className="partner-item">
                          <div className="partner-info">
                            <span className="partner-name">{partner.name}</span>
                            <span className="partner-date">
                              할당일: {formatDate(partner.assigned_at)}
                            </span>
                          </div>
                          <div className="partner-status">
                            <span className="status-badge active">활성</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-partners">
                      <p>아직 할당된 VIP 파트너스가 없습니다.</p>
                      <p className="contact-admin">
                        관리자에게 문의하여 파트너스를 할당받으세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



          {activeTab === 'services' && (
            <div className="dashboard-section">
              <div className="info-card">
                <div className="card-header">
                  <h2>🛠️ 이용가능한 서비스</h2>
                  <button
                    className="new-project-btn"
                    onClick={onOpenMJRegistration}
                  >
                    새 프로젝트 등록
                  </button>
                </div>
                <div className="card-content">
                  <div className="services-content">
                    <p>MJ 서비스 기능은 준비 중입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="dashboard-section">
              <div className="info-card">
                <div className="card-header">
                  <h2>📞 문의 및 지원</h2>
                </div>
                <div className="card-content">
                  <div className="support-info">
                    <p>서비스 이용 중 궁금한 점이 있으시면 언제든 연락주세요.</p>
                    <div className="contact-buttons">
                      <button className="contact-btn primary">문의하기</button>
                      <button className="contact-btn secondary">FAQ</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 