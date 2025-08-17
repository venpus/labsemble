# Labsemble Server

Labsemble MJ 프로젝트 관리 시스템의 백엔드 서버입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 환경 설정
NODE_ENV=development
PORT=5001

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=labsemble

# 프론트엔드 URL (프로덕션 환경용)
FRONTEND_URL=http://your-domain.com

# 허용된 Origin 목록 (프로덕션 환경용, 쉼표로 구분)
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com

# JWT 시크릿 키
JWT_SECRET=your_jwt_secret_key_here

# 파일 업로드 설정
MAX_FILE_SIZE=52428800
MAX_FILES=10
```

### 3. 서버 실행
```bash
npm start
```

## 외부 접속 설정

### 개발 환경
- 서버는 기본적으로 `0.0.0.0:5001`에서 실행됩니다
- 모든 IP에서 접속 가능합니다
- CORS는 모든 origin을 허용합니다

### 프로덕션 환경
- `NODE_ENV=production`으로 설정
- `FRONTEND_URL`과 `ALLOWED_ORIGINS`로 허용된 origin만 접속 가능
- 보안을 위해 특정 도메인만 허용

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /api/health` - 헬스 체크
- `GET /api/db-test` - 데이터베이스 연결 테스트
- `POST /api/auth/login` - 로그인
- `GET /api/users` - 사용자 목록
- `GET /api/mj-projects` - MJ 프로젝트 목록

## 보안 설정

- Helmet.js로 보안 헤더 설정
- Rate limiting으로 DDoS 공격 방지
- CORS 설정으로 허용된 origin만 접속 가능 