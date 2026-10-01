const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding realistic Forex demo data...');

    // Check if demo user already exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', ['trader@forex.com']);
    let userId;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`ℹ️ Demo user already exists with ID: ${userId}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const [userResult] = await query(
        'INSERT INTO users (name, email, password, starting_balance, currency) VALUES (?, ?, ?, ?, ?)',
        ['Alex Morgan', 'trader@forex.com', hashedPassword, 10000.00, 'USD']
      );
      userId = userResult.insertId;
      console.log(`✅ Demo user created with ID: ${userId}`);
    }

    // Check existing strategies
    const [existingStrategies] = await query('SELECT id FROM strategies WHERE user_id = ?', [userId]);
    let strategyMap = {};

    if (existingStrategies.length === 0) {
      const strategiesToInsert = [
        {
          name: 'Liquidity Sweep + FVG',
          description: 'Institutional ICT concept: identify Asian or London range liquidity sweeps followed by displacement and entry on 15M Fair Value Gap.',
          entry_rules: '1. Wait for high/low of previous session to be swept.\n2. Look for aggressive displacement creating an imbalance/FVG.\n3. Enter on retest of the FVG with tight invalidation.',
          exit_rules: 'Target next key liquidity pool (opposing swing high/low) with minimum 1:2 Risk/Reward. Move SL to breakeven after 1R.',
          risk_rules: 'Max 1.0% risk per trade. Never add to losing positions.',
          timeframes: '15M, 1H',
          sessions: 'London, New York',
          notes: 'High probability during London Open (07:00-09:00 UTC) and NY Open (13:00-15:00 UTC).'
        },
        {
          name: 'London Breakout',
          description: 'Capture momentum expansion when Frankfurt/London breaks out from the Asian consolidation range.',
          entry_rules: 'Mark Asian session high and low. Enter on 15M candle close outside the range with volume confirmation.',
          exit_rules: 'Target 1.5x to 2x the Asian range size, or exit at New York open.',
          risk_rules: 'Max 1.0% account risk. Stop loss placed at opposite side of breakout candle or mid-range.',
          timeframes: '15M, 5M',
          sessions: 'London',
          notes: 'Best on GBP/USD and EUR/USD when Asian range was tight (< 30 pips).'
        },
        {
          name: 'Order Block & Market Structure Shift',
          description: 'SMC strategy trading trend continuations after a clean Break of Structure (BOS) and return to unmitigated Order Block.',
          entry_rules: 'Higher timeframe trend must align. Wait for 15M Market Structure Shift, then limit order at 50% of the last opposing candle (Order Block).',
          exit_rules: 'TP at previous swing high/low. Trailing stop behind successive higher lows / lower highs.',
          risk_rules: '1.0% fixed risk. Avoid trading 15 minutes before high-impact Red Folder news.',
          timeframes: '1H, 15M',
          sessions: 'London, New York',
          notes: 'Works exceptionally well on XAU/USD and EUR/USD.'
        },
        {
          name: 'Daily Key Level Rejection',
          description: 'Higher timeframe swing strategy looking for pin-bar or engulfing candle rejections at major weekly/daily support & resistance.',
          entry_rules: 'Price taps daily horizontal support/resistance or major psychological figure (00 or 50 levels). Wait for 4H confirmation candle.',
          exit_rules: 'Target opposing daily zone or 1:3 RR.',
          risk_rules: '1.5% risk with wider stop loss to accommodate daily volatility.',
          timeframes: '4H, Daily',
          sessions: 'London, New York, Asian',
          notes: 'Patience required; generates 1-2 high-quality setups per week.'
        }
      ];

      for (const strat of strategiesToInsert) {
        const [res] = await query(
          `INSERT INTO strategies (user_id, name, description, entry_rules, exit_rules, risk_rules, timeframes, sessions, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, strat.name, strat.description, strat.entry_rules, strat.exit_rules, strat.risk_rules, strat.timeframes, strat.sessions, strat.notes]
        );
        strategyMap[strat.name] = res.insertId;
      }
      console.log('✅ Strategies seeded successfully.');
    } else {
      const [allStrats] = await query('SELECT id, name FROM strategies WHERE user_id = ?', [userId]);
      allStrats.forEach(s => { strategyMap[s.name] = s.id; });
    }

    // Check trades
    const [existingTrades] = await query('SELECT id FROM trades WHERE user_id = ?', [userId]);
    if (existingTrades.length === 0) {
      const tradesData = [
        {
          trade_date: '2026-09-02',
          pair: 'EUR/USD',
          direction: 'BUY',
          timeframe: '15M',
          session: 'London',
          strategy_id: strategyMap['Liquidity Sweep + FVG'],
          entry_price: 1.08250,
          stop_loss: 1.08050,
          take_profit: 1.08750,
          exit_price: 1.08750,
          lot_size: 1.00,
          risk_percentage: 1.00,
          risk_reward: '1:2.5',
          result: 'WIN',
          profit_loss: 250.00,
          setup_description: 'Asian low swept by 8 pips during London open, followed by a strong bullish displacement leaving an unfilled 15M FVG.',
          entry_reason: 'Limit order tapped into the upper boundary of the bullish FVG with confirmation of delta volume absorption.',
          exit_reason: 'Price reached the previous day high liquidity pool and hit take-profit order smoothly.',
          mistake: 'None. Executed exactly according to the trading plan.',
          lesson_learned: 'Patience to wait for the London open sweep instead of pre-positioning in Asian session paid off.',
          notes: 'Clean textbook institutional trade. Execution speed was great.'
        },
        {
          trade_date: '2026-09-04',
          pair: 'GBP/USD',
          direction: 'SELL',
          timeframe: '15M',
          session: 'London',
          strategy_id: strategyMap['London Breakout'],
          entry_price: 1.29800,
          stop_loss: 1.30050,
          take_profit: 1.29200,
          exit_price: 1.29200,
          lot_size: 0.80,
          risk_percentage: 1.00,
          risk_reward: '1:2.4',
          result: 'WIN',
          profit_loss: 240.00,
          setup_description: 'Asian consolidation was 22 pips. 07:30 London candle closed decisively below Asian low.',
          entry_reason: 'Market execution on candle close confirmation with stop loss 5 pips above the breakout candle high.',
          exit_reason: 'Targeted the S2 pivot point which offered a 1:2.4 risk to reward ratio.',
          mistake: 'Exited slightly early on some lot size, but overall disciplined.',
          lesson_learned: 'Cable shows clean momentum when London opens after low-volatility Asian ranges.',
          notes: 'High conviction trade.'
        },
        {
          trade_date: '2026-09-08',
          pair: 'USD/JPY',
          direction: 'BUY',
          timeframe: '1H',
          session: 'Asian',
          strategy_id: strategyMap['Order Block & Market Structure Shift'],
          entry_price: 154.200,
          stop_loss: 153.850,
          take_profit: 155.000,
          exit_price: 153.850,
          lot_size: 0.70,
          risk_percentage: 1.00,
          risk_reward: '1:2.3',
          result: 'LOSS',
          profit_loss: -100.00,
          setup_description: 'Bullish order block after market structure shift on 1H timeframe.',
          entry_reason: 'Limit order at 50% of the order block.',
          exit_reason: 'Bank of Japan official comments triggered unexpected yen buying, smashing through support.',
          mistake: 'Traded during early Tokyo morning without checking BOJ speaker schedule.',
          lesson_learned: 'Always cross-check Japanese central bank calendar when trading JPY crosses.',
          notes: 'Loss was contained to exactly 1% risk limit. Good risk control.'
        },
        {
          trade_date: '2026-09-11',
          pair: 'XAU/USD',
          direction: 'BUY',
          timeframe: '15M',
          session: 'New York',
          strategy_id: strategyMap['Liquidity Sweep + FVG'],
          entry_price: 2580.00,
          stop_loss: 2572.00,
          take_profit: 2604.00,
          exit_price: 2604.00,
          lot_size: 0.50,
          risk_percentage: 1.00,
          risk_reward: '1:3.0',
          result: 'WIN',
          profit_loss: 300.00,
          setup_description: 'Gold swept London session lows right at 13:30 NY cash open, rejected strongly with a massive 15M engulfing candle.',
          entry_reason: 'Retest of 15M FVG inside the discount zone (below 50% equilibrium).',
          exit_reason: 'Targeted psychological level $2600 and major buy-side liquidity.',
          mistake: 'None.',
          lesson_learned: 'Gold volatility at NY open provides extraordinary R:R when respecting higher timeframe discount zones.',
          notes: 'Best trade of the week.'
        },
        {
          trade_date: '2026-09-15',
          pair: 'EUR/USD',
          direction: 'SELL',
          timeframe: '1H',
          session: 'London',
          strategy_id: strategyMap['Order Block & Market Structure Shift'],
          entry_price: 1.08900,
          stop_loss: 1.09150,
          take_profit: 1.08300,
          exit_price: 1.08900,
          lot_size: 0.90,
          risk_percentage: 1.00,
          risk_reward: '1:2.4',
          result: 'BREAK EVEN',
          profit_loss: 0.00,
          setup_description: 'Bearish 1H order block mitigation after lower high formation.',
          entry_reason: 'Entered on retest of 1.0890 supply zone.',
          exit_reason: 'Price reached +1.2R, moved stop to breakeven, then ECB governor remarks caused sudden spike back to entry.',
          mistake: 'Moved stop loss to breakeven slightly too aggressively before structural low was taken out.',
          lesson_learned: 'Give trades breathing room; protect profit with trailing partials rather than choking the stop prematurely.',
          notes: 'Capital preserved.'
        },
        {
          trade_date: '2026-09-18',
          pair: 'GBP/USD',
          direction: 'BUY',
          timeframe: '15M',
          session: 'New York',
          strategy_id: strategyMap['Liquidity Sweep + FVG'],
          entry_price: 1.31200,
          stop_loss: 1.30950,
          take_profit: 1.31800,
          exit_price: 1.31800,
          lot_size: 0.85,
          risk_percentage: 1.00,
          risk_reward: '1:2.4',
          result: 'WIN',
          profit_loss: 204.00,
          setup_description: 'NY morning pullback into 1H bullish order block with 15M FVG confluence.',
          entry_reason: 'Bullish market structure shift on 5M inside the higher timeframe 15M FVG.',
          exit_reason: 'Take profit hit at daily high.',
          mistake: 'Hesitated on initial tap, entered 3 pips higher than optimal.',
          lesson_learned: 'Trust the predefined limit orders.',
          notes: 'Great follow-through.'
        },
        {
          trade_date: '2026-09-22',
          pair: 'EUR/USD',
          direction: 'SELL',
          timeframe: '4H',
          session: 'London',
          strategy_id: strategyMap['Daily Key Level Rejection'],
          entry_price: 1.09350,
          stop_loss: 1.09750,
          take_profit: 1.08150,
          exit_price: 1.08200,
          lot_size: 0.60,
          risk_percentage: 1.20,
          risk_reward: '1:3.0',
          result: 'WIN',
          profit_loss: 345.00,
          setup_description: 'Rejection pin bar off 1.0940 major weekly resistance zone.',
          entry_reason: '4H bearish pin bar closed with long upper wick rejecting key resistance.',
          exit_reason: 'Manual exit just before 1.0815 support when momentum slowed.',
          mistake: 'None. Held swing trade patiently for 3 sessions.',
          lesson_learned: 'Higher timeframe swings have much less noise and stress.',
          notes: 'Excellent swing trade.'
        },
        {
          trade_date: '2026-09-25',
          pair: 'XAU/USD',
          direction: 'SELL',
          timeframe: '15M',
          session: 'New York',
          strategy_id: strategyMap['Liquidity Sweep + FVG'],
          entry_price: 2632.00,
          stop_loss: 2639.00,
          take_profit: 2615.00,
          exit_price: 2639.00,
          lot_size: 0.40,
          risk_percentage: 1.00,
          risk_reward: '1:2.4',
          result: 'LOSS',
          profit_loss: -112.00,
          setup_description: 'Tried to fade the all-time-high rally expecting a liquidity sweep reversal.',
          entry_reason: 'Thought 2632 was a false breakout.',
          exit_reason: 'Stop loss triggered as gold continued parabolic upward trend.',
          mistake: 'Counter-trend trading during massive geopolitical momentum. Violated rule #2: never fight strong HTF trend without confirmed 1H shift.',
          lesson_learned: 'Do not pick tops on gold when higher timeframes are in pure discovery mode.',
          notes: 'Emotional entry triggered by FOMO. Must stick to rules.'
        },
        {
          trade_date: '2026-09-29',
          pair: 'AUD/USD',
          direction: 'BUY',
          timeframe: '1H',
          session: 'Asian',
          strategy_id: strategyMap['London Breakout'],
          entry_price: 0.67200,
          stop_loss: 0.66950,
          take_profit: 0.67750,
          exit_price: 0.67750,
          lot_size: 1.10,
          risk_percentage: 1.00,
          risk_reward: '1:2.2',
          result: 'WIN',
          profit_loss: 242.00,
          setup_description: 'RBA interest rate announcement held steady with hawkish tone. Clean breakout above Asian range.',
          entry_reason: 'Entered on 15M retest of the broken Asian high with confirmation.',
          exit_reason: 'Reached 1:2.2 take profit target cleanly during mid-session.',
          mistake: 'None.',
          lesson_learned: 'Fundamental catalysts aligned with technical breakouts have high follow-through probability.',
          notes: 'Smooth trade.'
        }
      ];

      for (const t of tradesData) {
        await query(
          `INSERT INTO trades (
            user_id, trade_date, pair, direction, timeframe, session, strategy_id,
            entry_price, stop_loss, take_profit, exit_price, lot_size, risk_percentage,
            risk_reward, result, profit_loss, setup_description, entry_reason,
            exit_reason, mistake, lesson_learned, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, t.trade_date, t.pair, t.direction, t.timeframe, t.session, t.strategy_id,
            t.entry_price, t.stop_loss, t.take_profit, t.exit_price, t.lot_size, t.risk_percentage,
            t.risk_reward, t.result, t.profit_loss, t.setup_description, t.entry_reason,
            t.exit_reason, t.mistake, t.lesson_learned, t.notes
          ]
        );
      }
      console.log('✅ Realistic trades seeded successfully.');
    }

    // Check backtesting sessions
    const [existingBT] = await query('SELECT id FROM backtesting_sessions WHERE user_id = ?', [userId]);
    if (existingBT.length === 0) {
      const [btResult] = await query(
        `INSERT INTO backtesting_sessions (
          user_id, strategy_id, pair, timeframe, session, testing_start_date, testing_end_date,
          total_trades, wins, losses, break_even, win_rate, total_r, average_r,
          starting_balance, ending_balance, max_drawdown, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          strategyMap['Liquidity Sweep + FVG'],
          'EUR/USD',
          '15M',
          'London',
          '2026-01-01',
          '2026-06-30',
          50,
          32,
          14,
          4,
          64.00,
          48.50,
          0.97,
          10000.00,
          13850.00,
          4.80,
          '6-month backtesting sample strictly adhering to London Open liquidity sweeps.'
        ]
      );

      const btId = btResult.insertId;

      await query(
        `INSERT INTO backtesting_reviews (
          backtesting_session_id, what_worked, what_failed, common_mistakes,
          observations, improvements, conclusion
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          btId,
          'Entering strictly after Asian session high/low was swept by at least 5 pips resulted in 72% win rate on those specific setups. Clean 15M displacement gave confident invalidation.',
          'Trades taken when Asian session range was wider than 45 pips failed 60% of the time due to lack of expansion momentum.',
          'Impatient entries before the 15M candle fully closed resulted in 3 avoidable stop-outs.',
          'Tuesdays and Thursdays produced the highest quality setups and largest directional moves.',
          'Add a strict filter: skip London breakout trades if Asian range is > 40 pips. Only take FVG entries with confluence at HTF discount/premium levels.',
          'The Liquidity Sweep + FVG strategy demonstrates an exceptional positive expectancy on EUR/USD with low drawdown (<5%). Ready for live disciplined execution.'
        ]
      );

      console.log('✅ Backtesting session & review seeded successfully.');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
