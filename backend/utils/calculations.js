/**
 * Financial and trading statistical calculation utilities
 */

/**
 * Calculate trade statistics from an array of trades sorted by date/id
 * @param {Array} trades List of trade objects
 * @param {number} startingBalance Initial account balance
 */
function calculateTradingStats(trades = [], startingBalance = 10000) {
  if (!trades || trades.length === 0) {
    return {
      hasData: false,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: null,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      startingBalance: Number(startingBalance),
      currentBalance: Number(startingBalance),
      profitFactor: null,
      averageWin: null,
      averageLoss: null,
      averageRR: null,
      maxDrawdownAmount: 0,
      maxDrawdownPercentage: 0,
      maxWinningStreak: 0,
      maxLosingStreak: 0,
      currentWinningStreak: 0,
      currentLosingStreak: 0,
      equityCurve: []
    };
  }

  let totalTrades = trades.length;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let totalProfit = 0; // gross win amount
  let totalLoss = 0;   // gross loss amount (positive number)
  let netProfit = 0;
  let totalR = 0;
  let validRCount = 0;

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  let runningBalance = Number(startingBalance);
  let peakBalance = runningBalance;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercentage = 0;

  const equityCurve = [
    {
      tradeIndex: 0,
      date: trades[0].trade_date,
      balance: runningBalance,
      pnl: 0,
      drawdown: 0
    }
  ];

  trades.forEach((trade, index) => {
    const pnl = Number(trade.profit_loss) || 0;
    netProfit += pnl;
    runningBalance += pnl;

    // Track peak and drawdown
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }
    const currentDrawdownAmount = peakBalance - runningBalance;
    const currentDrawdownPct = peakBalance > 0 ? (currentDrawdownAmount / peakBalance) * 100 : 0;

    if (currentDrawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = currentDrawdownAmount;
    }
    if (currentDrawdownPct > maxDrawdownPercentage) {
      maxDrawdownPercentage = currentDrawdownPct;
    }

    equityCurve.push({
      tradeIndex: index + 1,
      tradeId: trade.id,
      date: trade.trade_date,
      balance: Math.round(runningBalance * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      drawdown: Math.round(currentDrawdownPct * 100) / 100
    });

    // Result categorizations
    const res = (trade.result || '').toUpperCase();
    if (res === 'WIN' || pnl > 0) {
      winningTrades++;
      totalProfit += pnl;
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (res === 'LOSS' || pnl < 0) {
      losingTrades++;
      totalLoss += Math.abs(pnl);
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      breakEvenTrades++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    // Risk / Reward parser
    if (trade.risk_reward) {
      // E.g. "1:2.5" or "2.5" or "1:2"
      let rrVal = 0;
      const parts = String(trade.risk_reward).split(':');
      if (parts.length === 2 && Number(parts[0]) > 0) {
        rrVal = Number(parts[1]) / Number(parts[0]);
      } else if (!isNaN(Number(trade.risk_reward))) {
        rrVal = Number(trade.risk_reward);
      }
      if (!isNaN(rrVal) && rrVal > 0) {
        totalR += rrVal;
        validRCount++;
      }
    }
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const profitFactor = totalLoss > 0 
    ? (totalProfit / totalLoss) 
    : (totalProfit > 0 ? 999.99 : 0);
  const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
  const averageRR = validRCount > 0 ? totalR / validRCount : (averageLoss > 0 ? averageWin / averageLoss : 0);

  return {
    hasData: true,
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate: Math.round(winRate * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    startingBalance: Number(startingBalance),
    currentBalance: Math.round(runningBalance * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    averageRR: Math.round(averageRR * 100) / 100,
    maxDrawdownAmount: Math.round(maxDrawdownAmount * 100) / 100,
    maxDrawdownPercentage: Math.round(maxDrawdownPercentage * 100) / 100,
    maxWinningStreak: maxWinStreak,
    maxLosingStreak: maxLossStreak,
    currentWinningStreak: currentWinStreak,
    currentLosingStreak: currentLossStreak,
    equityCurve
  };
}

module.exports = {
  calculateTradingStats
};
