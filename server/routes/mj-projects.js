const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 미디어 업로드 설정 (동적 폴더 생성)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 기본 폴더 (임시)
    cb(null, 'uploads/ProRealImage/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prod-real-image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 이미지 및 비디오 파일 허용
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 또는 비디오 파일만 업로드 가능합니다.'), false);
    }
  }
});

// MJ 프로젝트 등록
router.post('/', authenticateToken, upload.array('productImages', 5), async (req, res) => {
  try {
    
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
        mp.production_days,
        mp.logistic_cost,
        mp.commission_rate,
        mp.commission,
        mp.total_payment,
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
    console.log('서버 - 프로젝트 목록 조회, image_paths 확인:');
    projects.forEach((project, index) => {
      console.log(`  프로젝트 ${index + 1} (ID: ${project.id}): image_paths =`, project.image_paths);
    });

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

// MJ 프로젝트 수량 수정 (일반 사용자와 Admin 모두 수정 가능)
router.patch('/:id/quantity', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    console.log('수량 수정 시도 - 사용자 정보:', req.user);
    console.log('프로젝트 ID:', id, '수량:', quantity);

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: '유효한 수량이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트가 해당 사용자의 것인지 확인 (자신의 프로젝트만 수정 가능)
    const [projectCheck] = await connection.execute(
      'SELECT user_id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    console.log('프로젝트 소유자 ID:', projectCheck[0].user_id);
    console.log('현재 사용자 ID:', userId);
    console.log('Admin 여부:', req.user.is_admin);

    // Admin이거나 프로젝트 소유자인 경우에만 수정 가능
    if (!req.user.is_admin && projectCheck[0].user_id !== userId) {
      connection.release();
      return res.status(403).json({ error: '수량을 수정할 권한이 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '수량이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('수량 수정 오류:', error);
    res.status(500).json({ error: '수량 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 단가 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/price', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    // Admin 권한 확인
    console.log('단가 수정 시도 - 사용자 정보:', req.user);
    console.log('프로젝트 ID:', id, '단가:', price);
    console.log('Admin 여부:', req.user.is_admin);
    
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '단가를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({ error: '유효한 단가가 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [price, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '단가가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('단가 수정 오류:', error);
    res.status(500).json({ error: '단가 수정에 실패했습니다.' });
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

// MJ 프로젝트 출고 예정일 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/expected-shipping-date', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { expected_shipping_date } = req.body;

    // Admin 권한 확인
    console.log('출고 예정일 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '출고 예정일을 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 빈 문자열이나 null이면 NULL로 설정, 그렇지 않으면 날짜 값 사용
    const dateValue = (!expected_shipping_date || expected_shipping_date === '') ? null : expected_shipping_date;
    
    await connection.execute(
      'UPDATE mj_projects SET expected_shipping_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [dateValue, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '출고 예정일이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('출고 예정일 수정 오류:', error);
    res.status(500).json({ error: '출고 예정일 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 출고 상태 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/delivery-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;

    // Admin 권한 확인
    console.log('출고 상태 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '출고 상태를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    if (!delivery_status) {
      return res.status(400).json({ error: '출고 상태가 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET delivery_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [delivery_status, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '출고 상태가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('출고 상태 수정 오류:', error);
    res.status(500).json({ error: '출고 상태 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 구매 링크 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/purchase-link', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { purchaseLink } = req.body;

    // Admin 권한 확인
    console.log('구매 링크 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '구매 링크를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET purchase_link = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [purchaseLink, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '구매 링크가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('구매 링크 수정 오류:', error);
    res.status(500).json({ error: '구매 링크 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 생산소요일 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/production-days', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { production_days } = req.body;

    // Admin 권한 확인
    console.log('생산소요일 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '생산소요일을 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET production_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [production_days, id]
    );

    connection.release();

    res.json({
      success: true,
      message: '생산소요일이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('생산소요일 수정 오류:', error);
    res.status(500).json({ error: '생산소요일 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 logistic_cost 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/logistic-cost', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { logistic_cost } = req.body;

    // Admin 권한 확인
    console.log('logistic_cost 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'logistic_cost를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET logistic_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [logistic_cost, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'logistic_cost가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('logistic_cost 수정 오류:', error);
    res.status(500).json({ error: 'logistic_cost 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 commission_rate 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/commission-rate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { commission_rate } = req.body;

    // Admin 권한 확인
    console.log('commission_rate 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'commission_rate를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [commission_rate, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'commission_rate가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('commission_rate 수정 오류:', error);
    res.status(500).json({ error: 'commission_rate 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 commission 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/commission', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { commission } = req.body;

    // Admin 권한 확인
    console.log('commission 수정 시도 - 사용자 정보:', req.user);
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'commission을 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    await connection.execute(
      'UPDATE mj_projects SET commission = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [commission, id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'commission이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('commission 수정 오류:', error);
    res.status(500).json({ error: 'commission 수정에 실패했습니다.' });
  }
});

// MJ 프로젝트 total_payment 수정 (Admin 사용자만 수정 가능)
router.patch('/:id/total-payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { total_payment } = req.body;

    // Admin 권한 확인
    console.log('total_payment 수정 시도 - 사용자 정보:', req.user);
    console.log('요청된 total_payment 값:', total_payment);
    console.log('total_payment 타입:', typeof total_payment);
    
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'total_payment를 수정할 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    // 값 검증
    if (total_payment === undefined || total_payment === null) {
      return res.status(400).json({ error: 'total_payment 값이 제공되지 않았습니다.' });
    }

    const numericTotal = Number(total_payment);
    if (isNaN(numericTotal)) {
      return res.status(400).json({ error: 'total_payment는 유효한 숫자여야 합니다.' });
    }

    console.log('검증된 total_payment 값:', numericTotal);

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    console.log('DB 업데이트 실행:', numericTotal, id);
    await connection.execute(
      'UPDATE mj_projects SET total_payment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [numericTotal, id]
    );

    connection.release();

    console.log('total_payment 업데이트 성공');
    res.json({
      success: true,
      message: 'total_payment가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('total_payment 수정 오류:', error);
    console.error('오류 코드:', error.code);
    console.error('오류 메시지:', error.message);
    res.status(500).json({ 
      error: 'total_payment 수정에 실패했습니다.',
      details: error.message 
    });
  }
});

// 미디어 파일 업로드를 위한 Multer 설정
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/ProRealImage');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000000);
    const ext = path.extname(file.originalname);
    cb(null, `mj-project-${timestamp}-${randomId}${ext}`);
  }
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
    files: 10 // 최대 10개 파일
  },
  fileFilter: (req, file, cb) => {
    // 이미지 및 비디오 파일만 허용
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|mp4|avi|mov|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// MJ 프로젝트 미디어 업로드 (Admin 사용자만)
router.post('/:id/media', authenticateToken, mediaUpload.array('media', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Admin 권한 확인
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '미디어 업로드 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id, image_paths FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    // 기존 이미지 경로 가져오기
    let existingPaths = [];
    if (projectCheck[0].image_paths) {
      try {
        existingPaths = JSON.parse(projectCheck[0].image_paths);
      } catch (e) {
        existingPaths = [];
      }
    }

    // 새로 업로드된 파일들 추가
    const newFiles = req.files ? req.files.map(file => file.filename) : [];
    const updatedPaths = [...existingPaths, ...newFiles];

    // 최대 10개 제한 확인
    if (updatedPaths.length > 10) {
      connection.release();
      return res.status(400).json({ error: '최대 10개까지 업로드할 수 있습니다.' });
    }

    // 데이터베이스 업데이트
    await connection.execute(
      'UPDATE mj_projects SET image_paths = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedPaths), id]
    );

    connection.release();

    res.json({
      success: true,
      message: '미디어 파일이 성공적으로 업로드되었습니다.',
      uploadedFiles: newFiles,
      totalFiles: updatedPaths.length
    });
  } catch (error) {
    console.error('미디어 업로드 오류:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. 50MB 이하의 파일만 업로드 가능합니다.' });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '업로드할 수 있는 파일 수를 초과했습니다. 최대 10개까지 업로드 가능합니다.' });
    }
    
    res.status(500).json({ error: '미디어 업로드에 실패했습니다.' });
  }
});

// MJ 프로젝트 미디어 업로드 (프로젝트 소유자 또는 Admin)
router.post('/:id/images', authenticateToken, upload.array('productImages', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 및 권한 확인 (프로젝트 코드 포함)
    const [projectCheck] = await connection.execute(
      'SELECT id, user_id, image_paths, project_code FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    const project = projectCheck[0];
    
    // 권한 확인: 프로젝트 소유자 또는 Admin만 수정 가능
    if (project.user_id !== userId && !req.user.is_admin) {
      connection.release();
      return res.status(403).json({ error: '이미지 업로드 권한이 없습니다.' });
    }

    // 프로젝트 코드별 폴더 생성 및 파일 이동
    const projectCode = project.project_code || `project-${id}`;
    const projectFolder = `uploads/ProRealImage/${projectCode}`;
    
    // 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
      console.log(`✅ 프로젝트 폴더 생성됨: ${projectFolder}`);
    }

    // 기존 이미지 경로 가져오기
    let existingPaths = [];
    if (project.image_paths) {
      try {
        existingPaths = JSON.parse(project.image_paths);
      } catch (e) {
        existingPaths = [];
      }
    }
    
    console.log('서버 - 기존 이미지 경로:', existingPaths);

    // 새로 업로드된 이미지 처리 및 프로젝트 폴더로 이동
    let newImagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const oldPath = file.path;
        const newPath = path.join(projectFolder, file.filename);
        
        // 파일을 프로젝트 폴더로 이동
        fs.renameSync(oldPath, newPath);
        console.log(`✅ 파일 이동됨: ${oldPath} → ${newPath}`);
        
        // 파일 타입 확인
        const isVideo = file.mimetype.startsWith('video/');
        const fileType = isVideo ? 'video' : 'image';
        
        // DB에 이미지 정보 저장
        const fileUrl = `http://localhost:5001/uploads/ProRealImage/${projectCode}/${file.filename}`;
        await connection.execute(
          'INSERT INTO mj_project_images (project_id, filename, file_path, file_url, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)',
          [id, file.filename, newPath, fileUrl, fileType, file.size]
        );
        console.log(`✅ 이미지 정보 DB 저장됨: ${file.filename}`);
        
        newImagePaths.push(file.filename);
      }
    }
    
    console.log('서버 - 새로 업로드된 이미지:', newImagePaths);

    // 전체 이미지 경로 (기존 + 새로운)
    const updatedPaths = [...existingPaths, ...newImagePaths];
    console.log('서버 - 업데이트된 전체 경로:', updatedPaths);

    // 최대 10개 제한 확인
    if (updatedPaths.length > 10) {
      connection.release();
      return res.status(400).json({ error: '최대 10개까지 업로드할 수 있습니다.' });
    }

    // 데이터베이스 업데이트
    await connection.execute(
      'UPDATE mj_projects SET image_paths = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedPaths), id]
    );

    connection.release();

    res.json({
      success: true,
      message: '미디어가 성공적으로 업로드되었습니다.',
      imagePaths: newImagePaths,
      totalImages: updatedPaths.length
    });
  } catch (error) {
    console.error('미디어 업로드 오류:', error);
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '업로드할 수 있는 파일 수를 초과했습니다. 최대 10개까지 업로드 가능합니다.' });
    }
    
    res.status(500).json({ error: '미디어 업로드에 실패했습니다.' });
  }
});

// MJ 프로젝트 이미지 삭제 (프로젝트 소유자 또는 Admin)
router.delete('/:id/images', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { imagePath } = req.body;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 및 권한 확인 (프로젝트 코드 포함)
    const [projectCheck] = await connection.execute(
      'SELECT id, user_id, image_paths, project_code FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    const project = projectCheck[0];
    
    // 권한 확인: 프로젝트 소유자 또는 Admin만 수정 가능
    if (project.user_id !== userId && !req.user.is_admin) {
      connection.release();
      return res.status(403).json({ error: '이미지 삭제 권한이 없습니다.' });
    }

    // 기존 이미지 경로 가져오기
    let existingPaths = [];
    if (project.image_paths) {
      try {
        existingPaths = JSON.parse(project.image_paths);
      } catch (e) {
        existingPaths = [];
      }
    }

    // 삭제할 이미지 경로 제거
    const updatedPaths = existingPaths.filter(path => path !== imagePath);

    // 데이터베이스 업데이트
    await connection.execute(
      'UPDATE mj_projects SET image_paths = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedPaths), id]
    );

    // DB에서 이미지 정보 삭제
    await connection.execute(
      'DELETE FROM mj_project_images WHERE project_id = ? AND filename = ?',
      [id, imagePath]
    );
    console.log(`✅ DB에서 이미지 정보 삭제됨: ${imagePath}`);

    // 실제 파일 삭제 (프로젝트 폴더에서)
    try {
      const projectCode = projectCheck[0].project_code || `project-${id}`;
      const filePath = path.join(__dirname, '../uploads/ProRealImage', projectCode, imagePath);
      const fs = require('fs').promises;
      await fs.unlink(filePath);
      console.log(`✅ 파일 삭제됨: ${filePath}`);
    } catch (fileError) {
      console.error('파일 삭제 실패:', fileError);
      // 파일 삭제 실패해도 데이터베이스는 업데이트됨
    }

    connection.release();

    res.json({
      success: true,
      message: '이미지가 성공적으로 삭제되었습니다.',
      totalImages: updatedPaths.length
    });
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    res.status(500).json({ error: '이미지 삭제에 실패했습니다.' });
  }
});

// MJ 프로젝트 이미지 목록 조회 (ProdRealImage용)
router.get('/:id/prod-images', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 및 권한 확인
    const [projectCheck] = await connection.execute(
      'SELECT id, user_id FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    const project = projectCheck[0];
    
    // 권한 확인: 프로젝트 소유자 또는 Admin만 조회 가능
    if (project.user_id !== userId && !req.user.is_admin) {
      connection.release();
      return res.status(403).json({ error: '이미지 조회 권한이 없습니다.' });
    }

    // 프로젝트별 이미지 목록 조회
    const [images] = await connection.execute(
      'SELECT id, filename, file_url, file_type, file_size, upload_date FROM mj_project_images WHERE project_id = ? AND is_active = TRUE ORDER BY upload_date DESC',
      [id]
    );

    connection.release();

    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('이미지 목록 조회 오류:', error);
    res.status(500).json({ error: '이미지 목록 조회에 실패했습니다.' });
  }
});

// MJ 프로젝트 미디어 삭제 (Admin 사용자만)
router.delete('/:id/media', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaPath } = req.body;
    
    // Admin 권한 확인
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '미디어 삭제 권한이 없습니다. Admin 권한이 필요합니다.' });
    }

    const connection = await pool.getConnection();
    
    // 프로젝트 존재 여부 확인
    const [projectCheck] = await connection.execute(
      'SELECT id, image_paths FROM mj_projects WHERE id = ?',
      [id]
    );

    if (projectCheck.length === 0) {
      connection.release();
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }

    // 기존 이미지 경로 가져오기
    let existingPaths = [];
    if (projectCheck[0].image_paths) {
      try {
        existingPaths = JSON.parse(projectCheck[0].image_paths);
      } catch (e) {
        existingPaths = [];
      }
    }

    // 삭제할 파일 경로 제거
    const updatedPaths = existingPaths.filter(path => path !== mediaPath);

    // 데이터베이스 업데이트
    await connection.execute(
      'UPDATE mj_projects SET image_paths = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedPaths), id]
    );

    // 실제 파일 삭제
    try {
      const filePath = path.join(__dirname, '../uploads/ProRealImage', mediaPath);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('파일 삭제 실패:', fileError);
      // 파일 삭제 실패해도 데이터베이스는 업데이트됨
    }

    connection.release();

    res.json({
      success: true,
      message: '미디어 파일이 성공적으로 삭제되었습니다.',
      totalFiles: updatedPaths.length
    });
  } catch (error) {
    console.error('미디어 삭제 오류:', error);
    res.status(500).json({ error: '미디어 삭제에 실패했습니다.' });
  }
});

module.exports = router; 