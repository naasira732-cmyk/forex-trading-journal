const { query } = require('../config/db');
const { validateBacktestingInput } = require('../utils/validators');

/**
 * GET /api/backtesting
 */
const getBacktestingSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        b.*,
        s.name as strategy_name
      FROM backtesting_sessions b
      LEFT JOIN strategies s ON b.strategy_id = s.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC, b.id DESC
    `;

    const [sessions] = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      message: 'Backtesting sessions retrieved successfully.',
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/backtesting/:id
 */
const getBacktestingSessionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const sessionSql = `
      SELECT 
        b.*,
        s.name as strategy_name,
        s.description as strategy_description
      FROM backtesting_sessions b
      LEFT JOIN strategies s ON b.strategy_id = s.id
      WHERE b.id = ? AND b.user_id = ?
    `;

    const [sessions] = await query(sessionSql, [sessionId, userId]);

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backtesting session not found or access denied.',
        data: null
      });
    }

    const session = sessions[0];

    // Fetch review
    const [reviews] = await query(
      'SELECT * FROM backtesting_reviews WHERE backtesting_session_id = ?',
      [sessionId]
    );

    res.status(200).json({
      success: true,
      message: 'Backtesting session retrieved successfully.',
      data: {
        ...session,
        review: reviews.length > 0 ? reviews[0] : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backtesting
 */
const createBacktestingSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validation = validateBacktestingInput(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(' '),
        data: null
      });
    }

    const {
      strategy_id,
      pair,
      timeframe,
      session,
      testing_start_date,
      testing_end_date,
      total_trades = 0,
      wins = 0,
      losses = 0,
      break_even = 0,
      win_rate,
      total_r = 0,
      average_r = 0,
      starting_balance = 10000,
      ending_balance = 10000,
      max_drawdown = 0,
      notes,
      review
    } = req.body;

    // Verify strategy belongs to user
    let verifiedStrategyId = null;
    if (strategy_id && Number(strategy_id) > 0) {
      const [strat] = await query('SELECT id FROM strategies WHERE id = ? AND user_id = ?', [strategy_id, userId]);
      if (strat.length > 0) {
        verifiedStrategyId = Number(strategy_id);
      }
    }

    // Auto-calculate win rate if not given
    const numTotal = Number(total_trades) || 0;
    const numWins = Number(wins) || 0;
    const computedWinRate = win_rate !== undefined && win_rate !== '' 
      ? Number(win_rate) 
      : (numTotal > 0 ? Math.round((numWins / numTotal) * 1000) / 10 : 0);

    const numTotalR = Number(total_r) || 0;
    const computedAvgR = average_r !== undefined && average_r !== ''
      ? Number(average_r)
      : (numTotal > 0 ? Math.round((numTotalR / numTotal) * 100) / 100 : 0);

    const sessionSql = `
      INSERT INTO backtesting_sessions (
        user_id, strategy_id, pair, timeframe, session, testing_start_date,
        testing_end_date, total_trades, wins, losses, break_even, win_rate,
        total_r, average_r, starting_balance, ending_balance, max_drawdown, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sessionParams = [
      userId,
      verifiedStrategyId,
      pair.trim().toUpperCase(),
      timeframe.trim(),
      session ? session.trim() : null,
      testing_start_date || null,
      testing_end_date || null,
      numTotal,
      numWins,
      Number(losses) || 0,
      Number(break_even) || 0,
      computedWinRate,
      numTotalR,
      computedAvgR,
      Number(starting_balance) || 10000,
      Number(ending_balance) || 10000,
      Number(max_drawdown) || 0,
      notes || null
    ];

    const [insertResult] = await query(sessionSql, sessionParams);
    const newSessionId = insertResult.insertId;

    // Insert review if provided
    if (review) {
      const reviewSql = `
        INSERT INTO backtesting_reviews (
          backtesting_session_id, what_worked, what_failed, common_mistakes,
          observations, improvements, conclusion
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await query(reviewSql, [
        newSessionId,
        review.what_worked || null,
        review.what_failed || null,
        review.common_mistakes || null,
        review.observations || null,
        review.improvements || null,
        review.conclusion || null
      ]);
    }

    const [newSession] = await query(
      'SELECT b.*, s.name as strategy_name FROM backtesting_sessions b LEFT JOIN strategies s ON b.strategy_id = s.id WHERE b.id = ?',
      [newSessionId]
    );

    res.status(201).json({
      success: true,
      message: 'Backtesting session created successfully.',
      data: newSession[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/backtesting/:id
 */
const updateBacktestingSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const [existing] = await query(
      'SELECT id FROM backtesting_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backtesting session not found or access denied.',
        data: null
      });
    }

    const {
      strategy_id,
      pair,
      timeframe,
      session,
      testing_start_date,
      testing_end_date,
      total_trades = 0,
      wins = 0,
      losses = 0,
      break_even = 0,
      win_rate,
      total_r = 0,
      average_r = 0,
      starting_balance = 10000,
      ending_balance = 10000,
      max_drawdown = 0,
      notes,
      review
    } = req.body;

    let verifiedStrategyId = null;
    if (strategy_id && Number(strategy_id) > 0) {
      const [strat] = await query('SELECT id FROM strategies WHERE id = ? AND user_id = ?', [strategy_id, userId]);
      if (strat.length > 0) {
        verifiedStrategyId = Number(strategy_id);
      }
    }

    const numTotal = Number(total_trades) || 0;
    const numWins = Number(wins) || 0;
    const computedWinRate = win_rate !== undefined && win_rate !== ''
      ? Number(win_rate)
      : (numTotal > 0 ? Math.round((numWins / numTotal) * 1000) / 10 : 0);

    const numTotalR = Number(total_r) || 0;
    const computedAvgR = average_r !== undefined && average_r !== ''
      ? Number(average_r)
      : (numTotal > 0 ? Math.round((numTotalR / numTotal) * 100) / 100 : 0);

    const updateSql = `
      UPDATE backtesting_sessions SET
        strategy_id = ?, pair = ?, timeframe = ?, session = ?,
        testing_start_date = ?, testing_end_date = ?, total_trades = ?,
        wins = ?, losses = ?, break_even = ?, win_rate = ?, total_r = ?,
        average_r = ?, starting_balance = ?, ending_balance = ?,
        max_drawdown = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `;

    const updateParams = [
      verifiedStrategyId,
      pair.trim().toUpperCase(),
      timeframe.trim(),
      session ? session.trim() : null,
      testing_start_date || null,
      testing_end_date || null,
      numTotal,
      numWins,
      Number(losses) || 0,
      Number(break_even) || 0,
      computedWinRate,
      numTotalR,
      computedAvgR,
      Number(starting_balance) || 10000,
      Number(ending_balance) || 10000,
      Number(max_drawdown) || 0,
      notes || null,
      sessionId,
      userId
    ];

    await query(updateSql, updateParams);

    // Upsert review
    if (review) {
      const [existingReview] = await query(
        'SELECT id FROM backtesting_reviews WHERE backtesting_session_id = ?',
        [sessionId]
      );

      if (existingReview.length > 0) {
        await query(
          `UPDATE backtesting_reviews SET
            what_worked = ?, what_failed = ?, common_mistakes = ?,
            observations = ?, improvements = ?, conclusion = ?
           WHERE backtesting_session_id = ?`,
          [
            review.what_worked || null,
            review.what_failed || null,
            review.common_mistakes || null,
            review.observations || null,
            review.improvements || null,
            review.conclusion || null,
            sessionId
          ]
        );
      } else {
        await query(
          `INSERT INTO backtesting_reviews (
            backtesting_session_id, what_worked, what_failed, common_mistakes,
            observations, improvements, conclusion
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            review.what_worked || null,
            review.what_failed || null,
            review.common_mistakes || null,
            review.observations || null,
            review.improvements || null,
            review.conclusion || null
          ]
        );
      }
    }

    const [updated] = await query(
      'SELECT b.*, s.name as strategy_name FROM backtesting_sessions b LEFT JOIN strategies s ON b.strategy_id = s.id WHERE b.id = ?',
      [sessionId]
    );

    res.status(200).json({
      success: true,
      message: 'Backtesting session updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/backtesting/:id
 */
const deleteBacktestingSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const [existing] = await query(
      'SELECT id FROM backtesting_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Backtesting session not found or access denied.',
        data: null
      });
    }

    await query('DELETE FROM backtesting_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);

    res.status(200).json({
      success: true,
      message: 'Backtesting session deleted successfully.',
      data: { id: Number(sessionId) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBacktestingSessions,
  getBacktestingSessionById,
  createBacktestingSession,
  updateBacktestingSession,
  deleteBacktestingSession
};
