import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import Sidebar from './Sidebar';
import WorkStatusManagement from './WorkStatusManagement';
import MJProjectManagement from './MJProject/MJProjectManagement';
import './AdminPage.css';

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



interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPartners: number;
  totalProjects: number;
  systemStatus: string;
}

interface AdminPageProps {
  currentUser: any;
}

const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<VipPartner[]>([]);
  const [userPartners, setUserPartners] = useState<{ [userId: number]: UserPartner[] }>({});

  const [smtProjects, setSmtProjects] = useState<any[]>([]);
  const [artworkProjects, setArtworkProjects] = useState<any[]>([]);
  const [moldProjects, setMoldProjects] = useState<any[]>([]);
  const [partsProjects, setPartsProjects] = useState<any[]>([]);
  const [mjProjects, setMjProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPartners: 0,
    totalProjects: 0,
    systemStatus: '정상'
  });

  const [error, setError] = useState('');
  
  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'username' | 'companyName' | 'partnerName'>('username');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, partnersRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getVipPartners()
      ]);

      const users = usersRes.data.users || [];
      const partners = partnersRes.data.partners || [];
      
      setUsers(users);
      setPartners(partners);

      // 모든 사용자의 파트너스 정보 로드
      const userPartnersData: { [userId: number]: UserPartner[] } = {};
      for (const user of users) {
        try {
          const userPartnersRes = await apiService.getUserPartners(user.id);
          userPartnersData[user.id] = userPartnersRes.data.partners || [];
        } catch (err) {
          userPartnersData[user.id] = [];
        }
      }
      setUserPartners(userPartnersData);

      // 모든 프로젝트 타입 로드
      await Promise.all([
        //loadSmtProjects(),
        //loadArtworkProjects(),
        //loadMoldProjects(),
        //loadPartsProjects()
        loadMjProjects()
      ]);

      // 통계 계산
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((user: User) => 
          new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        totalPartners: partners.length,
        totalProjects: smtProjects.length + artworkProjects.length + moldProjects.length + partsProjects.length,
        systemStatus: '정상'
      });
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };



  const loadSmtProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/smt-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        setSmtProjects(projects);
      }
    } catch (err) {
      setSmtProjects([]);
    }
  };

  const loadArtworkProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/artwork-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        setArtworkProjects(projects);
      }
    } catch (err) {
      setArtworkProjects([]);
    }
  };

  const loadMoldProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mold-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        setMoldProjects(projects);
      }
    } catch (err) {
      setMoldProjects([]);
    }
  };

  const loadPartsProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/parts-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        setPartsProjects(projects);
      }
    } catch (err) {
      setPartsProjects([]);
    }
  };

  const loadMjProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mj-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        setMjProjects(projects);
      }
    } catch (err) {
      setMjProjects([]);
    }
  };



  const isProjectCompleted = (project: any) => {
    const status = project.status?.toLowerCase();
    const paymentStatus = project.payment_status?.toLowerCase();
    const deliveryStatus = project.delivery_status?.toLowerCase();
    
    // 완료 상태 체크
    if (status === 'completed' || status === 'delivered' || 
        paymentStatus === 'completed' || deliveryStatus === 'delivered') {
      return true;
    }
    
    // 취소 상태 체크
    if (status === 'cancelled' || status === 'rejected' || 
        paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      return true;
    }
    
    return false;
  };

  





  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        await apiService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } catch (err) {
        setError('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleToggleAdmin = async (userId: number, currentAdminStatus: boolean) => {
    const action = currentAdminStatus ? '해제' : '부여';
    if (window.confirm(`정말로 이 사용자에게 관리자 권한을 ${action}하시겠습니까?`)) {
      try {
        await apiService.updateUserAdmin(userId, !currentAdminStatus);
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_admin: !currentAdminStatus }
            : user
        ));
      } catch (err) {
        setError('관리자 권한 수정 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeletePartner = async (partnerId: number) => {
    if (window.confirm('정말로 이 VIP 파트너스를 삭제하시겠습니까?')) {
      try {
        await apiService.deleteVipPartner(partnerId);
        setPartners(partners.filter(partner => partner.id !== partnerId));
        setStats(prev => ({ ...prev, totalPartners: prev.totalPartners - 1 }));
      } catch (err) {
        setError('VIP 파트너스 삭제 중 오류가 발생했습니다.');
      }
    }
  };



  const handleAddPartner = async () => {
    const name = prompt('새로운 파트너스 이름을 입력하세요:');
    if (name && name.trim() !== '') {
      try {
        await apiService.createVipPartner({ name: name.trim() });
        // 새로고침하여 목록 업데이트
        fetchData();
      } catch (err) {
        setError('VIP 파트너스 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditPartner = async (partnerId: number, currentName: string) => {
    const newName = prompt('새로운 파트너스 이름을 입력하세요:', currentName);
    if (newName && newName.trim() !== '') {
      try {
        await apiService.updateVipPartner(partnerId, { name: newName.trim() });
        setPartners(partners.map(partner => 
          partner.id === partnerId 
            ? { ...partner, name: newName.trim() }
            : partner
        ));
      } catch (err) {
        setError('VIP 파트너스 수정 중 오류가 발생했습니다.');
      }
    }
  };

  const handleAssignPartner = async (userId: number) => {
    if (partners.length === 0) {
      setError('할당할 수 있는 파트너스가 없습니다.');
      return;
    }

    const partnerOptions = partners.map(p => `${p.id}: ${p.name}`).join('\n');
    const selectedPartner = prompt(`할당할 파트너스를 선택하세요 (ID: 이름):\n${partnerOptions}`);
    
    if (selectedPartner) {
      const partnerId = parseInt(selectedPartner.split(':')[0]);
      if (isNaN(partnerId)) {
        setError('올바른 파트너스 ID를 입력해주세요.');
        return;
      }

      try {
        await apiService.assignPartnerToUser(userId, partnerId);
        
        // 할당된 파트너스 정보 가져오기
        const partner = partners.find(p => p.id === partnerId);
        if (partner) {
          // 즉시 UI 업데이트
          setUserPartners(prev => ({
            ...prev,
            [userId]: [...(prev[userId] || []), {
              id: partner.id,
              name: partner.name,
              assigned_at: new Date().toISOString()
            }]
          }));
        }
        
        setError(''); // 성공 메시지 표시
      } catch (err: any) {
        setError(err.response?.data?.error || '파트너스 할당 중 오류가 발생했습니다.');
      }
    }
  };

  const handleRemovePartner = async (userId: number, partnerId: number) => {
    if (window.confirm('정말로 이 파트너스를 제거하시겠습니까?')) {
      try {
        await apiService.removePartnerFromUser(userId, partnerId);
        
        // 즉시 UI 업데이트
        setUserPartners(prev => ({
          ...prev,
          [userId]: prev[userId]?.filter(partner => partner.id !== partnerId) || []
        }));
        
        setError(''); // 성공 메시지 표시
      } catch (err: any) {
        setError(err.response?.data?.error || '파트너스 제거 중 오류가 발생했습니다.');
      }
    }
  };

  const loadUserPartners = async (userId: number) => {
    try {
      const response = await apiService.getUserPartners(userId);
      setUserPartners(prev => ({
        ...prev,
        [userId]: response.data.partners || []
      }));
    } catch (err) {
      // 파트너스 로드 실패 시 무시
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 필터링된 사용자 목록 계산 (포함 조건 검색)
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) {
      return users;
    }

    const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return users.filter(user => {
      switch (filterType) {
        case 'username':
          // 사용자명은 부분 일치 검색
          const usernameLower = user.username.toLowerCase();
          return searchTerms.some(term => 
            usernameLower.includes(term)
          );
          
        case 'companyName':
          // 회사명은 부분 일치 검색
          if (!user.company_name) return false;
          const companyNameLower = user.company_name.toLowerCase();
          return searchTerms.some(term => 
            companyNameLower.includes(term)
          );
          
        case 'partnerName':
          // 파트너스 이름은 부분 일치 검색
          const userPartnerNames = userPartners[user.id]?.map(p => p.name.toLowerCase()) || [];
          return searchTerms.some(term => 
            userPartnerNames.some(name => name.includes(term))
          );
          
        default:
          return true;
      }
    });
  };

  const filteredUsers = getFilteredUsers();



  return (
    <div className="admin-page">
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="admin"
        mjProjectCount={mjProjects.filter(project => 
          project.status !== '완료' && project.status !== '취소'
        ).length}
      />

      <div className="admin-main">


        {error && (
          <div className="admin-error">
            <p>❌ {error}</p>
            <button onClick={() => setError('')}>닫기</button>
          </div>
        )}

        <div className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>총 사용자</h3>
                  <p className="stat-number">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🟢</div>
                <div className="stat-info">
                  <h3>활성 사용자</h3>
                  <p className="stat-number">{stats.activeUsers}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💎</div>
                <div className="stat-info">
                  <h3>VIP 파트너스</h3>
                  <p className="stat-number">{stats.totalPartners}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛠️</div>
                <div className="stat-info">
                  <h3>활성 프로젝트</h3>
                  <p className="stat-number">{stats.totalProjects}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚙️</div>
                <div className="stat-info">
                  <h3>시스템 상태</h3>
                  <p className="stat-status">{stats.systemStatus}</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>최근 활동</h2>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-icon">👤</span>
                  <span>새로운 사용자 가입: {users[0]?.username || '없음'}</span>
                  <span className="activity-time">{users[0] ? formatDate(users[0].created_at) : '없음'}</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">💎</span>
                  <span>새로운 VIP 파트너스: {partners[0]?.name || '없음'}</span>
                  <span className="activity-time">{partners[0] ? formatDate(partners[0].created_at) : '없음'}</span>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>사용자 관리</h2>
              <div className="header-buttons">
                <button className="refresh-btn" onClick={fetchData}>
                  🔄 새로고침
                </button>
              </div>
            </div>
            
            {/* 검색 및 필터링 UI */}
            <div className="search-filter-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder={`${filterType === 'username' ? '사용자명' : filterType === 'companyName' ? '회사명' : '파트너스 이름'} 검색...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="검색어 지우기"
                >
                  ✕
                </button>
              </div>
              
              <div className="filter-options">
                <label className="filter-label">필터 조건:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'username' | 'companyName' | 'partnerName')}
                  className="filter-select"
                >
                  <option value="username">사용자명</option>
                  <option value="companyName">회사명</option>
                  <option value="partnerName">파트너스 이름</option>
                </select>
              </div>
              
              {searchTerm && (
                <div className="search-info">
                  <span>검색 결과: {filteredUsers.length}명</span>
                </div>
              )}
            </div>
            
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>사용자명</th>
                    <th>이메일</th>
                    <th>회사명</th>
                    <th>담당자</th>
                    <th>전화번호</th>
                    <th>관리자</th>
                    <th>가입일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.company_name || '-'}</td>
                      <td>{user.contact_person || '-'}</td>
                      <td>{user.phone_number || '-'}</td>
                      <td>
                        <span className={`admin-badge ${user.is_admin ? 'admin' : 'user'}`}>
                          {user.is_admin ? '관리자' : '일반'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`admin-toggle-btn ${user.is_admin ? 'remove' : 'add'}`}
                            onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                          >
                            {user.is_admin ? '권한해제' : '권한부여'}
                          </button>
                          <button 
                            className="assign-btn"
                            onClick={() => handleAssignPartner(user.id)}
                          >
                            파트너스 할당
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            삭제
                          </button>
                        </div>
                        {/* 사용자의 파트너스 목록 */}
                        <div className="user-partners">
                          <strong>할당된 파트너스:</strong>
                          {userPartners[user.id] && userPartners[user.id].length > 0 ? (
                            userPartners[user.id].map(partner => (
                              <span key={partner.id} className="partner-tag">
                                {partner.name}
                                <button 
                                  className="remove-partner-btn"
                                  onClick={() => handleRemovePartner(user.id, partner.id)}
                                  title="파트너스 제거"
                                >
                                  ✕
                                </button>
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>할당된 파트너스 없음</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="partners-section">
            <div className="section-header">
              <h2>VIP 파트너스 관리</h2>
              <div className="header-buttons">
                <button className="add-btn" onClick={handleAddPartner}>
                  ➕ 파트너스 추가
                </button>
                <button className="refresh-btn" onClick={fetchData}>
                  🔄 새로고침
                </button>
              </div>
            </div>
            
            <div className="partners-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>파트너스 이름</th>
                    <th>등록일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(partner => (
                    <tr key={partner.id}>
                      <td>{partner.id}</td>
                      <td>{partner.name}</td>
                      <td>{formatDate(partner.created_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditPartner(partner.id, partner.name)}
                          >
                            수정
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeletePartner(partner.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mj-projects' && (
          <MJProjectManagement users={users} />
        )}

        {activeTab === 'work-status' && (
          <div className="work-status-section">
            <WorkStatusManagement currentUser={{ is_admin: true }} />
          </div>
        )}





        {activeTab === 'system' && (
          <div className="system-section">
            <h2>시스템 설정</h2>
            <div className="system-settings">
              <div className="setting-group">
                <h3>데이터베이스 상태</h3>
                <div className="status-indicator">
                  <span className="status-dot online"></span>
                  <span>연결됨</span>
                </div>
              </div>
              
              <div className="setting-group">
                <h3>서버 상태</h3>
                <div className="status-indicator">
                  <span className="status-dot online"></span>
                  <span>정상</span>
                </div>
              </div>
              
              <div className="setting-group">
                <h3>시스템 정보</h3>
                <div className="system-info">
                  <p><strong>Node.js 버전:</strong> 18.x</p>
                  <p><strong>데이터베이스:</strong> MariaDB</p>
                  <p><strong>프레임워크:</strong> Express.js</p>
                  <p><strong>프론트엔드:</strong> React + TypeScript</p>
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

export default AdminPage; 