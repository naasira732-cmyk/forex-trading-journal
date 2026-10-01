import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IconSettings, IconShield, IconWallet } from '../components/Icons';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    starting_balance: '10000',
    currency: 'USD'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        starting_balance: user.starting_balance !== undefined ? String(user.starting_balance) : '10000',
        currency: user.currency || 'USD'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.updateProfile({
        name: formData.name,
        starting_balance: Number(formData.starting_balance),
        currency: formData.currency
      });

      if (res.success) {
        setSuccessMessage('Account preferences and starting balance updated successfully!');
        await refreshUser();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-16">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Account & Trading Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure capital parameters, currency units, and trader profile.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Account Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-[#1f293d] flex items-center space-x-2">
            <IconWallet className="w-4 h-4 text-emerald-400" />
            <span>Capital & Financial Baseline</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Account Starting Capital *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="starting_balance"
                required
                value={formData.starting_balance}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:border-emerald-500/60 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used as the baseline origin for drawdown calculations and the equity curve.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Account Base Currency *
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:border-emerald-500/60 focus:outline-none"
              >
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="AUD">AUD - Australian Dollar (A$)</option>
                <option value="CAD">CAD - Canadian Dollar (C$)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
                <option value="CHF">CHF - Swiss Franc (CHF)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-[#111723] border border-[#1f293d] rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-[#1f293d]">
            Trader Profile Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Trader Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#0a0d14]/60 border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security & System Info */}
       

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Updating...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
