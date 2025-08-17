const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
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
    const [userId, username, timestamp] = tokenData.split(':');
    
    if (!userId || !username) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    try {
      // 데이터베이스에서 최신 사용자 정보 조회 (is_admin 포함)
      const [rows] = await pool.execute(
        'SELECT id, username, is_admin FROM users WHERE id = ?',
        [parseInt(userId)]
      );
      
      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: '유효하지 않은 토큰입니다.'
        });
      }
      
      const user = rows[0];
      
      // 사용자 정보를 요청 객체에 추가
      req.user = {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin
      };
      
      // 디버깅을 위한 로그 출력
      console.log('인증된 사용자 정보:', req.user);
      
      next();
    } catch (dbError) {
      console.error('사용자 정보 조회 오류:', dbError);
      return res.status(500).json({
        success: false,
        error: '사용자 정보 조회 중 오류가 발생했습니다.'
      });
    }
    
  } catch (error) {
    console.error('토큰 인증 오류:', error);
    return res.status(401).json({
      success: false,
      error: '토큰 인증에 실패했습니다.'
    });
  }
};

module.exports = { authenticateToken }; 