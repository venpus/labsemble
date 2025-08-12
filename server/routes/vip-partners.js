const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 모든 VIP 파트너스 조회
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT id, name, created_at, updated_at 
      FROM vip_partners 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      partners: rows
    });
  } catch (error) {
    console.error('VIP 파트너스 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'VIP 파트너스 조회에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 특정 VIP 파트너스 조회
router.get('/:id', async (req, res) => {
  const partnerId = req.params.id;
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM vip_partners WHERE id = ?',
      [partnerId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'VIP 파트너스를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      partner: rows[0]
    });
  } catch (error) {
    console.error('VIP 파트너스 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'VIP 파트너스 조회에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 새로운 VIP 파트너스 생성
router.post('/', async (req, res) => {
  const { name } = req.body;
  let connection;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: '파트너스 이름은 필수 입력 항목입니다.'
    });
  }

  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO vip_partners (name) VALUES (?)',
      [name]
    );
    
    res.status(201).json({
      success: true,
      message: 'VIP 파트너스가 성공적으로 생성되었습니다.',
      partnerId: result.insertId
    });
  } catch (error) {
    console.error('VIP 파트너스 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: 'VIP 파트너스 생성에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// VIP 파트너스 정보 수정
router.put('/:id', async (req, res) => {
  const partnerId = req.params.id;
  const { name } = req.body;
  let connection;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: '파트너스 이름은 필수 입력 항목입니다.'
    });
  }

  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE vip_partners SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, partnerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'VIP 파트너스를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: 'VIP 파트너스 정보가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('VIP 파트너스 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: 'VIP 파트너스 수정에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// VIP 파트너스 삭제
router.delete('/:id', async (req, res) => {
  const partnerId = req.params.id;
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM vip_partners WHERE id = ?',
      [partnerId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'VIP 파트너스를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: 'VIP 파트너스가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('VIP 파트너스 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: 'VIP 파트너스 삭제에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router; 