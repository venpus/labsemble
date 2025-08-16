import React, { useState } from 'react';
import './MJProjectRegistration.css';

interface MJProjectRegistrationProps {
  currentUser: any;
  onBack: () => void;
}

const MJProjectRegistration: React.FC<MJProjectRegistrationProps> = ({ currentUser, onBack }) => {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    productImages: [] as File[],
    referenceLink: '',
    purchaseLink: '',
    expectedShippingDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 파일 개수 제한 (최대 5개)
    if (formData.productImages.length + files.length > 5) {
      setError('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }
    
    // 파일 크기 검증 (각 파일 최대 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`다음 파일들이 10MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      productImages: [...prev.productImages, ...files]
    }));
    setError(''); // 에러 메시지 초기화
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('productName', formData.productName);
      formDataToSend.append('quantity', formData.quantity);
      if (formData.expectedShippingDate) {
        formDataToSend.append('expectedShippingDate', formData.expectedShippingDate);
      }
      if (formData.purchaseLink) {
        formDataToSend.append('purchaseLink', formData.purchaseLink);
      }
      formData.productImages.forEach((image) => {
        formDataToSend.append('productImages', image);
      });
      if (formData.referenceLink) {
        formDataToSend.append('referenceLink', formData.referenceLink);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/mj-projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프로젝트 등록에 실패했습니다.');
      }

      const result = await response.json();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message || '프로젝트 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <div className="mj-project-registration">
      <div className="registration-container">
        <div className="registration-header">
          <button onClick={handleBack} className="back-btn">
            ← 뒤로가기
          </button>
          <h1>🖨️ MJ 프로젝트 등록</h1>
          <p className="registration-subtitle">
            MJ유통 전용 서비스를 위한 프로젝트를 등록해주세요
          </p>
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={() => setError('')}>닫기</button>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>✅ 프로젝트가 성공적으로 등록되었습니다!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h2>📋 프로젝트 정보</h2>
            
            <div className="form-group">
              <label htmlFor="productName" className="form-label">
                구매상품명 *
              </label>
              <input
                type="text"
                id="productName"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="form-input"
                placeholder="구매하실 상품명을 입력해주세요"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity" className="form-label">
                수량 *
              </label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="form-input"
                placeholder="구매 수량을 입력해주세요"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedShippingDate" className="form-label">
                출고 예정일
              </label>
              <input
                type="date"
                id="expectedShippingDate"
                value={formData.expectedShippingDate}
                onChange={(e) => handleInputChange('expectedShippingDate', e.target.value)}
                className="form-input"
                placeholder="출고 예정일을 선택해주세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="referenceLink" className="form-label">
                참고 링크
              </label>
              <input
                type="url"
                id="referenceLink"
                value={formData.referenceLink}
                onChange={(e) => handleInputChange('referenceLink', e.target.value)}
                className="form-input"
                placeholder="상품 참고 링크를 입력해주세요 (선택사항)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="purchaseLink" className="form-label">
                구매 링크
              </label>
              <input
                type="url"
                id="purchaseLink"
                value={formData.purchaseLink}
                onChange={(e) => handleInputChange('purchaseLink', e.target.value)}
                className="form-input"
                placeholder="상품 구매 링크를 입력해주세요 (선택사항)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                상품 이미지 (여러 개 선택 가능)
              </label>
              
              {/* 이미지 업로드 버튼 */}
              <div className="image-upload-section">
                <input
                  type="file"
                  id="productImages"
                  onChange={handleImageChange}
                  className="file-input"
                  accept="image/*"
                  multiple
                />
                <label htmlFor="productImages" className="upload-btn">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">이미지 업로드</span>
                </label>
              </div>
              
              {/* 이미지 목록 */}
              {formData.productImages.length > 0 && (
                <div className="image-list-container">
                  <h4 className="image-list-title">업로드된 이미지 ({formData.productImages.length}/5)</h4>
                  <div className="image-grid">
                    {formData.productImages.map((file, index) => (
                      <div key={index} className="image-item">
                        <div className="image-preview-container">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="image-preview"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="remove-image-btn"
                            title="이미지 삭제"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="image-info">
                          <span className="image-name">{file.name}</span>
                          <span className="image-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="form-hint">
                지원 형식: JPG, PNG, GIF, BMP (최대 10MB, 최대 5개)
              </p>
            </div>
          </div>

          <div className="form-section">
            <h2>👤 등록자 정보</h2>
            <div className="user-info">
              <div className="info-row">
                <span className="info-label">등록자:</span>
                <span className="info-value">{currentUser.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">회사:</span>
                <span className="info-value">{currentUser.company_name || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">이메일:</span>
                <span className="info-value">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleBack}
              className="cancel-btn"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !formData.productName || !formData.quantity}
            >
              {loading ? '등록 중...' : '프로젝트 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MJProjectRegistration; 