# 🚀 Labsemble

React와 Express를 사용한 풀스택 웹 애플리케이션입니다.

## 📁 프로젝트 구조

```
labsemble-js/
├── client/          # React 프론트엔드
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Express 백엔드
│   ├── index.js
│   ├── package.json
│   └── README.md
└── README.md
```

## 🛠️ 기술 스택

### 프론트엔드
- **React 19** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Axios** - HTTP 클라이언트
- **CSS3** - 스타일링

### 백엔드
- **Express.js** - 웹 서버
- **CORS** - 크로스 오리진 리소스 공유
- **Helmet** - 보안 헤더
- **Morgan** - 로깅
- **Express Rate Limit** - 요청 제한
- **Dotenv** - 환경 변수 관리

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone <repository-url>
cd labsemble-js
```

### 2. 서버 설정 및 실행

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 환경 변수 설정
# .env 파일을 생성하고 필요한 환경 변수를 설정하세요

# 개발 서버 실행
npm run dev
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

### 3. 클라이언트 설정 및 실행

```bash
# 새 터미널에서 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

클라이언트는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 📡 API 엔드포인트

### 기본 엔드포인트
- `GET /` - 서버 정보
- `GET /api/health` - 헬스 체크

### 사용자 관련
- `GET /api/users` - 사용자 목록 (예시)

## 🔧 환경 변수 설정

서버 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 설정
PORT=5001
NODE_ENV=development

# 데이터베이스 설정 (MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=labsemble
DB_USER=root
DB_PASSWORD=your_password

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# 프론트엔드 URL (프로덕션 환경용)
FRONTEND_URL=http://your-domain.com

# 허용된 Origin 목록 (프로덕션 환경용)
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com

# 로깅 설정
LOG_LEVEL=combined
```

## 🌐 외부 접속 설정

### 서버 설정
- 서버는 `0.0.0.0:5001`에서 실행되어 모든 IP에서 접속 가능
- CORS 설정으로 개발 환경에서는 모든 origin 허용
- 프로덕션 환경에서는 지정된 도메인만 허용

### 클라이언트 설정
- `.env` 파일에서 `REACT_APP_API_URL`을 서버 IP로 설정
- 서버 IP 확인: `ipconfig` (Windows) 또는 `ifconfig` (Mac/Linux)
- 방화벽에서 5001 포트 열기

### 환경변수 설정 예시
클라이언트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API 서버 URL
REACT_APP_API_URL=http://your-server-ip:5001

# 예시:
# 로컬 네트워크: REACT_APP_API_URL=http://192.168.1.100:5001
# 외부 도메인: REACT_APP_API_URL=http://your-domain.com:5001
# 개발 환경: REACT_APP_API_URL=http://localhost:5001
```

## 🎨 UI 특징

- **반응형 디자인** - 모바일과 데스크톱 모두 지원
- **모던 UI** - 그라데이션 배경과 글래스모피즘 효과
- **사용자 친화적** - 직관적인 버튼과 카드 레이아웃
- **에러 처리** - 명확한 에러 메시지 표시

## 🔒 보안 기능

- **Helmet** - 보안 헤더 설정
- **CORS** - 크로스 오리진 요청 제어
- **Rate Limiting** - 요청 제한으로 DDoS 방지
- **입력 검증** - 사용자 입력 검증

## 📝 개발 가이드

### 새로운 API 엔드포인트 추가

1. `server/index.js`에 새로운 라우트 추가
2. `client/src/services/api.ts`에 API 함수 추가
3. `client/src/App.tsx`에서 새로운 기능 구현

### 스타일 수정

- `client/src/App.css`에서 스타일 수정
- CSS 변수를 사용하여 일관된 디자인 유지

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈를 확인하세요
2. 새로운 브랜치를 생성하세요
3. 변경사항을 커밋하세요
4. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**Labsemble** - React + Express 풀스택 개발을 위한 완벽한 시작점 🚀 