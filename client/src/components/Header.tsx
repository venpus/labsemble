import React, { useState } from 'react';
import './Header.css';

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser: any;
  userPartners: any[];
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  onGoHome: () => void;
  onMJRegistration: () => void;
  showAdmin: boolean;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  isAuthenticated, 
  currentUser, 
  userPartners,
  onLoginClick, 
  onLogout,
  onAdminClick,
  onGoHome,
  onMJRegistration,
  showAdmin,
  isAdmin
}) => {
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

  const handleServiceMouseEnter = () => {
    setIsServiceDropdownOpen(true);
  };

  const handleServiceMouseLeave = () => {
    setIsServiceDropdownOpen(false);
  };

  // 사용자의 파트너스 정보를 기반으로 서비스 메뉴 필터링
  const getServiceMenuItems = () => {
    const allServiceItems = [
      { name: 'MJ 유통 전용', icon: '🖨️', description: 'MJ유통 전용 서비스' },
      { name: 'SMT', icon: '🔧', description: '표면실장 기술' },
      { name: '아트웍', icon: '🎨', description: '디자인 및 그래픽' },
      { name: '금형', icon: '⚙️', description: '금형 제작 서비스' },
      { name: '부품구매', icon: '🛒', description: '전자부품 구매' }
    ];

    // 로그인하지 않은 경우 MJ 유통 전용을 제외한 서비스만 표시
    if (!isAuthenticated) {
      return allServiceItems.filter(item => item.name !== 'MJ 유통 전용');
    }

    // Admin 사용자는 모든 서비스 표시
    if (isAdmin) {
      return allServiceItems;
    }

    // 일반 사용자의 경우 파트너스 정보에 따라 필터링
    const userPartnerNames = userPartners.map((partner: any) => partner.name);
    
    return allServiceItems.filter(item => {
      // MJ 유통 전용은 사용자가 MJ 파트너스를 가지고 있을 때만 표시
      if (item.name === 'MJ 유통 전용') {
        return userPartnerNames.includes('MJ');
      }
      // 다른 서비스들은 모두 표시
      return true;
    });
  };

  const serviceMenuItems = getServiceMenuItems();

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo-section">
          <button onClick={onGoHome} className="logo-link">
            <h1 className="logo">🚀 Labsemble</h1>
            <span className="tagline">All in ONE 임베디드 생산 개발 서비스</span>
          </button>
        </div>
        
        <nav className="nav-menu">
          <button onClick={onGoHome} className={`nav-link ${!showAdmin ? 'active' : ''}`}>홈</button>
          
          {/* 서비스 드롭다운 메뉴 */}
          <div 
            className="nav-dropdown"
            onMouseEnter={handleServiceMouseEnter}
            onMouseLeave={handleServiceMouseLeave}
          >
            <a href="#services" className="nav-link dropdown-trigger">
              서비스
              <span className="dropdown-arrow">▼</span>
            </a>
            
            {isServiceDropdownOpen && (
              <div className="dropdown-menu">
                {serviceMenuItems.map((item, index) => (
                  <a 
                    key={index} 
                    href={`#${item.name.toLowerCase()}`} 
                    className="dropdown-item"
                    onClick={(e) => {
                      if (item.name === 'MJ 유통 전용' && isAuthenticated && !isAdmin) {
                        e.preventDefault();
                        onMJRegistration();
                      }
                    }}
                  >
                    <span className="dropdown-icon">{item.icon}</span>
                    <div className="dropdown-content">
                      <span className="dropdown-title">{item.name}</span>
                      <span className="dropdown-description">{item.description}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <a href="#about" className="nav-link">소개</a>
          <a href="#contact" className="nav-link">문의</a>
        </nav>
        
        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-menu">
              {!currentUser?.is_admin ? (
                showAdmin ? (
                  <span className="user-greeting">안녕하세요, {currentUser?.username}님!</span>
                ) : (
                  <button 
                    onClick={onAdminClick} 
                    className="user-greeting-btn"
                  >
                    안녕하세요, {currentUser?.username}님!
                  </button>
                )
              ) : (
                <span className="user-greeting">안녕하세요, {currentUser?.username}님!</span>
              )}
              {isAdmin && !currentUser?.is_admin && (
                <button 
                  onClick={onAdminClick} 
                  className={`admin-btn ${showAdmin ? 'active' : ''}`}
                >
                  {showAdmin ? '홈으로' : '관리자'}
                </button>
              )}
              <button onClick={onLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="login-btn">
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 