const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { pool } = require('../config/database');

// 작업상태 테이블 생성 (서버 시작 시 자동으로 생성되도록)
const createWorkStatusTable = async () => {
  try {
    // 기존 테이블이 있는지 확인
    const [existingTables] = await pool.query('SHOW TABLES LIKE "work_statuses"');
    
    if (existingTables.length === 0) {
      // 새 테이블 생성
      const createTableQuery = `
        CREATE TABLE work_statuses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          \`order\` INT DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          category VARCHAR(50) NOT NULL,
          status_type VARCHAR(50) NOT NULL DEFAULT 'work',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category),
          INDEX idx_status_type (status_type),
          INDEX idx_order (category, status_type, \`order\`)
        )
      `;
      
      await pool.query(createTableQuery);
  
    } else {
      // 기존 테이블에 status_type 컬럼 추가
      try {
        await pool.query('ALTER TABLE work_statuses ADD COLUMN status_type VARCHAR(50) NOT NULL DEFAULT "work" AFTER category');

        
        // 인덱스 추가
        try {
          await pool.query('ALTER TABLE work_statuses ADD INDEX idx_status_type (status_type)');
          await pool.query('ALTER TABLE work_statuses ADD INDEX idx_order (category, status_type, `order`)');

        } catch (indexError) {
          // 인덱스가 이미 존재하는 경우 무시
        }
        
        // 기존 데이터의 status_type을 'work'로 설정
        try {
          await pool.query('UPDATE work_statuses SET status_type = "work" WHERE status_type IS NULL OR status_type = ""');
          
      } catch (updateError) {
        // 기존 데이터 업데이트 중 오류 발생 시 무시
      }
      } catch (columnError) {
        if (columnError.code === 'ER_DUP_FIELDNAME') {
    
        } else {
          console.error('컬럼 추가 오류:', columnError);
        }
      }
    }
    
    // 기본 작업상태 데이터 삽입 (없는 경우에만) - 주석 처리됨
    // await insertDefaultStatuses();
  } catch (error) {
    console.error('작업상태 테이블 생성 오류:', error);
  }
};

// 기본 작업상태 데이터 삽입
const insertDefaultStatuses = async () => {
  try {
    const defaultStatuses = [
      // SMT - 작업상태
      { name: '요청 접수', description: '새로운 SMT 작업 요청이 접수됨', color: '#3B82F6', order: 1, category: 'smt', status_type: 'work' },
      { name: '검토 중', description: 'SMT 작업 요청을 검토 중', color: '#F59E0B', order: 2, category: 'smt', status_type: 'work' },
      { name: '승인됨', description: 'SMT 작업 요청이 승인됨', color: '#10B981', order: 3, category: 'smt', status_type: 'work' },
      { name: '진행 중', description: 'SMT 작업이 진행 중', color: '#8B5CF6', order: 4, category: 'smt', status_type: 'work' },
      { name: '완료', description: 'SMT 작업이 완료됨', color: '#059669', order: 5, category: 'smt', status_type: 'work' },
      
      // SMT - 결제상태
      { name: '결제 대기', description: '결제 대기 중', color: '#EF4444', order: 1, category: 'smt', status_type: 'payment' },
      { name: '결제 완료', description: '결제가 완료됨', color: '#10B981', order: 2, category: 'smt', status_type: 'payment' },
      { name: '환불 요청', description: '환불이 요청됨', color: '#F59E0B', order: 3, category: 'smt', status_type: 'payment' },
      
      // SMT - 배송상태
      { name: '배송 준비', description: '배송 준비 중', color: '#8B5CF6', order: 1, category: 'smt', status_type: 'delivery' },
      { name: '배송 중', description: '배송이 진행 중', color: '#EC4899', order: 2, category: 'smt', status_type: 'delivery' },
      { name: '배송 완료', description: '배송이 완료됨', color: '#059669', order: 3, category: 'smt', status_type: 'delivery' },
      
      // 아트웍 - 작업상태
      { name: '요청 접수', description: '새로운 아트웍 작업 요청이 접수됨', color: '#3B82F6', order: 1, category: 'artwork', status_type: 'work' },
      { name: '디자인 검토', description: '아트웍 디자인을 검토 중', color: '#F59E0B', order: 2, category: 'artwork', status_type: 'work' },
      { name: '수정 요청', description: '아트웍 디자인 수정이 요청됨', color: '#EF4444', order: 3, category: 'artwork', status_type: 'work' },
      { name: '승인됨', description: '아트웍 디자인이 승인됨', color: '#10B981', order: 4, category: 'artwork', status_type: 'work' },
      { name: '완료', description: '아트웍 작업이 완료됨', color: '#059669', order: 5, category: 'artwork', status_type: 'work' },
      
      // 아트웍 - 결제상태
      { name: '결제 대기', description: '결제 대기 중', color: '#EF4444', order: 1, category: 'artwork', status_type: 'payment' },
      { name: '결제 완료', description: '결제가 완료됨', color: '#10B981', order: 2, category: 'artwork', status_type: 'payment' },
      
      // 아트웍 - 배송상태
      { name: '배송 준비', description: '배송 준비 중', color: '#8B5CF6', order: 1, category: 'artwork', status_type: 'delivery' },
      { name: '배송 완료', description: '배송이 완료됨', color: '#059669', order: 2, category: 'artwork', status_type: 'delivery' },
      
      // 금형 - 작업상태
      { name: '요청 접수', description: '새로운 금형 작업 요청이 접수됨', color: '#3B82F6', order: 1, category: 'mold', status_type: 'work' },
      { name: '설계 검토', description: '금형 설계를 검토 중', color: '#F59E0B', order: 2, category: 'mold', status_type: 'work' },
      { name: '제작 중', description: '금형 제작이 진행 중', color: '#8B5CF6', order: 3, category: 'mold', status_type: 'work' },
      { name: '품질 검사', description: '금형 품질 검사를 진행 중', color: '#EC4899', order: 4, category: 'mold', status_type: 'work' },
      { name: '완료', description: '금형 작업이 완료됨', color: '#059669', order: 5, category: 'mold', status_type: 'work' },
      
      // 금형 - 결제상태
      { name: '결제 대기', description: '결제 대기 중', color: '#EF4444', order: 1, category: 'mold', status_type: 'payment' },
      { name: '결제 완료', description: '결제가 완료됨', color: '#10B981', order: 2, category: 'mold', status_type: 'payment' },
      
      // 금형 - 배송상태
      { name: '배송 준비', description: '배송 준비 중', color: '#8B5CF6', order: 1, category: 'mold', status_type: 'delivery' },
      { name: '배송 중', description: '배송이 진행 중', color: '#EC4899', order: 2, category: 'mold', status_type: 'delivery' },
      { name: '배송 완료', description: '배송이 완료됨', color: '#059669', order: 3, category: 'mold', status_type: 'delivery' },
      
      // 부품구매 - 작업상태
      { name: '요청 접수', description: '새로운 부품구매 요청이 접수됨', color: '#3B82F6', order: 1, category: 'parts', status_type: 'work' },
      { name: '견적 요청', description: '부품에 대한 견적을 요청 중', color: '#F59E0B', order: 2, category: 'parts', status_type: 'work' },
      { name: '견적 완료', description: '부품 견적이 완료됨', color: '#8B5CF6', order: 3, category: 'parts', status_type: 'work' },
      { name: '주문 진행', description: '부품 주문이 진행 중', color: '#EC4899', order: 4, category: 'parts', status_type: 'work' },
      { name: '입고 완료', description: '부품이 입고됨', color: '#10B981', order: 5, category: 'parts', status_type: 'work' },
      
      // 부품구매 - 결제상태
      { name: '결제 대기', description: '결제 대기 중', color: '#EF4444', order: 1, category: 'parts', status_type: 'payment' },
      { name: '결제 완료', description: '결제가 완료됨', color: '#10B981', order: 2, category: 'parts', status_type: 'payment' },
      
      // 부품구매 - 배송상태
      { name: '배송 준비', description: '배송 준비 중', color: '#8B5CF6', order: 1, category: 'parts', status_type: 'delivery' },
      { name: '배송 중', description: '배송이 진행 중', color: '#EC4899', order: 2, category: 'parts', status_type: 'delivery' },
      { name: '배송 완료', description: '배송이 완료됨', color: '#059669', order: 3, category: 'parts', status_type: 'delivery' },
      
              // MJ 서비스 - 작업상태
        { name: '요청접수', description: '새로운 MJ 서비스 요청이 접수됨', color: '#3B82F6', order: 1, category: 'mj', status_type: 'work' },
        { name: '검토중', description: 'MJ 서비스 요청을 검토 중', color: '#F59E0B', order: 2, category: 'mj', status_type: 'work' },
        { name: '승인됨', description: 'MJ 서비스 요청이 승인됨', color: '#10B981', order: 3, category: 'mj', status_type: 'work' },
        { name: '처리중', description: 'MJ 서비스가 처리 중', color: '#8B5CF6', order: 4, category: 'mj', status_type: 'work' },
        { name: '완료', description: 'MJ 서비스가 완료됨', color: '#059669', order: 5, category: 'mj', status_type: 'work' },
      
      // MJ 서비스 - 결제상태
      { name: '결제 대기', description: '결제 대기 중', color: '#EF4444', order: 1, category: 'mj', status_type: 'payment' },
      { name: '결제 완료', description: '결제가 완료됨', color: '#10B981', order: 2, category: 'mj', status_type: 'payment' },
      
      // MJ 서비스 - 배송상태
      { name: '배송 준비', description: '배송 준비 중', color: '#8B5CF6', order: 1, category: 'mj', status_type: 'delivery' },
      { name: '배송 완료', description: '배송이 완료됨', color: '#059669', order: 2, category: 'mj', status_type: 'delivery' }
    ];
    
    for (const status of defaultStatuses) {
      const checkQuery = 'SELECT id FROM work_statuses WHERE name = ? AND category = ? AND status_type = ?';
      const [existing] = await pool.query(checkQuery, [status.name, status.category, status.status_type]);
      
      if (existing.length === 0) {
        const insertQuery = `
          INSERT INTO work_statuses (name, description, color, \`order\`, category, status_type) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(insertQuery, [status.name, status.description, status.color, status.order, status.category, status.status_type]);
      }
    }
    

  } catch (error) {
    console.error('기본 작업상태 데이터 삽입 오류:', error);
  }
};

// 서버 시작 시 테이블 생성
createWorkStatusTable();

// 전체 작업상태 목록 조회
router.get('/', auth, async (req, res) => {
  try {
    const { category, status_type } = req.query;
    
    let query = `
      SELECT id, name, description, color, \`order\`, is_active, category, status_type, created_at, updated_at
      FROM work_statuses 
      WHERE is_active = TRUE
    `;
    let params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (status_type) {
      query += ' AND status_type = ?';
      params.push(status_type);
    }
    
    query += ' ORDER BY category ASC, status_type ASC, \`order\` ASC, created_at ASC';
    
    const [statuses] = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      category: category || 'all',
      status_type: status_type || 'all',
      workStatuses: statuses 
    });
  } catch (error) {
    console.error('작업상태 조회 오류:', error);
    res.status(500).json({ error: '작업상태를 불러오는데 실패했습니다.' });
  }
});

// 특정 카테고리의 작업상태 목록 조회
router.get('/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { status_type } = req.query;
    
    // 카테고리 유효성 검사
    const validCategories = ['smt', 'artwork', 'mold', 'parts', 'mj'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: '유효하지 않은 카테고리입니다.',
        validCategories 
      });
    }
    
    // status_type 유효성 검사
    const validStatusTypes = ['work', 'payment', 'delivery'];
    if (status_type && !validStatusTypes.includes(status_type)) {
      return res.status(400).json({ 
        error: '유효하지 않은 상태 타입입니다.',
        validStatusTypes 
      });
    }
    
    let query = `
      SELECT id, name, description, color, \`order\`, is_active, status_type, created_at, updated_at
      FROM work_statuses 
      WHERE category = ?
    `;
    let params = [category];
    
    if (status_type) {
      query += ' AND status_type = ?';
      params.push(status_type);
    }
    
    query += ' ORDER BY \`order\` ASC, created_at ASC';
    
    const [statuses] = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      category,
      status_type: status_type || 'all',
      statuses 
    });
  } catch (error) {
    console.error('작업상태 조회 오류:', error);
    res.status(500).json({ error: '작업상태를 불러오는데 실패했습니다.' });
  }
});

// 특정 작업상태 조회
router.get('/:category/:id', auth, async (req, res) => {
  try {
    const { category, id } = req.params;
    
    const query = `
      SELECT id, name, description, color, \`order\`, is_active, category, created_at, updated_at
      FROM work_statuses 
      WHERE id = ? AND category = ?
    `;
    
    const [statuses] = await pool.query(query, [id, category]);
    
    if (statuses.length === 0) {
      return res.status(404).json({ error: '작업상태를 찾을 수 없습니다.' });
    }
    
    res.json({ 
      success: true, 
      status: statuses[0] 
    });
  } catch (error) {
    console.error('작업상태 조회 오류:', error);
    res.status(500).json({ error: '작업상태를 불러오는데 실패했습니다.' });
  }
});

// 새로운 작업상태 생성
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color, order, is_active, category, status_type } = req.body;
    
    // 필수 필드 검증
    if (!name || !category || !status_type) {
      return res.status(400).json({ error: '상태명, 카테고리, 상태타입은 필수입니다.' });
    }
    
    // 카테고리 유효성 검사
    const validCategories = ['smt', 'artwork', 'mold', 'parts', 'mj'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: '유효하지 않은 카테고리입니다.',
        validCategories 
      });
    }
    
    // 상태타입 유효성 검사
    const validStatusTypes = ['work', 'payment', 'delivery'];
    if (!validStatusTypes.includes(status_type)) {
      return res.status(400).json({ 
        error: '유효하지 않은 상태타입입니다.',
        validStatusTypes 
      });
    }
    
    // 동일한 카테고리와 상태타입 내에서 이름 중복 검사
    const checkQuery = 'SELECT id FROM work_statuses WHERE name = ? AND category = ? AND status_type = ?';
    const [existing] = await pool.query(checkQuery, [name, category, status_type]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '해당 카테고리와 상태타입에 이미 동일한 이름의 상태가 존재합니다.' });
    }
    
    // 순서가 지정되지 않은 경우 자동으로 마지막 순서로 설정
    let finalOrder = order;
    if (!finalOrder) {
      const maxOrderQuery = 'SELECT MAX(`order`) as maxOrder FROM work_statuses WHERE category = ? AND status_type = ?';
      const [maxOrderResult] = await pool.query(maxOrderQuery, [category, status_type]);
      finalOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
    }
    
    const insertQuery = `
      INSERT INTO work_statuses (name, description, color, \`order\`, is_active, category, status_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(insertQuery, [
      name, 
      description || '', 
      color || '#3B82F6', 
      finalOrder, 
      is_active !== undefined ? is_active : true, 
      category,
      status_type
    ]);
    
    // 생성된 작업상태 조회
    const selectQuery = 'SELECT * FROM work_statuses WHERE id = ?';
    const [newStatus] = await pool.query(selectQuery, [result.insertId]);
    
    res.status(201).json({ 
      success: true, 
      message: '작업상태가 생성되었습니다.',
      status: newStatus[0] 
    });
  } catch (error) {
    console.error('작업상태 생성 오류:', error);
    res.status(500).json({ error: '작업상태 생성에 실패했습니다.' });
  }
});

// 작업상태 수정
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, order, is_active, category } = req.body;
    
    // 기존 작업상태 조회
    const selectQuery = 'SELECT * FROM work_statuses WHERE id = ?';
    const [existing] = await pool.query(selectQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: '수정할 작업상태를 찾을 수 없습니다.' });
    }
    
    const currentStatus = existing[0];
    
    // 업데이트할 데이터 준비
    const updateData = {
      name: name !== undefined ? name : currentStatus.name,
      description: description !== undefined ? description : currentStatus.description,
      color: color !== undefined ? color : currentStatus.color,
      order: order !== undefined ? order : currentStatus.order,
      is_active: is_active !== undefined ? is_active : currentStatus.is_active,
      category: category || currentStatus.category
    };
    
    // 이름이 변경된 경우 중복 검사
    if (name && name !== currentStatus.name) {
      const checkQuery = 'SELECT id FROM work_statuses WHERE name = ? AND category = ? AND id != ?';
      const [duplicate] = await pool.query(checkQuery, [name, updateData.category, id]);
      
      if (duplicate.length > 0) {
        return res.status(400).json({ error: '해당 카테고리에 이미 동일한 이름의 상태가 존재합니다.' });
      }
    }
    
    // 업데이트 실행
    const updateQuery = `
      UPDATE work_statuses 
      SET name = ?, description = ?, color = ?, \`order\` = ?, is_active = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await pool.query(updateQuery, [
      updateData.name,
      updateData.description,
      updateData.color,
      updateData.order,
      updateData.is_active,
      updateData.category,
      id
    ]);
    
    // 업데이트된 작업상태 조회
    const [updatedStatus] = await pool.query(selectQuery, [id]);
    
    res.json({ 
      success: true, 
      message: '작업상태가 수정되었습니다.',
      status: updatedStatus[0] 
    });
  } catch (error) {
    console.error('작업상태 수정 오류:', error);
    res.status(500).json({ error: '작업상태 수정에 실패했습니다.' });
  }
});

// 작업상태 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 기존 작업상태 조회
    const selectQuery = 'SELECT * FROM work_statuses WHERE id = ?';
    const [existing] = await pool.query(selectQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: '삭제할 작업상태를 찾을 수 없습니다.' });
    }
    
    // 삭제 실행
    const deleteQuery = 'DELETE FROM work_statuses WHERE id = ?';
    await pool.query(deleteQuery, [id]);
    
    res.json({ 
      success: true, 
      message: '작업상태가 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('작업상태 삭제 오류:', error);
    res.status(500).json({ error: '작업상태 삭제에 실패했습니다.' });
  }
});

// 작업상태 순서 변경 (드래그 앤 드롭 지원)
router.patch('/:id/reorder', auth, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { newOrder } = req.body;
    
    if (newOrder === undefined || newOrder < 1) {
      return res.status(400).json({ error: '유효하지 않은 순서입니다.' });
    }
    
    // 기존 작업상태 조회
    const selectQuery = 'SELECT * FROM work_statuses WHERE id = ?';
    const [existing] = await pool.query(selectQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: '순서를 변경할 작업상태를 찾을 수 없습니다.' });
    }
    
    const currentStatus = existing[0];
    const oldOrder = currentStatus.order;
    
    if (newOrder === oldOrder) {
      return res.json({ 
        success: true, 
        message: '순서가 변경되지 않았습니다.' 
      });
    }
    
    // 연결 가져오기
    connection = await pool.getConnection();
    
    // 트랜잭션으로 순서 변경
    await connection.beginTransaction();
    
    try {
      if (newOrder > oldOrder) {
        // 순서를 뒤로 이동하는 경우
        const updateQuery = `
          UPDATE work_statuses 
          SET \`order\` = \`order\` - 1 
          WHERE category = ? AND \`order\` > ? AND \`order\` <= ?
        `;
        await connection.execute(updateQuery, [currentStatus.category, oldOrder, newOrder]);
      } else {
        // 순서를 앞으로 이동하는 경우
        const updateQuery = `
          UPDATE work_statuses 
          SET \`order\` = \`order\` + 1 
          WHERE category = ? AND \`order\` >= ? AND \`order\` < ?
        `;
        await connection.execute(updateQuery, [currentStatus.category, newOrder, oldOrder]);
      }
      
      // 현재 항목의 순서 업데이트
      const updateCurrentQuery = 'UPDATE work_statuses SET `order` = ? WHERE id = ?';
      await connection.execute(updateCurrentQuery, [newOrder, id]);
      
      await connection.commit();
      
      res.json({ 
        success: true, 
        message: '작업상태 순서가 변경되었습니다.' 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('작업상태 순서 변경 오류:', error);
    res.status(500).json({ error: '작업상태 순서 변경에 실패했습니다.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 모든 작업상태 순서 정리 (중복 제거 및 순서 재정렬)
router.post('/reorder-all', auth, async (req, res) => {
  let connection;
  try {
    // 연결 가져오기
    connection = await pool.getConnection();
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    try {
      // 모든 카테고리와 상태타입 조합에 대해 순서 정리
      const categories = ['smt', 'artwork', 'mold', 'parts', 'mj'];
      const statusTypes = ['work', 'payment', 'delivery'];
      
      for (const category of categories) {
        for (const statusType of statusTypes) {
          // 해당 카테고리와 상태타입의 모든 작업상태를 생성일 순으로 조회
          const selectQuery = `
            SELECT id, name, created_at 
            FROM work_statuses 
            WHERE category = ? AND status_type = ? 
            ORDER BY created_at ASC
          `;
          
          const [statuses] = await connection.execute(selectQuery, [category, statusType]);
          
          // 순서를 1부터 시작하여 순차적으로 업데이트
          for (let i = 0; i < statuses.length; i++) {
            const updateQuery = 'UPDATE work_statuses SET `order` = ? WHERE id = ?';
            await connection.execute(updateQuery, [i + 1, statuses[i].id]);
          }
          
    
        }
      }
      
      await connection.commit();
      
      res.json({ 
        success: true, 
        message: '모든 작업상태 순서가 정리되었습니다.',
        details: '각 카테고리와 상태타입별로 생성일 순서대로 순서가 재정렬되었습니다.'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('작업상태 순서 정리 오류:', error);
    res.status(500).json({ error: '작업상태 순서 정리에 실패했습니다.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 중복된 작업상태 제거
router.post('/remove-duplicates', auth, async (req, res) => {
  let connection;
  try {
    // 연결 가져오기
    connection = await pool.getConnection();
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    try {
      const removedDuplicates = [];
      
      // 모든 카테고리와 상태타입 조합에 대해 중복 제거
      const categories = ['smt', 'artwork', 'mold', 'parts', 'mj'];
      const statusTypes = ['work', 'payment', 'delivery'];
      
      for (const category of categories) {
        for (const statusType of statusTypes) {
          // 해당 카테고리와 상태타입에서 중복된 name 찾기
          const duplicateQuery = `
            SELECT name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY created_at ASC) as ids
            FROM work_statuses 
            WHERE category = ? AND status_type = ?
            GROUP BY name 
            HAVING COUNT(*) > 1
          `;
          
          const [duplicates] = await connection.execute(duplicateQuery, [category, statusType]);
          
          for (const duplicate of duplicates) {
            const ids = duplicate.ids.split(',').map(id => parseInt(id.trim()));
            const keepId = ids[0]; // 가장 오래된 항목 유지
            const removeIds = ids.slice(1); // 나머지 중복 항목들 삭제
            
            // 중복 항목들 삭제
            for (const removeId of removeIds) {
              await connection.execute('DELETE FROM work_statuses WHERE id = ?', [removeId]);
              removedDuplicates.push({
                category,
                status_type: statusType,
                name: duplicate.name,
                removed_id: removeId,
                kept_id: keepId
              });
            }
            
    
          }
        }
      }
      
      // 중복 제거 후 순서 재정렬
      for (const category of categories) {
        for (const statusType of statusTypes) {
          const selectQuery = `
            SELECT id, name, created_at 
            FROM work_statuses 
            WHERE category = ? AND status_type = ? 
            ORDER BY created_at ASC
          `;
          
          const [statuses] = await connection.execute(selectQuery, [category, statusType]);
          
          // 순서를 1부터 시작하여 순차적으로 업데이트
          for (let i = 0; i < statuses.length; i++) {
            const updateQuery = 'UPDATE work_statuses SET `order` = ? WHERE id = ?';
            await connection.execute(updateQuery, [i + 1, statuses[i].id]);
          }
        }
      }
      
      await connection.commit();
      
      res.json({ 
        success: true, 
        message: '중복된 작업상태가 제거되었습니다.',
        removedCount: removedDuplicates.length,
        removedDuplicates: removedDuplicates,
        details: '각 카테고리와 상태타입별로 중복된 name이 제거되고 순서가 재정렬되었습니다.'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('중복 작업상태 제거 오류:', error);
    res.status(500).json({ error: '중복 작업상태 제거에 실패했습니다.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 중복 데이터 확인
router.get('/check-duplicates', auth, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const duplicates = [];
      
      // 모든 카테고리와 상태타입 조합에 대해 중복 확인
      const categories = ['smt', 'artwork', 'mold', 'parts', 'mj'];
      const statusTypes = ['work', 'payment', 'delivery'];
      
      for (const category of categories) {
        for (const statusType of statusTypes) {
          // 해당 카테고리와 상태타입에서 중복된 name 찾기
          const duplicateQuery = `
            SELECT name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY created_at ASC) as ids
            FROM work_statuses 
            WHERE category = ? AND status_type = ?
            GROUP BY name 
            HAVING COUNT(*) > 1
          `;
          
          const [categoryDuplicates] = await connection.execute(duplicateQuery, [category, statusType]);
          
          if (categoryDuplicates.length > 0) {
            duplicates.push({
              category,
              status_type: statusType,
              duplicates: categoryDuplicates
            });
          }
        }
      }
      
      connection.release();
      
      res.json({ 
        success: true, 
        hasDuplicates: duplicates.length > 0,
        duplicateCount: duplicates.reduce((total, cat) => total + cat.duplicates.length, 0),
        duplicates: duplicates
      });
      
    } catch (error) {
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('중복 데이터 확인 오류:', error);
    res.status(500).json({ error: '중복 데이터 확인에 실패했습니다.' });
  }
});

module.exports = router; 