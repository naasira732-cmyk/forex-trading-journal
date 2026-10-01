const { query } = require('../config/db');
const { validateTradeInput } = require('../utils/validators');

/**
 * GET /api/trades
 * Retrieve filtered, searched, and sorted trades for the authenticated user
 */
const getTrades = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      pair,
      direction,
      strategy_id,
      session,
      timeframe,
      result,
      minPnl,
      maxPnl,
      search,
      sortBy = 'trade_date',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT
        t.id, t.user_id, t.trade_date, t.pair, t.direction, t.timeframe, t.session,
        t.strategy_id, t.entry_price, t.stop_loss, t.take_profit, t.exit_price,
        t.lot_size, t.risk_percentage, t.risk_reward, t.result, t.profit_loss,
        t.setup_description, t.entry_reason, t.exit_reason, t.mistake,
        t.lesson_learned, t.notes, t.created_at, t.updated_at,
        s.name as strategy_name
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      WHERE t.user_id = ?
    `;

    const params = [userId];

    if (startDate) {
      sql += ' AND t.trade_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.trade_date <= ?';
      params.push(endDate);
    }
    if (pair && pair.trim()) {
      sql += ' AND t.pair = ?';
      params.push(pair.trim().toUpperCase());
    }
    if (direction && direction.trim()) {
      sql += ' AND t.direction = ?';
      params.push(direction.trim().toUpperCase());
    }
    if (strategy_id && !isNaN(Number(strategy_id))) {
      sql += ' AND t.strategy_id = ?';
      params.push(Number(strategy_id));
    }
    if (session && session.trim()) {
      sql += ' AND t.session = ?';
      params.push(session.trim());
    }
    if (timeframe && timeframe.trim()) {
      sql += ' AND t.timeframe = ?';
      params.push(timeframe.trim());
    }
    if (result && result.trim()) {
      sql += ' AND t.result = ?';
      params.push(result.trim().toUpperCase());
    }
    if (minPnl !== undefined && minPnl !== '') {
      sql += ' AND t.profit_loss >= ?';
      params.push(Number(minPnl));
    }
    if (maxPnl !== undefined && maxPnl !== '') {
      sql += ' AND t.profit_loss <= ?';
      params.push(Number(maxPnl));
    }
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      sql += ` AND (
        t.pair LIKE ? OR 
        s.name LIKE ? OR 
        t.setup_description LIKE ? OR 
        t.entry_reason LIKE ? OR 
        t.exit_reason LIKE ? OR 
        t.mistake LIKE ? OR 
        t.lesson_learned LIKE ? OR 
        t.notes LIKE ?
      )`;
      for (let i = 0; i < 8; i++) {
        params.push(searchTerm);
      }
    }

    // Safe sorting columns
    const allowedSort = ['trade_date', 'pair', 'profit_loss', 'created_at', 'id'];
    const validSortBy = allowedSort.includes(sortBy) ? `t.${sortBy}` : 't.trade_date';
    const validSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${validSortBy} ${validSortOrder}, t.id DESC`;

    const [trades] = await query(sql, params);

    res.status(200).json({
      success: true,
      message: 'Trades retrieved successfully.',
      data: trades
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trades/:id
 */
const getTradeById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tradeId = req.params.id;

    const sql = `
      SELECT 
        t.*,
        s.name as strategy_name,
        s.description as strategy_description
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      WHERE t.id = ? AND t.user_id = ?
    `;

    const [rows] = await query(sql, [tradeId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or access denied.',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trade retrieved successfully.',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trades
 */
const createTrade = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validation = validateTradeInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        data: null
      });
    }

    const {
      trade_date,
      pair,
      direction,
      timeframe,
      session,
      strategy_id,
      entry_price,
      stop_loss,
      take_profit,
      exit_price,
      lot_size,
      risk_percentage,
      risk_reward,
      result,
      profit_loss,
      setup_description,
      entry_reason,
      exit_reason,
      mistake,
      lesson_learned,
      notes,
      image_data
    } = req.body;

    // Verify strategy belongs to user if strategy_id is provided
    let verifiedStrategyId = null;
    if (strategy_id && Number(strategy_id) > 0) {
      const [strat] = await query('SELECT id FROM strategies WHERE id = ? AND user_id = ?', [strategy_id, userId]);
      if (strat.length > 0) {
        verifiedStrategyId = Number(strategy_id);
      }
    }

    // Auto calculate R:R if not explicitly provided
    let calculatedRR = risk_reward;
    if (!calculatedRR && entry_price && stop_loss && take_profit) {
      const risk = Math.abs(Number(entry_price) - Number(stop_loss));
      const reward = Math.abs(Number(take_profit) - Number(entry_price));
      if (risk > 0) {
        const ratio = Math.round((reward / risk) * 100) / 100;
        calculatedRR = `1:${ratio}`;
      }
    }

    const sql = `
      INSERT INTO trades (
        user_id, trade_date, pair, direction, timeframe, session, strategy_id,
        entry_price, stop_loss, take_profit, exit_price, lot_size, risk_percentage,
        risk_reward, result, profit_loss, setup_description, entry_reason,
        exit_reason, mistake, lesson_learned, notes, image_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      trade_date,
      pair.trim().toUpperCase(),
      direction.trim().toUpperCase(),
      timeframe.trim(),
      session.trim(),
      verifiedStrategyId,
      Number(entry_price),
      Number(stop_loss),
      Number(take_profit),
      exit_price !== undefined && exit_price !== '' ? Number(exit_price) : null,
      lot_size !== undefined && lot_size !== '' ? Number(lot_size) : null,
      risk_percentage !== undefined && risk_percentage !== '' ? Number(risk_percentage) : null,
      calculatedRR || null,
      result.trim().toUpperCase(),
      Number(profit_loss),
      setup_description || null,
      entry_reason || null,
      exit_reason || null,
      mistake || null,
      lesson_learned || null,
      notes || null,
      image_data || null
    ];

    const [insertResult] = await query(sql, params);
    const newTradeId = insertResult.insertId;

    const [newTrade] = await query(
      `SELECT t.*, s.name as strategy_name FROM trades t LEFT JOIN strategies s ON t.strategy_id = s.id WHERE t.id = ?`,
      [newTradeId]
    );

    res.status(201).json({
      success: true,
      message: 'Trade created successfully',
      data: newTrade[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trades/:id
 */
const updateTrade = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tradeId = req.params.id;

    // Verify ownership
    const [existing] = await query('SELECT id FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or access denied.',
        data: null
      });
    }

    const validation = validateTradeInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        data: null
      });
    }

    const {
      trade_date,
      pair,
      direction,
      timeframe,
      session,
      strategy_id,
      entry_price,
      stop_loss,
      take_profit,
      exit_price,
      lot_size,
      risk_percentage,
      risk_reward,
      result,
      profit_loss,
      setup_description,
      entry_reason,
      exit_reason,
      mistake,
      lesson_learned,
      notes,
      image_data
    } = req.body;

    let verifiedStrategyId = null;
    if (strategy_id && Number(strategy_id) > 0) {
      const [strat] = await query('SELECT id FROM strategies WHERE id = ? AND user_id = ?', [strategy_id, userId]);
      if (strat.length > 0) {
        verifiedStrategyId = Number(strategy_id);
      }
    }

    let calculatedRR = risk_reward;
    if (!calculatedRR && entry_price && stop_loss && take_profit) {
      const risk = Math.abs(Number(entry_price) - Number(stop_loss));
      const reward = Math.abs(Number(take_profit) - Number(entry_price));
      if (risk > 0) {
        const ratio = Math.round((reward / risk) * 100) / 100;
        calculatedRR = `1:${ratio}`;
      }
    }

    const sql = `
      UPDATE trades SET
        trade_date = ?, pair = ?, direction = ?, timeframe = ?, session = ?, strategy_id = ?,
        entry_price = ?, stop_loss = ?, take_profit = ?, exit_price = ?, lot_size = ?,
        risk_percentage = ?, risk_reward = ?, result = ?, profit_loss = ?, setup_description = ?,
        entry_reason = ?, exit_reason = ?, mistake = ?, lesson_learned = ?, notes = ?,
        image_data = CASE WHEN ? THEN ? ELSE image_data END
      WHERE id = ? AND user_id = ?
    `;

    const params = [
      trade_date,
      pair.trim().toUpperCase(),
      direction.trim().toUpperCase(),
      timeframe.trim(),
      session.trim(),
      verifiedStrategyId,
      Number(entry_price),
      Number(stop_loss),
      Number(take_profit),
      exit_price !== undefined && exit_price !== '' ? Number(exit_price) : null,
      lot_size !== undefined && lot_size !== '' ? Number(lot_size) : null,
      risk_percentage !== undefined && risk_percentage !== '' ? Number(risk_percentage) : null,
      calculatedRR || null,
      result.trim().toUpperCase(),
      Number(profit_loss),
      setup_description || null,
      entry_reason || null,
      exit_reason || null,
      mistake || null,
      lesson_learned || null,
      notes || null,
      Object.prototype.hasOwnProperty.call(req.body, 'image_data'),
      image_data || null,
      tradeId,
      userId
    ];

    await query(sql, params);

    const [updatedTrade] = await query(
      `SELECT t.*, s.name as strategy_name FROM trades t LEFT JOIN strategies s ON t.strategy_id = s.id WHERE t.id = ?`,
      [tradeId]
    );

    res.status(200).json({
      success: true,
      message: 'Trade updated successfully',
      data: updatedTrade[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trades/:id
 */
const deleteTrade = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tradeId = req.params.id;

    const [existing] = await query('SELECT id FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or access denied.',
        data: null
      });
    }

    await query('DELETE FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);

    res.status(200).json({
      success: true,
      message: 'Trade deleted successfully',
      data: { id: Number(tradeId) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade
};
