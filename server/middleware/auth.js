const authenticateToken = (req, res, next) => {
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
    const [userId, username] = tokenData.split(':');
    
    if (!userId || !username) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    // 사용자 정보를 요청 객체에 추가
    req.user = {
      id: parseInt(userId),
      username: username
    };
    
    next();
  } catch (error) {
    console.error('토큰 인증 오류:', error);
    return res.status(401).json({
      success: false,
      error: '토큰 인증에 실패했습니다.'
    });
  }
};

module.exports = { authenticateToken }; 