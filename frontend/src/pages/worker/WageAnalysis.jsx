import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const WORKER_LINKS = [
  { path: '/worker/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/worker/profile', label: 'My Profile', icon: '👤' },
  { path: '/worker/skills', label: 'Skills', icon: '🎯' },
  { path: '/worker/welfare', label: 'Welfare Schemes', icon: '🏥' },
  { path: '/worker/wage', label: 'Wage Analysis', icon: '💰' },
  { path: '/worker/grievance', label: 'File Complaint', icon: '📋' },
  { path: '/worker/assistant', label: 'AI Assistant', icon: '🤖' },
];

export default function WageAnalysis() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    wageType: 'daily',
    amount: '',
    workingHours: '8',
    sector: '',
    occupation: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!form.amount) {
      setError('Please enter your wage amount.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/wages/analyze', {
        workerId: user._id,
        wageType: form.wageType,
        amount: Number(form.amount),
        workingHoursPerDay: Number(form.workingHours),
        sector: form.sector,
        occupation: form.occupation,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function verdictBadge(verdict) {
    if (!verdict) return 'badge-muted';
    const v = verdict.toLowerCase();
    if (v.includes('fair') || v.includes('above')) return 'badge-success';
    if (v.includes('low') || v.includes('potentially')) return 'badge-warning';
    if (v.includes('risk') || v.includes('below')) return 'badge-danger';
    return 'badge-info';
  }

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Wage Analysis</h1>
            <p>Check if your wages comply with minimum wage standards</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="grid-2">
            <div className="card">
              <div className="section-title">Enter Your Wage Details</div>
              <form onSubmit={handleAnalyze}>
                <div className="form-group">
                  <label className="form-label">Wage Type</label>
                  <select
                    className="form-control"
                    name="wageType"
                    value={form.wageType}
                    onChange={handleChange}
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-control"
                    type="number"
                    name="amount"
                    placeholder="e.g. 500"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Hours Per Day</label>
                  <input
                    className="form-control"
                    type="number"
                    name="workingHours"
                    value={form.workingHours}
                    onChange={handleChange}
                    min="1"
                    max="24"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sector (optional)</label>
                  <input
                    className="form-control"
                    name="sector"
                    placeholder="e.g. Construction"
                    value={form.sector}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Occupation (optional)</label>
                  <input
                    className="form-control"
                    name="occupation"
                    placeholder="e.g. Mason"
                    value={form.occupation}
                    onChange={handleChange}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '⏳ Analyzing...' : '📊 Analyze Wage'}
                </button>
              </form>
            </div>

            <div>
              {loading && (
                <div className="card">
                  <div className="loading-wrapper">Analyzing your wage data...</div>
                </div>
              )}

              {result && (
                <div className="card">
                  <div className="section-title">Analysis Result</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your Wage</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                        ₹{result.actualWage || form.amount}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>per {form.wageType}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Reference Wage</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{result.referenceWage || result.minimumWage || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>per {form.wageType}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <span
                      className={`badge ${verdictBadge(result.verdict || result.fairnessVerdict)}`}
                      style={{ fontSize: 15, padding: '6px 18px' }}
                    >
                      {result.verdict || result.fairnessVerdict || 'Analysis complete'}
                    </span>
                  </div>

                  {result.explanation && (
                    <div className="alert alert-info" style={{ marginBottom: 12 }}>
                      {result.explanation}
                    </div>
                  )}

                  {result.recommendedAction && (
                    <div>
                      <strong>Recommended Action:</strong>
                      <p style={{ marginTop: 6, color: 'var(--muted)' }}>
                        {result.recommendedAction}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && (
                <div className="card">
                  <div className="empty-state">
                    <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
                    <p>Enter your wage details and click "Analyze Wage" to see if your wages comply with minimum wage laws.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
