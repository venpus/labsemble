const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/mj-projects/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'mj-project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: function (req, file, cb) {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// MJ 프로젝트 등록
router.post('/', authenticateToken, upload.array('productImages', 5), async (req, res) => {
  try {
    console.log('MJ 프로젝트 등록 요청:', {
      body: req.body,
      files: req.files,
      userId: req.user.id
    });
    
                const { productName, quantity, referenceLink, purchaseLink, expectedShippingDate } = req.body;
    const userId = req.user.id;

    if (!productName || !quantity) {
      return res.status(400).json({ error: '제품명과 수량은 필수입니다.' });
    }

    const connection = await pool.getConnection();
    
    // 이미지 경로 처리
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.filename);
    }

    // 프로젝트 코드 생성 (MJ.프로젝트등록년월일.일련번호)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // 해당 날짜의 일련번호 조회
    const [sequenceResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM mj_projects WHERE DATE(created_at) = CURDATE()`
    );
    const sequenceNumber = (sequenceResult[0].count + 1).toString().padStart(3, '0');
    
    const projectCode = `MJ.${dateString}.${sequenceNumber}`;

    // 프로젝트 등록
    const [result] = await connection.execute(
      `INSERT INTO mj_projects (user_id, product_name, quantity, reference_link, purchase_link, image_paths, status, project_code, payment_status, delivery_status, expected_shipping_date, quotation_approval, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, '요청접수', ?, NULL, NULL, ?, '승인 대기', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, productName, quantity, referenceLink || null, purchaseLink || null, JSON.stringify(imagePaths), projectCode, expectedShippingDate || null]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'MJ 프로젝트가 성공적으로 등록되었습니다.',
      projectId: result.insertId
    });
  } catch (error) {
    console.error('MJ 프로젝트 등록 오류:', error);
    
    // multer 에러 처리
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.' });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '업로드할 수 있는 파일 수를 초과했습니다. 최대 5개까지 업로드 가능합니다.' });
    }
    
    if (error.message && error.message.includes('이미지 파일만 업로드 가능합니다')) {
      return res.status(400).json({ error: '이미지 파일만 업로드 가능합니다.' });
    }
    
    res.status(500).json({ error: 'MJ 프로젝트 등록에 실패했습니다.' });
  }
});

// MJ 프로젝트 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [projects] = await connection.execute(`
      SELECT 
        mp.id,
        mp.user_id,
        mp.product_name,
        mp.quantity,
        mp.reference_link,
        mp.purchase_link,
        mp.image_paths,
        mp.status,
        mp.price,
        mp.payment_status,
        mp.delivery_status,
        mp.expected_shipping_date,
        mp.project_code,
        mp.quotation_approval,
        mp.created_at,
        mp.updated_at,
        u.username,
        u.company_name,
        u.email
      FROM mj_projects mp
      LEFT JOIN users u ON mp.user_id = u.id
      ORDER BY mp.created_at DESC
    `);

    // 이미지 경로 디버깅 로그
    console.log('MJ 프로젝트 조회 결과:', projects.map(p => ({
      id: p.id,
      product_name: p.product_name,
      image_paths: p.image_paths
    })));

    connection.release();

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('MJ 프로젝트 조회 오류:', error);
    res.status(500).json({ error: 'MJ 프로젝트를 불러오는데 실패했습니다.' });
  }
});

// MJ 프로젝트 구매링크 수정
router.patch('/:id/purchase-link', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { purchaseLink } = req.body;

    if (purchaseLink === undefined) {
      return res.status(400).json({ error: '구매링크가 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE mj_projects SET purchase_link = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [purchaseLink, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '구매링크가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('구매링크 수정 오류:', error);
    res.status(500).json({ error: '구매링크 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 상태 변경
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: '상태가 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE mj_projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '프로젝트 상태가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('프로젝트 상태 변경 오류:', error);
    res.status(500).json({ error: '프로젝트 상태 변경에 실패했습니다.' });
  }
});

// MJ 프로젝트 견적승인 상태 변경
router.patch('/:id/quotation-approval', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quotationApproval } = req.body;

    if (!quotationApproval) {
      return res.status(400).json({ error: '견적승인 상태가 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE mj_projects SET quotation_approval = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quotationApproval, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '견적승인 상태가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('견적승인 상태 변경 오류:', error);
    res.status(500).json({ error: '견적승인 상태 변경에 실패했습니다.' });
  }
});

module.exports = router; 