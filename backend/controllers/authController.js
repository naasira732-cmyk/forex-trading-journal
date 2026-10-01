const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_forex_trading_journal_jwt_key_2026_secured';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT Token helper
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, starting_balance, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
        data: null
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        data: null
      });
    }

    // Check if user already exists
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
        data: null
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const initialBalance = Number(starting_balance) > 0 ? Number(starting_balance) : 10000.00;
    const userCurrency = currency ? currency.trim().toUpperCase() : 'USD';

    // Insert user
    const [result] = await query(
      'INSERT INTO users (name, email, password, starting_balance, currency) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, initialBalance, userCurrency]
    );

    const newUserId = result.insertId;
    const token = generateToken(newUserId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: newUserId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          starting_balance: initialBalance,
          currency: userCurrency
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
        data: null
      });
    }

    // Find user
    const [users] = await query(
      'SELECT id, name, email, password, starting_balance, currency FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null
      });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null
      });
    }

    // Compute current balance by summing trades
    const [tradeSums] = await query(
      'SELECT COALESCE(SUM(profit_loss), 0) as net_pnl FROM trades WHERE user_id = ?',
      [user.id]
    );
    const netPnl = Number(tradeSums[0]?.net_pnl || 0);
    const currentBalance = Number(user.starting_balance) + netPnl;

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          starting_balance: Number(user.starting_balance),
          current_balance: Math.round(currentBalance * 100) / 100,
          currency: user.currency
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    data: null
  });
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user and calculated balance
    const [users] = await query(
      'SELECT id, name, email, starting_balance, currency, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        data: null
      });
    }

    const user = users[0];

    const [tradeSums] = await query(
      'SELECT COALESCE(SUM(profit_loss), 0) as net_pnl, COUNT(*) as total_trades FROM trades WHERE user_id = ?',
      [userId]
    );
    const netPnl = Number(tradeSums[0]?.net_pnl || 0);
    const totalTrades = Number(tradeSums[0]?.total_trades || 0);
    const currentBalance = Number(user.starting_balance) + netPnl;

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        starting_balance: Number(user.starting_balance),
        current_balance: Math.round(currentBalance * 100) / 100,
        currency: user.currency,
        net_profit: Math.round(netPnl * 100) / 100,
        total_trades: totalTrades,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, starting_balance, currency } = req.body;

    const updates = [];
    const params = [];

    if (name && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (starting_balance !== undefined && !isNaN(Number(starting_balance)) && Number(starting_balance) >= 0) {
      updates.push('starting_balance = ?');
      params.push(Number(starting_balance));
    }

    if (currency && currency.trim()) {
      updates.push('currency = ?');
      params.push(currency.trim().toUpperCase());
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
        data: null
      });
    }

    params.push(userId);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedUser] = await query(
      'SELECT id, name, email, starting_balance, currency FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateProfile
};
