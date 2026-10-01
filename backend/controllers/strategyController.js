const { query } = require('../config/db');
const { validateStrategyInput } = require('../utils/validators');

/**
 * GET /api/strategies
 * Fetch all strategies for logged-in user with associated trade metrics
 */
const getStrategies = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Join with trades to get total trades, wins, losses, and net P/L for each strategy
    const sql = `
      SELECT 
        s.*,
        COUNT(t.id) as total_trades,
        SUM(CASE WHEN t.result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN t.result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN t.result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        COALESCE(SUM(t.profit_loss), 0) as net_profit
      FROM strategies s
      LEFT JOIN trades t ON s.id = t.strategy_id AND t.user_id = ?
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.name ASC
    `;

    const [strategies] = await query(sql, [userId, userId]);

    // Format metrics
    const formatted = strategies.map(s => {
      const total = Number(s.total_trades) || 0;
      const wins = Number(s.wins) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      return {
        ...s,
        total_trades: total,
        wins,
        losses: Number(s.losses) || 0,
        break_even: Number(s.break_even) || 0,
        win_rate: winRate,
        net_profit: Math.round(Number(s.net_profit) * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      message: 'Strategies fetched successfully.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/strategies/:id
 * Get single strategy with its detailed trade history
 */
const getStrategyById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const strategyId = req.params.id;

    const [rows] = await query(
      'SELECT * FROM strategies WHERE id = ? AND user_id = ?',
      [strategyId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found.',
        data: null
      });
    }

    const strategy = rows[0];

    // Fetch trades using this strategy
    const [trades] = await query(
      'SELECT * FROM trades WHERE strategy_id = ? AND user_id = ? ORDER BY trade_date DESC, id DESC',
      [strategyId, userId]
    );

    const total = trades.length;
    const wins = trades.filter(t => t.result === 'WIN').length;
    const losses = trades.filter(t => t.result === 'LOSS').length;
    const breakEven = trades.filter(t => t.result === 'BREAK EVEN').length;
    const netProfit = trades.reduce((acc, t) => acc + Number(t.profit_loss), 0);
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

    res.status(200).json({
      success: true,
      message: 'Strategy retrieved successfully.',
      data: {
        ...strategy,
        metrics: {
          total_trades: total,
          wins,
          losses,
          break_even: breakEven,
          win_rate: winRate,
          net_profit: Math.round(netProfit * 100) / 100
        },
        trades
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/strategies
 * Create a new custom strategy
 */
const createStrategy = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validation = validateStrategyInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        data: null
      });
    }

    const {
      name,
      description,
      entry_rules,
      exit_rules,
      risk_rules,
      timeframes,
      sessions,
      notes
    } = req.body;

    const [result] = await query(
      `INSERT INTO strategies 
        (user_id, name, description, entry_rules, exit_rules, risk_rules, timeframes, sessions, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        description || null,
        entry_rules || null,
        exit_rules || null,
        risk_rules || null,
        timeframes || null,
        sessions || null,
        notes || null
      ]
    );

    const [newStrategy] = await query('SELECT * FROM strategies WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Strategy created successfully.',
      data: newStrategy[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/strategies/:id
 * Update an existing strategy
 */
const updateStrategy = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const strategyId = req.params.id;

    // Check ownership
    const [existing] = await query(
      'SELECT id FROM strategies WHERE id = ? AND user_id = ?',
      [strategyId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found or access denied.',
        data: null
      });
    }

    const {
      name,
      description,
      entry_rules,
      exit_rules,
      risk_rules,
      timeframes,
      sessions,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Strategy name cannot be empty.',
        data: null
      });
    }

    await query(
      `UPDATE strategies SET 
        name = ?, description = ?, entry_rules = ?, exit_rules = ?, 
        risk_rules = ?, timeframes = ?, sessions = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        name.trim(),
        description || null,
        entry_rules || null,
        exit_rules || null,
        risk_rules || null,
        timeframes || null,
        sessions || null,
        notes || null,
        strategyId,
        userId
      ]
    );

    const [updated] = await query('SELECT * FROM strategies WHERE id = ?', [strategyId]);

    res.status(200).json({
      success: true,
      message: 'Strategy updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/strategies/:id
 */
const deleteStrategy = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const strategyId = req.params.id;

    const [existing] = await query(
      'SELECT id FROM strategies WHERE id = ? AND user_id = ?',
      [strategyId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found or access denied.',
        data: null
      });
    }

    await query('DELETE FROM strategies WHERE id = ? AND user_id = ?', [strategyId, userId]);

    res.status(200).json({
      success: true,
      message: 'Strategy deleted successfully.',
      data: { id: Number(strategyId) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy
};
