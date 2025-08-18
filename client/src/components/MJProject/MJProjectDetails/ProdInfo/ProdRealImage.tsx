import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../../../services/api';
import './ProdRealImage.css';

interface MediaPreviewModalProps {
  isOpen: boolean;
  mediaFile: MediaFile | null;
  onClose: () => void;
}

interface ProdRealImageProps {
  projectId: number;
  projectCode?: string;
  currentImages?: string[];
  onImagesUpdate?: (newImages: string[]) => void;
  isEditable?: boolean;
}

interface MediaFile {
  id?: number;
  filename: string;
  type: 'image' | 'video';
  url: string;
  file_size?: number;
  upload_date?: string;
}

const ProdRealImage: React.FC<ProdRealImageProps> = ({ 
  projectId, 
  projectCode,
  currentImages = [], 
  onImagesUpdate,
  isEditable = false 
}) => {
  // currentImages가 배열인지 확인하고 안전하게 처리
  const safeCurrentImages = Array.isArray(currentImages) ? currentImages : [];
  
  // 디버깅을 위한 로그
  console.log('ProdRealImage props:', { projectId, currentImages, safeCurrentImages, isEditable });
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; mediaFile: MediaFile | null }>({
    isOpen: false,
    mediaFile: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

    // 컴포넌트 마운트 시 프로젝트 이미지 로드
  useEffect(() => {
    loadProjectImages();
  }, [projectId]);

  // 프로젝트 이미지 로드 함수
  const loadProjectImages = async () => {
    try {
      const response = await apiService.getProjectImages(projectId);
      if (response.data.success) {
        const images = response.data.images.map((img: any) => ({
          id: img.id,
          filename: img.filename,
          type: img.file_type as 'image' | 'video',
          url: img.file_url,
          file_size: img.file_size,
          upload_date: img.upload_date
        }));
        setMediaFiles(images);
        console.log('프로젝트 이미지 로드됨:', images);
      }
    } catch (error) {
      console.error('프로젝트 이미지 로드 실패:', error);
      // 기존 방식으로 fallback
      if (Array.isArray(currentImages) && currentImages.length > 0) {
        const files = currentImages.map(filename => {
          const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(filename);
          const url = projectCode 
            ? `http://localhost:5001/uploads/ProRealImage/${projectCode}/${filename}`
            : `http://localhost:5001/uploads/ProRealImage/${filename}`;
          return {
            filename,
            type: isVideo ? 'video' as const : 'image' as const,
            url
          };
        });
        setMediaFiles(files);
      }
    }
  };

  // mediaFiles 상태 변화 추적
  useEffect(() => {
    console.log('ProdRealImage - mediaFiles 상태 변경됨:', mediaFiles);
  }, [mediaFiles]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('productImages', file);
      });

      // 미디어 업로드 API 호출
      const response = await apiService.uploadProjectImages(projectId, formData);
      
      if (response.data.success) {
        const newImagePaths = response.data.imagePaths as string[];
        const newMediaFiles = newImagePaths.map((filename: string) => {
          const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(filename);
          const url = projectCode 
            ? `http://localhost:5001/uploads/ProRealImage/${projectCode}/${filename}`
            : `http://localhost:5001/uploads/ProRealImage/${filename}`;
          return {
            filename,
            type: isVideo ? 'video' as const : 'image' as const,
            url
          };
        });
        
        // 업로드 후 이미지 목록 새로고침
        await loadProjectImages();
        
        // 부모 컴포넌트에 업데이트 알림
        const updatedMediaFiles = [...mediaFiles, ...newMediaFiles];
        const filenameArray = updatedMediaFiles.map(f => f.filename);
        onImagesUpdate?.(filenameArray);
        
        // 성공 메시지 표시
        setError(null);
        setSuccessMessage(`${newImagePaths.length}개의 파일이 성공적으로 업로드되었습니다.`);
        
        // 3초 후 성공 메시지 자동 제거
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('미디어 업로드 오류:', err);
      const errorMessage = err.response?.data?.error || '미디어 업로드에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaDelete = async (mediaIndex: number) => {
    if (!isEditable) return;

    try {
      const mediaFile = mediaFiles[mediaIndex];
      await apiService.deleteProjectImage(projectId, mediaFile.filename);
      
      // 삭제 후 이미지 목록 새로고침
      await loadProjectImages();
      
      // 부모 컴포넌트 업데이트 실행 (데이터 동기화를 위해)
      const currentMediaFiles = mediaFiles.filter((_, index) => index !== mediaIndex);
      onImagesUpdate?.(currentMediaFiles.map(f => f.filename));
    } catch (err: any) {
      setError('미디어 삭제에 실패했습니다.');
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openPreviewModal = (mediaFile: MediaFile) => {
    setPreviewModal({ isOpen: true, mediaFile });
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, mediaFile: null });
  };

  return (
    <div className="prod-real-image-section">
      <h4>📸 상품 사진</h4>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="success-close">×</button>
        </div>
      )}

      <div className="image-upload-area">
        {isEditable && (
          <div className="upload-controls">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={openFileSelector}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? '업로드 중...' : '사진 추가'}
            </button>
            <span className="upload-hint">
              최대 10개까지의 이미지 또는 비디오 파일을 업로드할 수 있습니다.
            </span>
          </div>
        )}

        <div className="media-gallery">
          {!Array.isArray(mediaFiles) || mediaFiles.length === 0 ? (
            <div className="no-media">
              <span>등록된 미디어가 없습니다.</span>
            </div>
          ) : (
            mediaFiles.map((mediaFile, index) => (
              <div key={index} className="media-item">
                <div 
                  className="media-thumbnail-container"
                  onClick={() => openPreviewModal(mediaFile)}
                >
                  {mediaFile.type === 'image' ? (
                    <img
                      src={mediaFile.url}
                      alt={`상품 사진 ${index + 1}`}
                      className="media-thumbnail"
                    />
                  ) : (
                    <video
                      src={mediaFile.url}
                      className="media-thumbnail"
                      preload="metadata"
                    />
                  )}
                  <div className="media-overlay">
                    <span className="preview-hint">클릭하여 미리보기</span>
                  </div>
                </div>
                
                {isEditable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMediaDelete(index);
                    }}
                    className="delete-media-btn"
                    title="미디어 삭제"
                  >
                    🗑️
                  </button>
                )}
                

              </div>
            ))
          )}
        </div>
      </div>

      {/* 미디어 미리보기 모달 */}
      {previewModal.isOpen && previewModal.mediaFile && (
        <MediaPreviewModal
          isOpen={previewModal.isOpen}
          mediaFile={previewModal.mediaFile}
          onClose={closePreviewModal}
        />
      )}
    </div>
  );
};

// 미디어 미리보기 모달 컴포넌트
const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ isOpen, mediaFile, onClose }) => {
  if (!isOpen || !mediaFile) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="media-preview-modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>
        <div className="modal-body">
          {mediaFile.type === 'image' ? (
            <img
              src={mediaFile.url}
              alt={mediaFile.filename}
              className="preview-image"
            />
          ) : (
            <video
              src={mediaFile.url}
              controls
              autoPlay
              className="preview-video"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdRealImage; 