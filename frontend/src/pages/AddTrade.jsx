import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_LENGTH = 2000000;

const compressTradeImage = async (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Choose an image smaller than 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not process this image. Try another file.');

  const imageData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(blob);
  });
  if (imageData.length > MAX_COMPRESSED_IMAGE_LENGTH) {
    throw new Error('Compressed image is too large. Choose a smaller screenshot.');
  }
  return imageData;
};

const AddTrade = ({ editingTrade, onComplete, onCancel }) => {
  const { refreshUser } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const initialForm = {
    trade_date: new Date().toISOString().substring(0, 10),
    pair: 'EUR/USD',
    direction: 'BUY',
    timeframe: '15M',
    session: 'London',
    strategy_id: '',
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    exit_price: '',
    lot_size: '1.00',
    risk_percentage: '1.00',
    risk_reward: '',
    result: 'WIN',
    profit_loss: '',
    setup_description: '',
    entry_reason: '',
    exit_reason: '',
    mistake: '',
    lesson_learned: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // If editing, populate with existing data
  useEffect(() => {
    if (editingTrade) {
      setTradeImage(editingTrade.image_data || null);
      setImageChanged(false);
      setFormData({
        trade_date: editingTrade.trade_date ? String(editingTrade.trade_date).substring(0, 10) : '',
        pair: editingTrade.pair || 'EUR/USD',
        direction: editingTrade.direction || 'BUY',
        timeframe: editingTrade.timeframe || '15M',
        session: editingTrade.session || 'London',
        strategy_id: editingTrade.strategy_id || '',
        entry_price: editingTrade.entry_price || '',
        stop_loss: editingTrade.stop_loss || '',
        take_profit: editingTrade.take_profit || '',
        exit_price: editingTrade.exit_price || '',
        lot_size: editingTrade.lot_size || '',
        risk_percentage: editingTrade.risk_percentage || '',
        risk_reward: editingTrade.risk_reward || '',
        result: editingTrade.result || 'WIN',
        profit_loss: editingTrade.profit_loss || '',
        setup_description: editingTrade.setup_description || '',
        entry_reason: editingTrade.entry_reason || '',
        exit_reason: editingTrade.exit_reason || '',
        mistake: editingTrade.mistake || '',
        lesson_learned: editingTrade.lesson_learned || '',
        notes: editingTrade.notes || ''
      });
    }
  }, [editingTrade]);

  // Load available strategies
  useEffect(() => {
    api.getStrategies()
      .then(res => {
        if (res.success) setStrategies(res.data);
      })
      .catch(console.error);
  }, []);

  // Live Risk/Reward auto-calculation
  useEffect(() => {
    const entry = Number(formData.entry_price);
    const sl = Number(formData.stop_loss);
    const tp = Number(formData.take_profit);

    if (entry > 0 && sl > 0 && tp > 0 && (!formData.risk_reward || !editingTrade)) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      if (risk > 0) {
        const ratio = (reward / risk).toFixed(2);
        setFormData(prev => ({ ...prev, risk_reward: `1:${ratio}` }));
      }
    }
  }, [formData.entry_price, formData.stop_loss, formData.take_profit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setIsProcessingImage(true);
    try {
      setTradeImage(await compressTradeImage(file));
      setImageChanged(true);
    } catch (err) {
      setErrors([err.message || 'Could not process this image.']);
      e.target.value = '';
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setTradeImage(null);
    setImageChanged(true);
  };

  const validate = () => {
    const errs = [];
    if (!formData.trade_date) errs.push('Trade date is required.');
    if (!formData.pair || !formData.pair.trim()) errs.push('Currency pair is required.');
    if (!formData.entry_price || isNaN(Number(formData.entry_price)) || Number(formData.entry_price) <= 0) {
      errs.push('Entry price must be a valid positive number.');
    }
    if (!formData.stop_loss || isNaN(Number(formData.stop_loss)) || Number(formData.stop_loss) <= 0) {
      errs.push('Stop loss must be a valid positive number.');
    }
    if (!formData.take_profit || isNaN(Number(formData.take_profit)) || Number(formData.take_profit) <= 0) {
      errs.push('Take profit must be a valid positive number.');
    }
    if (formData.profit_loss === '' || isNaN(Number(formData.profit_loss))) {
      errs.push('Profit/Loss amount is required.');
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        entry_price: Number(formData.entry_price),
        stop_loss: Number(formData.stop_loss),
        take_profit: Number(formData.take_profit),
        exit_price: formData.exit_price ? Number(formData.exit_price) : null,
        lot_size: formData.lot_size ? Number(formData.lot_size) : null,
        risk_percentage: formData.risk_percentage ? Number(formData.risk_percentage) : null,
        profit_loss: Number(formData.profit_loss),
        strategy_id: formData.strategy_id ? Number(formData.strategy_id) : null
      };
      if (!editingTrade || imageChanged) payload.image_data = tradeImage;

      if (editingTrade) {
        await api.updateTrade(editingTrade.id, payload);
        setSuccessMessage('Trade updated successfully!');
      } else {
        await api.createTrade(payload);
        setSuccessMessage('Trade recorded successfully!');
      }

      await refreshUser(); // updates balance across entire app

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 700);
    } catch (err) {
      setErrors([err.message || 'Failed to save trade.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD',
    'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f293d]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {editingTrade ? `Edit Trade #${editingTrade.id}` : 'Record New Trade'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log all execution metrics, risk parameters, and psychological notes.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-[#1a2336] text-slate-300 text-xs font-semibold hover:bg-[#222e47]"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Messages */}
      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-1">
          <p className="font-bold">Please correct the following errors:</p>
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-[#1f293d]">
            1. Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Trade Date *
              </label>
              <input
                type="date"
                name="trade_date"
                required
                value={formData.trade_date}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Currency Pair *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="pair"
                  list="pair-options"
                  required
                  placeholder="EUR/USD"
                  value={formData.pair}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase font-bold focus:border-emerald-500/60 focus:outline-none"
                />
                <datalist id="pair-options">
                  {commonPairs.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Direction *
              </label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="BUY">BUY (Long)</option>
                <option value="SELL">SELL (Short)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Timeframe *
              </label>
              <select
                name="timeframe"
                value={formData.timeframe}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="1M">1 Minute (1M)</option>
                <option value="5M">5 Minutes (5M)</option>
                <option value="15M">15 Minutes (15M)</option>
                <option value="30M">30 Minutes (30M)</option>
                <option value="1H">1 Hour (1H)</option>
                <option value="4H">4 Hours (4H)</option>
                <option value="Daily">Daily (1D)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Trading Session *
              </label>
              <select
                name="session"
                value={formData.session}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="London">London Session</option>
                <option value="New York">New York Session</option>
                <option value="Asian">Asian (Tokyo) Session</option>
                <option value="Sydney">Sydney Session</option>
                <option value="London-NY Overlap">London / NY Overlap</option>
                <option value="Other">Other / Off-hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Strategy Used
              </label>
              <select
                name="strategy_id"
                value={formData.strategy_id}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="">No Strategy (Discretionary)</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Trade Execution Information */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-[#1f293d]">
            2. Trade Execution & Risk
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Entry Price *
              </label>
              <input
                type="number"
                step="any"
                name="entry_price"
                required
                placeholder="1.08500"
                value={formData.entry_price}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Stop Loss *
              </label>
              <input
                type="number"
                step="any"
                name="stop_loss"
                required
                placeholder="1.08250"
                value={formData.stop_loss}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-rose-300 font-mono focus:border-rose-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Take Profit *
              </label>
              <input
                type="number"
                step="any"
                name="take_profit"
                required
                placeholder="1.09100"
                value={formData.take_profit}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                name="exit_price"
                placeholder="1.09100"
                value={formData.exit_price}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Lot Size
              </label>
              <input
                type="number"
                step="0.01"
                name="lot_size"
                placeholder="1.00"
                value={formData.lot_size}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Risk Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="risk_percentage"
                placeholder="1.0"
                value={formData.risk_percentage}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Risk / Reward Ratio
              </label>
              <input
                type="text"
                name="risk_reward"
                placeholder="1:2.5"
                value={formData.risk_reward}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:border-amber-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Result *
              </label>
              <select
                name="result"
                value={formData.result}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
                <option value="BREAK EVEN">BREAK EVEN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Profit / Loss ($) *
              </label>
              <input
                type="number"
                step="any"
                name="profit_loss"
                required
                placeholder="+250 or -100"
                value={formData.profit_loss}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:border-emerald-500/60 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Journal & Psychological Review */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-[#1f293d]">
            3. Setup & Trade Analysis (Review)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Setup Description
              </label>
              <textarea
                name="setup_description"
                rows="2"
                placeholder="Describe the market context, liquidity levels, higher timeframe bias..."
                value={formData.setup_description}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Why did I enter? (Entry Reason)
                </label>
                <textarea
                  name="entry_reason"
                  rows="2"
                  placeholder="Trigger candle, FVG tap, breakout confirmation..."
                  value={formData.entry_reason}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Why did I exit? (Exit Reason)
                </label>
                <textarea
                  name="exit_reason"
                  rows="2"
                  placeholder="TP hit, trailing stop triggered, manual cut..."
                  value={formData.exit_reason}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-400/90 mb-1">
                  What mistake did I make? (Execution / Psychology)
                </label>
                <textarea
                  name="mistake"
                  rows="2"
                  placeholder="FMO entry, moved stop too early, entered late, none..."
                  value={formData.mistake}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-rose-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400/90 mb-1">
                  What did I learn? (Lesson Learned)
                </label>
                <textarea
                  name="lesson_learned"
                  rows="2"
                  placeholder="Key takeaway to reinforce in my playbook..."
                  value={formData.lesson_learned}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                rows="2"
                placeholder="News events, spreads, broker slippage notes..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Trade Screenshot */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-[#1f293d]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">4. Trade Screenshot</h3>
              <p className="mt-1 text-xs text-slate-500">Optional chart image. JPEG, PNG, or WebP; resized before saving.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#2b3952] bg-[#1a2336] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#232f48]">
              {isProcessingImage ? 'Processing image...' : tradeImage ? 'Replace image' : 'Choose image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} disabled={isProcessingImage} className="sr-only" />
            </label>
          </div>
          {tradeImage ? (
            <div className="space-y-3">
              <img src={tradeImage} alt="Trade chart screenshot preview" className="max-h-[480px] w-full rounded-lg border border-[#263247] bg-[#0a0d14] object-contain" />
              <button type="button" onClick={handleRemoveImage} className="text-xs font-semibold text-rose-300 hover:text-rose-200">Remove image</button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#2b3952] px-4 py-8 text-center text-xs text-slate-500">
              No screenshot attached.
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg bg-[#1a2336] text-slate-300 text-xs font-semibold hover:bg-[#232f48] transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isProcessingImage}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? 'Saving Trade...'
              : editingTrade
              ? 'Update Trade Record'
              : 'Save Trade to Journal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
