-- MJ 프로젝트 테이블에 견적승인 필드 추가
-- 실행 날짜: 2025-08-16

-- 1. quotation_approval 컬럼 추가
ALTER TABLE mj_projects 
ADD COLUMN quotation_approval VARCHAR(50) NOT NULL DEFAULT '승인 대기' 
AFTER expected_shipping_date;

-- 2. 기존 데이터의 견적승인 상태를 '승인 대기'로 설정
UPDATE mj_projects 
SET quotation_approval = '승인 대기' 
WHERE quotation_approval IS NULL OR quotation_approval = '';

-- 3. 인덱스 추가 (선택사항)
-- CREATE INDEX idx_quotation_approval ON mj_projects(quotation_approval);

-- 4. 변경사항 확인
SELECT 
    id, 
    product_name, 
    quotation_approval, 
    created_at 
FROM mj_projects 
ORDER BY created_at DESC 
LIMIT 10; 