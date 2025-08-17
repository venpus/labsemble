import React, { useState, useEffect } from 'react';
import MJProjectLists from './MJProjectLists';
import './MJProjectManagement.css';

interface MJProject {
  id: number;
  user_id: number;
  product_name: string;
  quantity: number;
  reference_link?: string;
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

interface MJProjectManagementProps {
  users: Array<{
    id: number;
    username: string;
    email: string;
    company_name?: string;
    contact_person?: string;
    phone_number?: string;
    is_admin?: boolean;
    created_at: string;
  }>;
  currentUser?: {
    id: number;
    username: string;
    email: string;
    is_admin?: boolean;
  };
}

const MJProjectManagement: React.FC<MJProjectManagementProps> = ({ users, currentUser }) => {
  const [mjProjects, setMjProjects] = useState<MJProject[]>([]);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadMJProjects();
  }, [users]);

  const loadMJProjects = async () => {
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
        
        // 사용자 정보와 함께 프로젝트 정보 로드
        const projectsWithUserInfo = projects.map((project: MJProject) => {
          const user = users.find(u => u.id === project.user_id);
          return {
            ...project,
            username: user?.username || '알 수 없음',
            company_name: user?.company_name || '-',
            email: user?.email || '-'
          };
        });
        
        setMjProjects(projectsWithUserInfo);
      }
    } catch (err) {
      setMjProjects([]);
    }
  };

  // 상세보기 기능은 MJProjectLists 컴포넌트에서 처리됩니다.

  const handleEditProject = async (projectId: number, currentStatus: string) => {
    const newStatus = prompt(`프로젝트 상태를 변경하세요 (요청접수/검토중/승인됨/처리중/완료):`, currentStatus);
    if (!newStatus || !['요청접수', '검토중', '승인됨', '처리중', '완료'].includes(newStatus)) {
      alert('유효하지 않은 상태입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/mj-projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }

      alert('프로젝트 상태가 변경되었습니다.');
      await loadMJProjects(); // 프로젝트 목록 새로고침
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
    }
  };



  return (
    <div className="mj-projects-section">
      {/* 상세보기 화면일 때는 헤더를 숨김 */}
      {!showDetail && (
        <>
          <div className="section-header">
            <h2>MJ 프로젝트 관리</h2>
            <div className="header-buttons">
              <button className="refresh-btn" onClick={loadMJProjects}>
                🔄 새로고침
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={() => setError('')}>닫기</button>
            </div>
          )}
        </>
      )}
      
      <MJProjectLists 
        mjProjects={mjProjects} 
        isAdmin={users.some(user => user.is_admin)}
        showDetail={showDetail}
        setShowDetail={setShowDetail}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MJProjectManagement; 