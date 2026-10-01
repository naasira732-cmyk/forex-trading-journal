const { query } = require('../config/db');
const { calculateTradingStats } = require('../utils/calculations');

/**
 * GET /api/analytics/overview
 * Account statistics and equity performance
 */
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user starting balance
    const [userRows] = await query('SELECT starting_balance, currency FROM users WHERE id = ?', [userId]);
    const startingBalance = userRows.length > 0 ? Number(userRows[0].starting_balance) : 10000;
    const currency = userRows.length > 0 ? userRows[0].currency : 'USD';

    // Fetch all trades sorted chronologically
    const [trades] = await query(
      `SELECT id, trade_date, pair, direction, timeframe, session, 
              risk_reward, result, profit_loss, created_at 
       FROM trades 
       WHERE user_id = ? 
       ORDER BY trade_date ASC, id ASC`,
      [userId]
    );

    const stats = calculateTradingStats(trades, startingBalance);

    res.status(200).json({
      success: true,
      message: 'Overview analytics calculated successfully.',
      data: {
        ...stats,
        currency
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/pairs
 * Performance metrics broken down by currency pair
 */
const getPerformanceByPair = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        pair,
        COUNT(*) as total_trades,
        SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as gross_loss,
        SUM(profit_loss) as net_result
      FROM trades
      WHERE user_id = ?
      GROUP BY pair
      ORDER BY total_trades DESC, net_result DESC
    `;

    const [rows] = await query(sql, [userId]);

    const formatted = rows.map(r => {
      const total = Number(r.total_trades) || 0;
      const wins = Number(r.wins) || 0;
      const losses = Number(r.losses) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const grossProfit = Number(r.gross_profit) || 0;
      const grossLoss = Number(r.gross_loss) || 0;
      const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 999.99 : 0);

      return {
        pair: r.pair,
        total_trades: total,
        wins,
        losses,
        break_even: Number(r.break_even) || 0,
        win_rate: winRate,
        gross_profit: Math.round(grossProfit * 100) / 100,
        gross_loss: Math.round(grossLoss * 100) / 100,
        net_result: Math.round(Number(r.net_result) * 100) / 100,
        profit_factor: profitFactor
      };
    });

    res.status(200).json({
      success: true,
      message: 'Pair performance retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/strategies
 * Performance metrics broken down by strategy
 */
const getPerformanceByStrategy = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        COALESCE(s.name, 'No Strategy / Discretionary') as strategy_name,
        s.id as strategy_id,
        COUNT(t.id) as total_trades,
        SUM(CASE WHEN t.result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN t.result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN t.result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        SUM(t.profit_loss) as net_profit,
        SUM(CASE WHEN t.profit_loss > 0 THEN t.profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN t.profit_loss < 0 THEN ABS(t.profit_loss) ELSE 0 END) as gross_loss
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      WHERE t.user_id = ?
      GROUP BY s.id, s.name
      ORDER BY total_trades DESC, net_profit DESC
    `;

    const [rows] = await query(sql, [userId]);

    // Also calculate Total R and Avg R for each strategy
    const formatted = [];
    for (const r of rows) {
      const total = Number(r.total_trades) || 0;
      const wins = Number(r.wins) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const grossProfit = Number(r.gross_profit) || 0;
      const grossLoss = Number(r.gross_loss) || 0;
      const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 999.99 : 0);

      formatted.push({
        strategy_name: r.strategy_name,
        strategy_id: r.strategy_id,
        total_trades: total,
        wins,
        losses: Number(r.losses) || 0,
        break_even: Number(r.break_even) || 0,
        win_rate: winRate,
        net_profit: Math.round(Number(r.net_profit) * 100) / 100,
        profit_factor: profitFactor
      });
    }

    res.status(200).json({
      success: true,
      message: 'Strategy performance retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/sessions
 * Performance metrics broken down by trading session
 */
const getPerformanceBySession = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        session,
        COUNT(*) as total_trades,
        SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        SUM(profit_loss) as net_profit,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as gross_loss
      FROM trades
      WHERE user_id = ?
      GROUP BY session
      ORDER BY total_trades DESC
    `;

    const [rows] = await query(sql, [userId]);

    const formatted = rows.map(r => {
      const total = Number(r.total_trades) || 0;
      const wins = Number(r.wins) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const grossProfit = Number(r.gross_profit) || 0;
      const grossLoss = Number(r.gross_loss) || 0;
      const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 999.99 : 0);

      return {
        session: r.session,
        total_trades: total,
        wins,
        losses: Number(r.losses) || 0,
        break_even: Number(r.break_even) || 0,
        win_rate: winRate,
        net_profit: Math.round(Number(r.net_profit) * 100) / 100,
        profit_factor: profitFactor
      };
    });

    res.status(200).json({
      success: true,
      message: 'Session performance retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/timeframes
 * Performance metrics broken down by timeframe
 */
const getPerformanceByTimeframe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        timeframe,
        COUNT(*) as total_trades,
        SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        SUM(profit_loss) as net_profit,
        SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as gross_profit,
        SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as gross_loss
      FROM trades
      WHERE user_id = ?
      GROUP BY timeframe
      ORDER BY total_trades DESC
    `;

    const [rows] = await query(sql, [userId]);

    const formatted = rows.map(r => {
      const total = Number(r.total_trades) || 0;
      const wins = Number(r.wins) || 0;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const grossProfit = Number(r.gross_profit) || 0;
      const grossLoss = Number(r.gross_loss) || 0;
      const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 999.99 : 0);

      return {
        timeframe: r.timeframe,
        total_trades: total,
        wins,
        losses: Number(r.losses) || 0,
        break_even: Number(r.break_even) || 0,
        win_rate: winRate,
        net_profit: Math.round(Number(r.net_profit) * 100) / 100,
        profit_factor: profitFactor
      };
    });

    res.status(200).json({
      success: true,
      message: 'Timeframe performance retrieved successfully.',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/calendar
 * Calendar activity by date with month filtering
 */
const getCalendar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    let sql = `
      SELECT 
        DATE_FORMAT(trade_date, '%Y-%m-%d') as trade_date,
        COUNT(*) as total_trades,
        SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'BREAK EVEN' THEN 1 ELSE 0 END) as break_even,
        SUM(profit_loss) as net_profit
      FROM trades
      WHERE user_id = ?
    `;

    const params = [userId];

    if (year && month) {
      const paddedMonth = String(month).padStart(2, '0');
      const start = `${year}-${paddedMonth}-01`;
      // calculate last day of month
      const end = `${year}-${paddedMonth}-31`;
      sql += ' AND trade_date >= ? AND trade_date <= ?';
      params.push(start, end);
    }

    sql += ' GROUP BY trade_date ORDER BY trade_date ASC';

    const [rows] = await query(sql, params);

    // Also get trades list for that period to allow quick drill down
    let tradesSql = `
      SELECT t.*, s.name as strategy_name 
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      WHERE t.user_id = ?
    `;
    const tradeParams = [userId];
    if (year && month) {
      const paddedMonth = String(month).padStart(2, '0');
      tradesSql += ' AND t.trade_date >= ? AND t.trade_date <= ?';
      tradeParams.push(`${year}-${paddedMonth}-01`, `${year}-${paddedMonth}-31`);
    }
    tradesSql += ' ORDER BY t.trade_date DESC, t.id DESC';

    const [trades] = await query(tradesSql, tradeParams);

    const formattedDays = rows.map(r => ({
      date: r.trade_date,
      total_trades: Number(r.total_trades),
      wins: Number(r.wins),
      losses: Number(r.losses),
      break_even: Number(r.break_even),
      net_profit: Math.round(Number(r.net_profit) * 100) / 100
    }));

    res.status(200).json({
      success: true,
      message: 'Calendar data retrieved successfully.',
      data: {
        days: formattedDays,
        trades
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getPerformanceByPair,
  getPerformanceByStrategy,
  getPerformanceBySession,
  getPerformanceByTimeframe,
  getCalendar
};
