import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Routes, Navigate } from 'react-router';
import './App.css';
import { apiService } from './services/api';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import UserDashboard from './components/UserDashboard';
import MJProjectRegistration from './components/MJProject/MJProjectRegistration';
import Modal from './components/Modal';
//test testtest


interface User {
  id: number;
  username: string;
  email: string;
  company_name?: string;
  contact_person?: string;
  phone_number?: string;
  is_admin?: boolean;
  created_at: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 인증 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 토큰 확인
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        // 저장된 사용자 정보 복원
        const user = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        // 관리자 페이지 상태 복원
        const savedAdminState = localStorage.getItem('showAdmin');
        if (savedAdminState) {
          setShowAdmin(JSON.parse(savedAdminState));
        }
        
        // 토큰 유효성 검증 (백그라운드에서)
        apiService.getCurrentUser()
          .then(response => {
            // 토큰이 유효하면 최신 사용자 정보로 업데이트
            setCurrentUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          })
                  .catch(error => {
          // 토큰이 유효하지 않으면 로그아웃
          handleLogout();
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('showAdmin');
      }
    }
  }, []);

  // 로그인 성공 처리
  const handleLoginSuccess = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowLogin(false);
    setShowAdmin(false); // 기본적으로 홈페이지 표시
    closeModal(); // 모달 닫기
  };

  // 회원가입 성공 처리
  const handleRegisterSuccess = (data: any) => {
    // 회원가입 성공 후 로그인 페이지로 이동
    setShowLogin(true);
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('showAdmin');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogin(true);
    setShowAdmin(false); // 관리자 페이지도 닫기
  };

  // 로그인/회원가입 페이지 전환
  const handleSwitchToRegister = () => setShowLogin(false);
  const handleSwitchToLogin = () => setShowLogin(true);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 모달 열기/닫기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
    // 관리자 페이지 상태
  const [showAdmin, setShowAdmin] = useState(false);
  
  // MJ 프로젝트 등록 페이지 상태
  const [showMJRegistration, setShowMJRegistration] = useState(false);
  
  // 사용자 파트너스 정보 상태
  const [userPartners, setUserPartners] = useState([]);
  
  // 사용자 파트너스 정보 로드
  useEffect(() => {
    if (isAuthenticated && currentUser && !currentUser.is_admin) {
      loadUserPartners();
    }
  }, [isAuthenticated, currentUser]);
  
  const loadUserPartners = async () => {
    try {
      const response = await apiService.getUserPartners(currentUser.id);
      setUserPartners(response.data.partners || []);
    } catch (err) {
      console.error('파트너스 로드 오류:', err);
      setUserPartners([]);
    }
  };
  
  // 대시보드로 이동하는 함수 (홈페이지에서만 작동)
  const handleAdminToggle = () => {
    // 홈페이지에 있을 때만 대시보드로 이동
    if (!showAdmin) {
      setShowAdmin(true);
      localStorage.setItem('showAdmin', JSON.stringify(true));
    }
  };

  // 홈페이지로 이동하는 함수
  const handleGoHome = () => {
    setShowAdmin(false);
    setShowMJRegistration(false);
    localStorage.removeItem('showAdmin');
  };

  // MJ 프로젝트 등록 페이지 열기
  const handleOpenMJRegistration = () => {
    setShowMJRegistration(true);
  };

  // MJ 프로젝트 등록 페이지 닫기
  const handleCloseMJRegistration = () => {
    setShowMJRegistration(false);
  };

  // 메인 콘텐츠 렌더링 함수
  const renderMainContent = () => {
    if (!isAuthenticated) {
      return <HomePage />;
    }

    // 관리자 권한 사용자는 바로 관리자 페이지로 이동
    if (currentUser?.is_admin) {
      return <AdminPage currentUser={currentUser} />;
    }

    // MJ 프로젝트 등록 페이지가 열려있으면 해당 페이지 표시
    if (showMJRegistration) {
      return <MJProjectRegistration currentUser={currentUser} onBack={handleCloseMJRegistration} />;
    }

    // 로그인한 일반 사용자는 홈페이지 또는 대시보드 표시
    // showAdmin이 true이면 대시보드, false이면 홈페이지
    if (showAdmin) {
      return <UserDashboard 
        currentUser={currentUser} 
        onOpenMJRegistration={handleOpenMJRegistration}
      />;
    } else {
      return <HomePage />;
    }
  };

  return (
    <Router>
      <div className="App">
        {/* 헤더는 항상 표시 */}
        <Header 
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          userPartners={userPartners}
          onLoginClick={openModal}
          onLogout={handleLogout}
          onAdminClick={handleAdminToggle}
          onGoHome={handleGoHome}
          onMJRegistration={handleOpenMJRegistration}
          showAdmin={showAdmin}
          isAdmin={currentUser?.is_admin || false}
        />
        
        {/* 라우트 설정 */}
        <Routes>
          {/* 기본 페이지들 */}
          <Route 
            path="*" 
            element={
              <div>
                {/* 메인 콘텐츠 - 로그인 상태에 따라 다르게 표시 */}
                {renderMainContent()}
                
                {/* 로그인/회원가입 모달 */}
                <Modal isOpen={isModalOpen && !isAuthenticated} onClose={closeModal}>
                  {showLogin ? (
                    <Login 
                      onLoginSuccess={handleLoginSuccess}
                      onSwitchToRegister={handleSwitchToRegister}
                    />
                  ) : (
                    <Register 
                      onRegisterSuccess={handleRegisterSuccess}
                      onSwitchToLogin={handleSwitchToLogin}
                    />
                  )}
                </Modal>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
