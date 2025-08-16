import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './WorkStatusManagement.css';

interface WorkStatus {
  id: number;
  name: string;
  description?: string;
  color: string;
  order: number;
  is_active: boolean;
  status_type: string;
  created_at: string;
  updated_at: string;
}

interface WorkStatusForm {
  name: string;
  description: string;
  color: string;
  order: number;
  is_active: boolean;
  status_type: string;
}

interface WorkStatusManagementProps {
  currentUser: any;
}

// 드래그 가능한 상태 아이템 컴포넌트
const SortableStatusItem: React.FC<{
  status: WorkStatus;
  onEdit: (status: WorkStatus) => void;
  onDelete: (id: number) => void;
  onToggleActive: (status: WorkStatus) => void;
}> = ({ status, onEdit, onDelete, onToggleActive }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: status.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`status-item ${!status.is_active ? 'inactive' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="status-info">
        <div className="drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </div>
        <div className="status-color" style={{ backgroundColor: status.color }}></div>
        <div className="status-details">
          <h3 className="status-name">{status.name}</h3>
          {status.description && (
            <p className="status-description">{status.description}</p>
          )}
          <div className="status-meta">
            <span className="status-order">순서: {status.order}</span>
            <span className="status-date">
              생성일: {formatDate(status.created_at)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="status-actions">
        <button
          className={`toggle-btn ${status.is_active ? 'active' : 'inactive'}`}
          onClick={() => onToggleActive(status)}
          title={status.is_active ? '비활성화' : '활성화'}
        >
          {status.is_active ? '🟢' : '🔴'}
        </button>
        <button
          className="edit-btn"
          onClick={() => onEdit(status)}
          title="수정"
        >
          ✏️
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(status.id)}
          title="삭제"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

const WorkStatusManagement: React.FC<WorkStatusManagementProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('smt');
  const [activeStatusType, setActiveStatusType] = useState('work');
  const [workStatuses, setWorkStatuses] = useState<{ [key: string]: { [statusType: string]: WorkStatus[] } }>({
    smt: { work: [], payment: [], delivery: [] },
    artwork: { work: [], payment: [], delivery: [] },
    mold: { work: [], payment: [], delivery: [] },
    parts: { work: [], payment: [], delivery: [] },
    mj: { work: [], payment: [], delivery: [] }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 중복 제거 상태
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 드래그 시작 거리를 줄여서 더 민감하게 반응
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkStatus | null>(null);
  const [formData, setFormData] = useState<WorkStatusForm>({
    name: '',
    description: '',
    color: '#3B82F6',
    order: 1,
    is_active: true,
    status_type: 'work'
  });

  const tabs = [
    { id: 'smt', name: 'SMT', icon: '🔌' },
    { id: 'artwork', name: '아트웍', icon: '🎨' },
    { id: 'mold', name: '금형', icon: '⚙️' },
    { id: 'parts', name: '부품구매', icon: '📦' },
    { id: 'mj', name: 'MJ 서비스', icon: '🤖' }
  ];

  useEffect(() => {
    loadWorkStatuses();
  }, []);

  const loadWorkStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const newWorkStatuses: { [key: string]: { [statusType: string]: WorkStatus[] } } = {
        smt: { work: [], payment: [], delivery: [] },
        artwork: { work: [], payment: [], delivery: [] },
        mold: { work: [], payment: [], delivery: [] },
        parts: { work: [], payment: [], delivery: [] },
        mj: { work: [], payment: [], delivery: [] }
      };
      
      // 각 탭과 상태타입별로 작업상태 로드
      for (const tab of tabs) {
        for (const statusType of ['work', 'payment', 'delivery']) {
          try {
            const response = await apiService.getWorkStatuses(tab.id, statusType);
            newWorkStatuses[tab.id][statusType] = response?.data?.statuses || [];
          } catch (err) {
            console.error(`${tab.name} ${statusType} 상태 로드 실패:`, err);
            newWorkStatuses[tab.id][statusType] = [];
          }
        }
      }
      
      setWorkStatuses(newWorkStatuses);
    } catch (err: any) {
      setError(err.response?.data?.error || '작업상태를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 중복 확인 함수
  const handleCheckDuplicates = async () => {
    try {
      setCheckingDuplicates(true);
      setError('');
      setSuccess('');

      const response = await apiService.checkDuplicateWorkStatuses();
      
      if (response.data.success) {
        setDuplicateCheck(response.data);
        if (response.data.hasDuplicates) {
          setError(`중복 데이터 발견: ${response.data.duplicateCount}개의 중복 항목이 있습니다.`);
        } else {
          setSuccess('중복 데이터가 없습니다.');
        }
      } else {
        setError('중복 확인에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '중복 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // 중복 제거 함수
  const handleRemoveDuplicates = async () => {
    if (!window.confirm('중복된 작업상태를 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setRemovingDuplicates(true);
      setError('');
      setSuccess('');

      const response = await apiService.removeDuplicateWorkStatuses();
      
      if (response.data.success) {
        setSuccess(`중복 제거 완료: ${response.data.removedCount}개 항목이 제거되었습니다.`);
        setDuplicateInfo(response.data);
        setDuplicateCheck(null); // 중복 확인 정보 초기화
        
        // 상태 목록 새로고침
        await loadWorkStatuses();
      } else {
        setError('중복 제거에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '중복 제거 중 오류가 발생했습니다.');
    } finally {
      setRemovingDuplicates(false);
    }
  };

  // 중복 제거 결과 표시
  const renderDuplicateInfo = () => {
    if (!duplicateInfo) return null;

    return (
      <div className="duplicate-info">
        <h4>중복 제거 결과</h4>
        <p>총 {duplicateInfo.removedCount}개의 중복 항목이 제거되었습니다.</p>
        {duplicateInfo.removedDuplicates && duplicateInfo.removedDuplicates.length > 0 && (
          <div className="removed-items">
            <h5>제거된 항목들:</h5>
            <ul>
              {duplicateInfo.removedDuplicates.map((item: any, index: number) => (
                <li key={index}>
                  {item.category} - {item.status_type}: "{item.name}" 
                  (ID: {item.removed_id} 제거, ID: {item.kept_id} 유지)
                </li>
              ))}
            </ul>
          </div>
        )}
        <button 
          className="close-info-btn"
          onClick={() => setDuplicateInfo(null)}
        >
          닫기
        </button>
      </div>
    );
  };

  // 중복 확인 결과 표시
  const renderDuplicateCheck = () => {
    if (!duplicateCheck) return null;

    return (
      <div className="duplicate-check">
        <h4>중복 데이터 확인 결과</h4>
        {duplicateCheck.hasDuplicates ? (
          <div>
            <p className="duplicate-warning">
              ⚠️ 총 {duplicateCheck.duplicateCount}개의 중복 항목이 발견되었습니다.
            </p>
            {duplicateCheck.duplicates.map((category: any, index: number) => (
              <div key={index} className="category-duplicates">
                <h5>{category.category} - {category.status_type}</h5>
                <ul>
                  {category.duplicates.map((duplicate: any, dupIndex: number) => (
                    <li key={dupIndex}>
                      "{duplicate.name}": {duplicate.count}개 중복
                      (ID: {duplicate.ids})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-duplicates">✅ 중복 데이터가 없습니다.</p>
        )}
        <button 
          className="close-info-btn"
          onClick={() => setDuplicateCheck(null)}
        >
          닫기
        </button>
      </div>
    );
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentStatuses = [...workStatuses[activeTab][activeStatusType]];
      const oldIndex = currentStatuses.findIndex(
        (status) => status.id === active.id
      );
      const newIndex = currentStatuses.findIndex(
        (status) => status.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // 새로운 순서로 배열 재정렬
        const newStatuses = arrayMove(currentStatuses, oldIndex, newIndex);
        
        // 모든 아이템의 순서를 업데이트
        const updatedStatuses = newStatuses.map((status, index) => ({
          ...status,
          order: index + 1
        }));

        // UI 즉시 업데이트
        setWorkStatuses(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            [activeStatusType]: updatedStatuses
          }
        }));



        // 서버에 모든 순서 변경 요청 (배치 처리)
        try {
          const updatePromises = updatedStatuses.map(status => 
            apiService.updateWorkStatus(status.id, {
              order: status.order
            })
          );
          
          await Promise.all(updatePromises);

        } catch (err) {
          console.error('순서 변경 실패:', err);
          // 실패 시 원래 상태로 복원
          await loadWorkStatuses();
          setError('순서 변경에 실패했습니다. 원래 상태로 복원되었습니다.');
        }
      }
    }
  };

  const openCreateModal = () => {
    setEditingStatus(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      order: workStatuses[activeTab][activeStatusType].length + 1,
      is_active: true,
      status_type: activeStatusType
    });
    setShowModal(true);
  };

  const openEditModal = (status: WorkStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description || '',
      color: status.color,
      order: status.order,
      is_active: status.is_active,
      status_type: status.status_type
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStatus(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      order: 1,
      is_active: true,
      status_type: 'work'
    });
  };

  const handleInputChange = (field: keyof WorkStatusForm, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('상태명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (editingStatus) {
        // 수정
        await apiService.updateWorkStatus(editingStatus.id, {
          ...formData,
          category: activeTab
        });
      } else {
        // 생성
        await apiService.createWorkStatus({
          ...formData,
          category: activeTab
        });
      }
      
      closeModal();
      await loadWorkStatuses();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || '작업상태 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (statusId: number) => {
    if (!window.confirm('정말로 이 작업상태를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await apiService.deleteWorkStatus(statusId);
      await loadWorkStatuses();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || '작업상태 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (status: WorkStatus) => {
    setLoading(true);
    try {
      await apiService.updateWorkStatus(status.id, {
        ...status,
        is_active: !status.is_active
      });
      await loadWorkStatuses();
    } catch (err: any) {
      setError('상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모든 작업상태 순서 정리
  const handleReorderAll = async () => {
    if (!window.confirm('모든 작업상태의 순서를 정리하시겠습니까?\n\n이 작업은 각 카테고리와 상태타입별로 생성일 순서대로 순서를 재정렬합니다.')) {
      return;
    }

    setLoading(true);
    try {
      await apiService.reorderAllWorkStatuses();
      setError(''); // 성공 메시지 표시
      await loadWorkStatuses(); // 데이터 새로고침
      alert('모든 작업상태 순서가 성공적으로 정리되었습니다!');
    } catch (err: any) {
      console.error('순서 정리 실패:', err);
      setError('순서 정리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !workStatuses[activeTab].length) {
    return (
      <div className="work-status-loading">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="work-status-management">
      <div className="work-status-header">
        <h1>🔄 작업상태 관리</h1>
        <p>각 서비스별 작업상태를 생성, 수정, 삭제할 수 있습니다.</p>
      </div>

      {error && (
        <div className="work-status-error">
          <p>❌ {error}</p>
          <button onClick={() => setError('')}>닫기</button>
        </div>
      )}

      {success && (
        <div className="work-status-success">
          <p>✅ {success}</p>
          <button onClick={() => setSuccess('')}>닫기</button>
        </div>
      )}

      {renderDuplicateInfo()}
      {renderDuplicateCheck()}

      <div className="work-status-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="status-type-tabs">
        <button
          className={`status-type-tab ${activeStatusType === 'work' ? 'active' : ''}`}
          onClick={() => setActiveStatusType('work')}
        >
          🔧 작업상태
        </button>
        <button
          className={`status-type-tab ${activeStatusType === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveStatusType('payment')}
        >
          💳 결제상태
        </button>
        <button
          className={`status-type-tab ${activeStatusType === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveStatusType('delivery')}
        >
          📦 배송상태
        </button>
      </div>

      <div className="work-status-content">
        <div className="content-header">
          <h2>{tabs.find(tab => tab.id === activeTab)?.name} {activeStatusType === 'work' ? '작업' : activeStatusType === 'payment' ? '결제' : '배송'}상태</h2>
          <div className="header-buttons">
            <button className="reorder-btn" onClick={handleReorderAll} disabled={loading}>
              🔄 순서 정리
            </button>
            <button className="create-btn" onClick={openCreateModal}>
              ➕ 새 상태 추가
            </button>
            <button 
              className="remove-duplicates-btn" 
              onClick={handleRemoveDuplicates} 
              disabled={removingDuplicates}
            >
              {removingDuplicates ? '중복 제거 중...' : '중복 제거'}
            </button>
            <button 
              className="check-duplicates-btn" 
              onClick={handleCheckDuplicates} 
              disabled={checkingDuplicates}
            >
              {checkingDuplicates ? '중복 확인 중...' : '중복 확인'}
            </button>
          </div>
        </div>

        <div className="status-list">
          {workStatuses[activeTab][activeStatusType].length === 0 ? (
            <div className="no-status">
              <p>등록된 {activeStatusType === 'work' ? '작업' : activeStatusType === 'payment' ? '결제' : '배송'}상태가 없습니다.</p>
              <p>새로운 상태를 추가해보세요.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={workStatuses[activeTab][activeStatusType].map(status => status.id)}
                strategy={verticalListSortingStrategy}
              >
                {workStatuses[activeTab][activeStatusType]
                  .sort((a, b) => a.order - b.order)
                  .map(status => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStatus ? '작업상태 수정' : '새 작업상태 추가'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>상태명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="상태명을 입력하세요"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="상태에 대한 설명을 입력하세요"
                  className="form-textarea"
                  rows={3}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>색상</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="form-color"
                  />
                </div>
                
                <div className="form-group">
                  <label>순서</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                    min="1"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>상태 타입</label>
                <select
                  value={formData.status_type}
                  onChange={(e) => handleInputChange('status_type', e.target.value)}
                  className="form-select"
                  disabled={!!editingStatus} // 수정 시에는 상태 타입 변경 불가
                >
                  <option value="work">🔧 작업상태</option>
                  <option value="payment">💳 결제상태</option>
                  <option value="delivery">📦 배송상태</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="form-checkbox"
                  />
                  활성 상태
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                취소
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
              >
                {loading ? '저장 중...' : (editingStatus ? '수정' : '추가')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkStatusManagement; 