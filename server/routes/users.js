const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// 모든 사용자 조회
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, username, email, company_name, contact_person, phone_number, business_name, business_number, business_address, ceo_name, tax_email, is_admin, created_at FROM users');
    res.json({
      success: true,
      users: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 목록을 가져오는데 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 특정 사용자 조회
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, username, email, company_name, contact_person, phone_number, business_name, business_number, business_address, ceo_name, tax_email, is_admin, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보를 가져오는데 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 새 사용자 생성
router.post('/', async (req, res) => {
  console.log('회원가입 요청 받음:', {
    body: req.body,
    headers: req.headers,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  const { username, email, password, companyName, contactPerson, phoneNumber } = req.body;
  
  if (!username || !email || !password) {
    console.log('필수 필드 누락:', { username: !!username, email: !!email, password: !!password });
    return res.status(400).json({
      success: false,
      error: '사용자명, 이메일, 비밀번호는 필수입니다.'
    });
  }
  
  try {
    console.log('데이터베이스 연결 시도...');
    // 비밀번호 해시화 (실제 프로젝트에서는 bcrypt 사용 권장)
    const passwordHash = Buffer.from(password).toString('base64');
    
    console.log('SQL 실행:', {
      username,
      email,
      passwordHash: passwordHash.substring(0, 10) + '...',
      companyName,
      contactPerson,
      phoneNumber
    });
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, company_name, contact_person, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, companyName || null, contactPerson || null, phoneNumber || null]
    );
    
    console.log('사용자 생성 성공:', { userId: result.insertId });
    
    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('사용자 생성 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 사용자명 또는 이메일입니다.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '사용자 생성에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : '내부 서버 오류'
    });
  }
});

// 사용자 정보 수정
router.put('/:id', async (req, res) => {
  const { username, email, is_admin } = req.body;
  const userId = req.params.id;
  
  try {
    const [result] = await pool.execute(
      'UPDATE users SET username = ?, email = ?, is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, is_admin || false, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 수정에 실패했습니다.'
    });
  }
});

// 관리자 권한 업데이트
router.patch('/:id/admin', async (req, res) => {
  const { is_admin } = req.body;
  const userId = req.params.id;
  
  try {
    const [result] = await pool.execute(
      'UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_admin, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: `관리자 권한이 ${is_admin ? '부여' : '해제'}되었습니다.`
    });
  } catch (error) {
    console.error('관리자 권한 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '관리자 권한 수정에 실패했습니다.'
    });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 삭제에 실패했습니다.'
    });
  }
});

// 사용자에게 파트너스 할당
router.post('/:id/partners', async (req, res) => {
  const { partner_id } = req.body;
  const userId = req.params.id;
  
  if (!partner_id) {
    return res.status(400).json({
      success: false,
      error: '파트너스 ID는 필수입니다.'
    });
  }
  
  try {
    // 사용자와 파트너스가 존재하는지 확인
    const [userResult] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    const [partnerResult] = await pool.execute('SELECT id FROM vip_partners WHERE id = ?', [partner_id]);
    
    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    if (partnerResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '파트너스를 찾을 수 없습니다.'
      });
    }
    
    // 이미 할당되어 있는지 확인
    const [existingResult] = await pool.execute(
      'SELECT id FROM user_partners WHERE user_id = ? AND partner_id = ?',
      [userId, partner_id]
    );
    
    if (existingResult.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이미 할당된 파트너스입니다.'
      });
    }
    
    // 파트너스 할당
    await pool.execute(
      'INSERT INTO user_partners (user_id, partner_id) VALUES (?, ?)',
      [userId, partner_id]
    );
    
    res.status(201).json({
      success: true,
      message: '파트너스가 성공적으로 할당되었습니다.'
    });
  } catch (error) {
    console.error('파트너스 할당 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너스 할당에 실패했습니다.'
    });
  }
});

// 사용자의 파트너스 목록 조회
router.get('/:id/partners', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [rows] = await pool.execute(`
      SELECT p.id, p.name, up.assigned_at
      FROM user_partners up
      JOIN vip_partners p ON up.partner_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.assigned_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      partners: rows
    });
  } catch (error) {
    console.error('사용자 파트너스 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 파트너스 조회에 실패했습니다.'
    });
  }
});

// 사용자에서 파트너스 제거
router.delete('/:id/partners/:partnerId', async (req, res) => {
  const userId = req.params.id;
  const partnerId = req.params.partnerId;
  
  try {
    const [result] = await pool.execute(
      'DELETE FROM user_partners WHERE user_id = ? AND partner_id = ?',
      [userId, partnerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '할당된 파트너스를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '파트너스가 성공적으로 제거되었습니다.'
    });
  } catch (error) {
    console.error('파트너스 제거 오류:', error);
    res.status(500).json({
      success: false,
      error: '파트너스 제거에 실패했습니다.'
    });
  }
});

// 사용자 프로필 업데이트
router.patch('/:id/profile', async (req, res) => {
  const userId = req.params.id;
  const { 
    username, 
    email, 
    company_name, 
    contact_person, 
    phone_number,
    business_name,
    business_number,
    business_address,
    ceo_name,
    tax_email
  } = req.body;
  let connection;
  
  if (!username || !email) {
    return res.status(400).json({
      success: false,
      error: '사용자명과 이메일은 필수입니다.'
    });
  }
  
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      `UPDATE users SET 
        username = ?, 
        email = ?, 
        company_name = ?, 
        contact_person = ?, 
        phone_number = ?,
        business_name = ?,
        business_number = ?,
        business_address = ?,
        ceo_name = ?,
        tax_email = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [
        username, 
        email, 
        company_name || null, 
        contact_person || null, 
        phone_number || null,
        business_name || null,
        business_number || null,
        business_address || null,
        ceo_name || null,
        tax_email || null,
        userId
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 사용자명 또는 이메일입니다.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '프로필 업데이트에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router; 