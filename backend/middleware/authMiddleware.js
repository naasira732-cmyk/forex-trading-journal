const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        data: null
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_forex_trading_journal_jwt_key_2026_secured');

    // Fetch user details from database to ensure user still exists and get latest starting balance
    const [rows] = await query(
      'SELECT id, name, email, starting_balance, currency, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.',
        data: null
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
        data: null
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
      data: null
    });
  }
};

module.exports = authMiddleware;
