/**
 * Input validation helpers
 */

function validateTradeInput(body) {
  const errors = [];

  if (body.image_data !== undefined && body.image_data !== null && body.image_data !== '') {
    const validImage = typeof body.image_data === 'string'
      && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image_data)
      && body.image_data.length <= 2000000;
    if (!validImage) {
      errors.push('Trade image must be a JPEG, PNG, or WebP image smaller than 2 MB after compression.');
    }
  }

  if (!body.trade_date || isNaN(Date.parse(body.trade_date))) {
    errors.push('Trade date is required and must be a valid date.');
  }

  if (!body.pair || typeof body.pair !== 'string' || body.pair.trim() === '') {
    errors.push('Currency pair is required (e.g., EUR/USD).');
  }

  const validDirections = ['BUY', 'SELL'];
  if (!body.direction || !validDirections.includes(String(body.direction).toUpperCase())) {
    errors.push('Direction must be either BUY or SELL.');
  }

  if (!body.timeframe || typeof body.timeframe !== 'string' || body.timeframe.trim() === '') {
    errors.push('Timeframe is required (e.g., 15M, 1H).');
  }

  if (!body.session || typeof body.session !== 'string' || body.session.trim() === '') {
    errors.push('Trading session is required (e.g., London, New York).');
  }

  if (body.entry_price === undefined || body.entry_price === null || isNaN(Number(body.entry_price)) || Number(body.entry_price) <= 0) {
    errors.push('Entry price must be a valid positive number.');
  }

  if (body.stop_loss === undefined || body.stop_loss === null || isNaN(Number(body.stop_loss)) || Number(body.stop_loss) <= 0) {
    errors.push('Stop loss must be a valid positive number.');
  }

  if (body.take_profit === undefined || body.take_profit === null || isNaN(Number(body.take_profit)) || Number(body.take_profit) <= 0) {
    errors.push('Take profit must be a valid positive number.');
  }

  const validResults = ['WIN', 'LOSS', 'BREAK EVEN'];
  if (!body.result || !validResults.includes(String(body.result).toUpperCase())) {
    errors.push('Result must be WIN, LOSS, or BREAK EVEN.');
  }

  if (body.profit_loss === undefined || body.profit_loss === null || isNaN(Number(body.profit_loss))) {
    errors.push('Profit/Loss amount is required and must be a valid number.');
  }

  if (body.risk_percentage !== undefined && body.risk_percentage !== null && body.risk_percentage !== '') {
    if (isNaN(Number(body.risk_percentage)) || Number(body.risk_percentage) < 0) {
      errors.push('Risk percentage cannot be negative.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateStrategyInput(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('Strategy name is required.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateBacktestingInput(body) {
  const errors = [];
  if (!body.pair || typeof body.pair !== 'string' || body.pair.trim() === '') {
    errors.push('Pair is required.');
  }
  if (!body.timeframe || typeof body.timeframe !== 'string' || body.timeframe.trim() === '') {
    errors.push('Timeframe is required.');
  }
  if (body.total_trades !== undefined && (isNaN(Number(body.total_trades)) || Number(body.total_trades) < 0)) {
    errors.push('Total trades must be a non-negative number.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTradeInput,
  validateStrategyInput,
  validateBacktestingInput
};
