const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: '아이디와 비밀번호를 입력해주세요.'
    });
  }
  
  try {
    // 사용자 조회
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, company_name, contact_person, phone_number, business_name, business_number, business_address, ceo_name, tax_email, is_admin FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    const user = rows[0];
    
    // 비밀번호 확인 (실제 프로젝트에서는 bcrypt.compare 사용)
    const passwordHash = Buffer.from(password).toString('base64');
    
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    // 로그인 성공 - JWT 토큰 생성 (실제 프로젝트에서는 jsonwebtoken 사용)
    const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: '로그인 성공',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        company_name: user.company_name,
        contact_person: user.contact_person,
        phone_number: user.phone_number,
        business_name: user.business_name,
        business_number: user.business_number,
        business_address: user.business_address,
        ceo_name: user.ceo_name,
        tax_email: user.tax_email,
        is_admin: user.is_admin
      }
    });
    
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  // 클라이언트에서 토큰을 제거하도록 안내
  res.json({
    success: true,
    message: '로그아웃 성공'
  });
});

// 현재 사용자 정보 조회
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }
    
    // 토큰에서 사용자 정보 추출 (실제 프로젝트에서는 JWT 검증)
    const tokenData = Buffer.from(token, 'base64').toString();
    const [userId] = tokenData.split(':');
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, company_name, contact_person, phone_number, business_name, business_number, business_address, ceo_name, tax_email, is_admin, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    res.json({
      success: true,
      user: rows[0]
    });
    
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 