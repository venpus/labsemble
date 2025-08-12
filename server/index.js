const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 데이터베이스 설정
const { testConnection, initializeDatabase } = require('./config/database');

// 라우트 가져오기
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const vipPartnersRouter = require('./routes/vip-partners');
const mjProjectsRouter = require('./routes/mj-projects');
const workStatusesRouter = require('./routes/work-statuses');

const app = express();
const PORT = process.env.PORT || 5001;

// 미들웨어 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // 보안 헤더 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
})); // CORS 설정
app.use(morgan('combined')); // 로깅
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 설정 (CORS 헤더 추가)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// Rate limiting 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});
app.use(limiter);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Labsemble API 서버에 오신 것을 환영합니다!',
    version: '1.0.0',
    status: 'running'
  });
});

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API 라우트 설정
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/vip-partners', vipPartnersRouter);
app.use('/api/mj-projects', mjProjectsRouter);
app.use('/api/work-statuses', workStatusesRouter);

// 데이터베이스 연결 테스트 엔드포인트
app.get('/api/db-test', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({
        success: true,
        message: '데이터베이스 연결 성공',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: '데이터베이스 연결 실패'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '데이터베이스 연결 테스트 중 오류 발생',
      error: error.message
    });
  }
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 Labsemble 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🔍 상태 확인: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ 데이터베이스 테스트: http://localhost:${PORT}/api/db-test`);
  
  // 데이터베이스 연결 테스트 및 초기화
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      await initializeDatabase();
    }
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
}); 