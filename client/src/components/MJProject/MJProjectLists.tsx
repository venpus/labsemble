import React, { useState, useMemo } from 'react';
import MJProjectSearch, { SearchFilters } from './MJProjectSearch';
import MJProjectDetail from './MJProjectDetail';
import './MJProjectLists.css';

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

interface MJProjectListsProps {
  mjProjects: MJProject[];
  isAdmin?: boolean;
  showDetail?: boolean;
  setShowDetail?: (show: boolean) => void;
}



const MJProjectLists: React.FC<MJProjectListsProps> = ({ mjProjects, isAdmin = false, showDetail: externalShowDetail, setShowDetail: externalSetShowDetail }) => {
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({
    user: '',
    company: '',
    date: '',
    projectCode: '',
    productName: '',
    status: '',
    paymentStatus: '',
    deliveryStatus: ''
  });
  
  const [selectedProject, setSelectedProject] = useState<MJProject | null>(null);
  const [internalShowDetail, setInternalShowDetail] = useState(false);
  
  // 외부에서 전달받은 showDetail 상태를 우선 사용
  const showDetail = externalShowDetail !== undefined ? externalShowDetail : internalShowDetail;
  const setShowDetail = externalSetShowDetail || setInternalShowDetail;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getImageUrl = (imagePath: string) => {
    console.log('이미지 경로 처리:', { originalPath: imagePath });
    
    // 이미지 경로가 이미 전체 URL인 경우
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('전체 URL 사용:', imagePath);
      return imagePath;
    }
    
    // 이미지 경로가 상대 경로인 경우
    if (imagePath.startsWith('/')) {
      const fullUrl = `http://localhost:5001${imagePath}`;
      console.log('상대 경로 변환:', fullUrl);
      return fullUrl;
    }
    
    // 이미지 경로가 파일명만 있는 경우
    const fullUrl = `http://localhost:5001/uploads/mj-projects/${imagePath}`;
    console.log('파일명 기반 URL 생성:', fullUrl);
    return fullUrl;
  };



  // 검색 필터링된 프로젝트 목록
  const filteredProjects = useMemo(() => {
    return mjProjects.filter(project => {
      // 사용자: 포함 검색 (대소문자 구분 없음)
      const userMatch = !appliedFilters.user || 
        (project.username && project.username.toLowerCase().includes(appliedFilters.user.toLowerCase()));
      
      // 회사명: 포함 검색 (대소문자 구분 없음)
      const companyMatch = !appliedFilters.company || 
        (project.company_name && project.company_name.toLowerCase().includes(appliedFilters.company.toLowerCase()));
      
      // 등록일: 완전 일치 검색
      const dateMatch = !appliedFilters.date || 
        (() => {
          if (!appliedFilters.date) return true;
          const projectDate = new Date(project.created_at);
          const searchDate = new Date(appliedFilters.date);
          return projectDate.toDateString() === searchDate.toDateString();
        })();
      
      // 프로젝트 코드: 완전 일치 검색 (대소문자 구분 없음)
      const projectCodeMatch = !appliedFilters.projectCode || 
        (project.project_code && project.project_code.toLowerCase() === appliedFilters.projectCode.toLowerCase());
      
      // 상품명: 포함 검색 (대소문자 구분 없음)
      const productNameMatch = !appliedFilters.productName || 
        project.product_name.toLowerCase().includes(appliedFilters.productName.toLowerCase());

      // 프로젝트 상태: 완전 일치 검색
      const statusMatch = !appliedFilters.status || 
        project.status === appliedFilters.status;

      // 결제 상태: 완전 일치 검색
      const paymentStatusMatch = !appliedFilters.paymentStatus || 
        project.payment_status === appliedFilters.paymentStatus;

      // 배송 상태: 완전 일치 검색
      const deliveryStatusMatch = !appliedFilters.deliveryStatus || 
        project.delivery_status === appliedFilters.deliveryStatus;
      
      return userMatch && companyMatch && dateMatch && projectCodeMatch && productNameMatch && 
             statusMatch && paymentStatusMatch && deliveryStatusMatch;
    });
  }, [mjProjects, appliedFilters]);

  const handleSearch = (filters: any) => {
    setAppliedFilters(filters);
  };

  const handleClearSearch = () => {
    setAppliedFilters({
      user: '',
      company: '',
      date: '',
      projectCode: '',
      productName: '',
      status: '',
      paymentStatus: '',
      deliveryStatus: ''
    });
  };



  const handleViewProject = (project: MJProject) => {
    setSelectedProject(project);
    setShowDetail(true);
  };

  const handleCancelProject = async (project: MJProject) => {
    if (window.confirm(`프로젝트 "${project.product_name}"을(를) 취소하시겠습니까?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/mj-projects/${project.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: '취소' })
        });

        if (response.ok) {
          alert('프로젝트가 취소되었습니다.');
          // 프로젝트 목록을 새로고침
          window.location.reload();
        } else {
          alert('프로젝트 취소에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 취소 오류:', error);
        alert('프로젝트 취소 중 오류가 발생했습니다.');
      }
    }
  };

  // 상세보기 닫기
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedProject(null);
  };

  // 프로젝트 수정 (미구현)
  const handleEditProject = (project: MJProject) => {
    alert('프로젝트 수정 기능은 추후 구현 예정입니다.');
  };

  // 프로젝트 삭제 (미구현)
  const handleDeleteProject = (projectId: number) => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      alert('프로젝트 삭제 기능은 추후 구현 예정입니다.');
    }
  };

  return (
    <>
      {/* 상세보기 화면 */}
      {showDetail && selectedProject ? (
        <div className="detail-view-container">
          <div className="detail-view">
            <div className="detail-header">
              <button 
                className="back-btn"
                onClick={handleCloseDetail}
              >
                목록으로 돌아가기
              </button>
              <h2 className="detail-title">프로젝트 상세보기</h2>
            </div>
            
            <MJProjectDetail
              project={selectedProject}
              onClose={handleCloseDetail}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          </div>
        </div>
      ) : (
        <div className="mj-projects-container">
          {/* 검색 필터 섹션 */}
          <MJProjectSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            totalCount={mjProjects.length}
            filteredCount={filteredProjects.length}
            isAdmin={isAdmin}
          />

          <div className="projects-table">
            <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>번호</th>
                <th style={{ textAlign: 'center' }}>사용자</th>
                <th style={{ textAlign: 'center' }}>프로젝트 코드</th>
                <th style={{ textAlign: 'center' }}>등록일</th>
                <th style={{ textAlign: 'center' }}>사진</th>
                <th style={{ textAlign: 'center' }}>상품명</th>
                <th style={{ textAlign: 'center' }}>수량</th>
                <th style={{ textAlign: 'center' }}>견적가</th>
                <th style={{ textAlign: 'center' }}>상태</th>
                <th style={{ textAlign: 'center' }}>결제</th>
                <th style={{ textAlign: 'center' }}>배송</th>
                <th style={{ textAlign: 'center' }}>계산서</th>
                <th style={{ textAlign: 'center' }}>상세보기</th>
                <th style={{ textAlign: 'center' }}>취소</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={14} className="no-data" style={{ color: 'white', textAlign: 'center' }}>
                    {appliedFilters.user || appliedFilters.company || appliedFilters.date || appliedFilters.projectCode || appliedFilters.productName || 
                     appliedFilters.status || appliedFilters.paymentStatus || appliedFilters.deliveryStatus
                      ? '검색 조건에 맞는 프로젝트가 없습니다.'
                      : '등록된 MJ 프로젝트가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project, index) => (
                  <tr key={project.id}>
                    <td style={{ color: 'white', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ color: 'white', textAlign: 'center' }}>
                      <div>
                        <div>{project.username || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                          {project.company_name || '-'}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'white', textAlign: 'center' }}>{project.project_code || `MJ-${project.id.toString().padStart(6, '0')}`}</td>
                    <td style={{ color: 'white', textAlign: 'center' }}>{formatDate(project.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(() => {
                        // image_paths 파싱 (JSON 문자열일 수 있음)
                        let imagePaths = project.image_paths;
                        if (typeof imagePaths === 'string') {
                          try {
                            imagePaths = JSON.parse(imagePaths);
                          } catch (e) {
                            console.error('이미지 경로 파싱 실패:', e);
                            imagePaths = [];
                          }
                        }
                        
                        if (imagePaths && imagePaths.length > 0) {
                          return (
                            <div className="project-images">
                              <img 
                                src={getImageUrl(imagePaths[0])}
                                alt="프로젝트 이미지"
                                className="project-thumbnail"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                                onLoad={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'block';
                                  target.nextElementSibling?.classList.add('hidden');
                                }}
                              />
                              <span className="image-error hidden" style={{ color: 'white' }}>
                                이미지 로드 실패<br/>
                                <small>{getImageUrl(imagePaths[0])}</small>
                              </span>
                            </div>
                          );
                        } else {
                          return <span className="no-image" style={{ color: 'white' }}>-</span>;
                        }
                      })()}
                    </td>
                    <td style={{ color: 'white', textAlign: 'center' }}>{project.product_name}</td>
                    <td style={{ color: 'white', textAlign: 'center' }}>{project.quantity?.toLocaleString()}</td>
                    <td style={{ color: 'white', textAlign: 'center' }}>{project.price ? `¥${project.price.toLocaleString()}` : '-'}</td>
                    <td style={{ color: 'white', textAlign: 'center' }}>
                      {(() => {
                        const status = project.status;
                        // 상태 값에 따른 표시 텍스트
                        const statusDisplay: { [key: string]: string } = {
                          '요청접수': '요청접수',
                          '검토중': '검토중',
                          '승인됨': '승인됨',
                          '처리중': '처리중',
                          '완료': '완료',
                          'pending': '대기중',
                          'processing': '처리중',
                          'completed': '완료'
                        };
                        
                        const displayText = statusDisplay[status] || status || '-';
                        return displayText;
                      })()}
                    </td>
                    <td style={{ color: 'white', textAlign: 'center' }}>
                      {project.payment_status === 'completed' ? '완료' : 
                       project.payment_status === 'failed' ? '실패' : 
                       project.payment_status === 'pending' ? '대기중' : '-'}
                    </td>
                    <td style={{ color: 'white', textAlign: 'center' }}>
                      {project.delivery_status === 'delivered' ? '배송완료' :
                       project.delivery_status === 'processing' ? '처리중' :
                       project.delivery_status === 'completed' ? '완료' : 
                       project.delivery_status === 'waiting' ? '대기중' : '-'}
                    </td>
                    <td style={{ color: 'white', textAlign: 'center' }}>
                      {project.invoice_status === 'issued' ? '발행완료' : '미발행'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="detail-btn"
                        onClick={() => handleViewProject(project)}
                        style={{ 
                          color: 'white', 
                          background: '#3b82f6', 
                          border: 'none', 
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer', 
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        상세보기
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelProject(project)}
                        style={{ 
                          color: 'white', 
                          background: '#ef4444', 
                          border: 'none', 
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer', 
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </>
  );
};

export default MJProjectLists; 