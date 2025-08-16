import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentUser: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: 'user' | 'admin';
  onOpenMJRegistration?: () => void;
  mjProjectCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  activeTab, 
  onTabChange, 
  userType,
  onOpenMJRegistration,
  mjProjectCount
}) => {
  // 메뉴 아이템 타입 정의
  type MenuItem = {
    id: string;
    label: string;
    icon: string;
    count?: number;
  };

  // 일반 사용자용 메뉴 아이템
  const userMenuItems: MenuItem[] = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'profile', label: '내 정보', icon: '👤' },
    { id: 'services', label: 'MJ 서비스', icon: '🛠️' },
    { id: 'support', label: '문의 및 지원', icon: '📞' }
  ];

  // 관리자용 메뉴 아이템
  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'users', label: '사용자 관리', icon: '👥' },
    { id: 'partners', label: '파트너스 관리', icon: '💎' },
    { id: 'mj-projects', label: 'MJ 프로젝트', icon: '🛠️', count: mjProjectCount },
    { id: 'work-status', label: '작업상태 관리', icon: '📋' },
    { id: 'system', label: '시스템 설정', icon: '⚙️' }
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>👋 {currentUser?.username}님</h2>
        <p className="user-type">
          {userType === 'admin' ? '관리자' : 'Labsemble 서비스'}
        </p>
        {userType === 'admin' && (
          <div className="admin-badge">
            <span>🔑 관리자 권한</span>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-text">{item.label}</span>
            {item.count !== undefined && (
              <span className="sidebar-count">{item.count}</span>
            )}
          </button>
        ))}
        
        {/* MJ 프로젝트 등록 버튼 (일반 사용자만) */}
        {userType === 'user' && onOpenMJRegistration && (
          <div className="sidebar-action">
            <button 
              className="sidebar-action-btn"
              onClick={onOpenMJRegistration}
            >
              <span className="sidebar-icon">➕</span>
              <span className="sidebar-text">새 프로젝트</span>
            </button>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-email">{currentUser?.email}</p>
          <p className="user-company">
            {currentUser?.company_name || '회사 정보 없음'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 