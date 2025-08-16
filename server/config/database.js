const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || '52.221.205.154',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'venpus',
  password: process.env.DB_PASSWORD || 'TianXian007!',
  database: process.env.DB_NAME || 'labsemble',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

// 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MariaDB 연결 성공!');
    console.log(`📊 데이터베이스: ${dbConfig.database}`);
    console.log(`🌐 호스트: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MariaDB 연결 실패:', error.message);
    return false;
  }
}

// 데이터베이스 초기화 (테이블 생성)
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 사용자 테이블 생성
                await connection.execute(`
              CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                company_name VARCHAR(100),
                contact_person VARCHAR(50),
                phone_number VARCHAR(20),
                business_name VARCHAR(100),
                business_number VARCHAR(20),
                business_address TEXT,
                ceo_name VARCHAR(50),
                tax_email VARCHAR(100),
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
              )
            `);

    // 기존 테이블에 새로운 컬럼 추가 (이미 존재하는 경우 무시)
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN company_name VARCHAR(100)');
      console.log('✅ company_name 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ company_name 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN contact_person VARCHAR(50)');
      console.log('✅ contact_person 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ contact_person 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)');
      console.log('✅ phone_number 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ phone_number 컬럼이 이미 존재함');
      }
    }

    // 세금계산서 관련 컬럼 추가
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN business_name VARCHAR(100)');
      console.log('✅ business_name 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ business_name 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN business_number VARCHAR(20)');
      console.log('✅ business_number 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ business_number 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN business_address TEXT');
      console.log('✅ business_address 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ business_address 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN ceo_name VARCHAR(50)');
      console.log('✅ ceo_name 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ ceo_name 컬럼이 이미 존재함');
      }
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN tax_email VARCHAR(100)');
      console.log('✅ tax_email 컬럼 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ tax_email 컬럼이 이미 존재함');
      }
    }

     // admin 권한 컬럼 추가
     try {
       await connection.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
       console.log('✅ is_admin 컬럼 추가됨');
     } catch (error) {
       if (error.code === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️ is_admin 컬럼이 이미 존재함');
       }
     }

     // vip_partners 테이블이 이미 존재하는지 확인
     try {
       const [existingTables] = await connection.execute("SHOW TABLES LIKE 'vip_partners'");
       if (existingTables.length > 0) {
         console.log('ℹ️ vip_partners 테이블이 이미 존재함');
       } else {
         console.log('ℹ️ vip_partners 테이블이 존재하지 않음');
       }
     } catch (error) {
       console.log('ℹ️ vip_partners 테이블 상태 확인 중 오류:', error.message);
     }

     // VIP 파트너스 테이블 생성
     await connection.execute(`
       CREATE TABLE IF NOT EXISTS vip_partners (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )
     `);
     console.log('✅ vip_partners 테이블 생성됨');

     // 사용자-파트너스 관계 테이블 생성
     await connection.execute(`
       CREATE TABLE IF NOT EXISTS user_partners (
         id INT AUTO_INCREMENT PRIMARY KEY,
         user_id INT NOT NULL,
         partner_id INT NOT NULL,
         assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
         FOREIGN KEY (partner_id) REFERENCES vip_partners(id) ON DELETE CASCADE,
         UNIQUE KEY unique_user_partner (user_id, partner_id)
       )
     `);
     console.log('✅ user_partners 테이블 생성됨');

     // MJ 프로젝트 테이블 생성
     await connection.execute(`
       CREATE TABLE IF NOT EXISTS mj_projects (
         id INT AUTO_INCREMENT PRIMARY KEY,
         user_id INT NOT NULL,
         product_name VARCHAR(255) NOT NULL,
         quantity INT NOT NULL,
         reference_link TEXT,
         image_paths JSON,
         status VARCHAR(50) DEFAULT '요청접수',
         price DECIMAL(10,2),
         payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
         delivery_status ENUM('waiting', 'processing', 'completed', 'delivered') DEFAULT 'waiting',
         expected_shipping_date DATE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
       )
     `);
     console.log('✅ mj_projects 테이블 생성됨');

     // 기존 테이블에 출고 예정일 컬럼 추가 (이미 존재하는 경우 무시)
     try {
       await connection.execute('ALTER TABLE mj_projects ADD COLUMN expected_shipping_date DATE');
       console.log('✅ expected_shipping_date 컬럼 추가됨');
     } catch (error) {
       if (error.code === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️ expected_shipping_date 컬럼이 이미 존재함');
       }
     }

     // 기존 테이블에 구매링크 컬럼 추가 (이미 존재하는 경우 무시)
     try {
       await connection.execute('ALTER TABLE mj_projects ADD COLUMN purchase_link TEXT');
       console.log('✅ purchase_link 컬럼 추가됨');
     } catch (error) {
       if (error.code === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️ purchase_link 컬럼이 이미 존재함');
       }
     }

    console.log('✅ 데이터베이스 테이블 초기화 완료!');
    connection.release();
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  dbConfig
}; 