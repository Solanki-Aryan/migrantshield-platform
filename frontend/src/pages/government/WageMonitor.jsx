import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const GOV_LINKS = [
  { path: '/gov/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/gov/workers', label: 'Worker Map', icon: '🗺️' },
  { path: '/gov/welfare', label: 'Welfare Analytics', icon: '🏥' },
  { path: '/gov/wages', label: 'Wage Monitor', icon: '💰' },
  { path: '/gov/grievances', label: 'Grievances', icon: '📋' },
  { path: '/gov/employers', label: 'Employer Monitor', icon: '🏢' },
];

const SECTORS = [
  'All Sectors', 'Construction', 'Agriculture', 'Manufacturing', 'Textile',
  'Domestic Work', 'Mining', 'Transport', 'Hospitality',
];

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat',
  'Haryana','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh',
  'West Bengal','Delhi',
];

const SEVERITIES = ['All', 'low', 'medium', 'high', 'critical'];

export default function WageMonitor() {
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    sector: 'All Sectors',
    state: 'All States',
    severity: 'All',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/dashboard/wage-analytics');
        setAnalytics(res.data);
      } catch {
        setError('Failed to load wage analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const workers = analytics?.workers || analytics?.wageIssues || [];
  const filtered = workers.filter((w) => {
    if (filters.sector !== 'All Sectors' && w.sector !== filters.sector) return false;
    if (filters.state !== 'All States' && w.state !== filters.state) return false;
    if (filters.severity !== 'All' && w.severity !== filters.severity) return false;
    return true;
  });

  const chartData = analytics?.sectorComparison || [];

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Wage Monitor</h1>
            <p>Track wage compliance issues across sectors and states</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && analytics && (
            <>
              {/* Bar Chart */}
              {chartData.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="section-title">Average Actual vs Reference Wages by Sector</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="sector" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Legend />
                      <Bar dataKey="avgActualWage" name="Actual Wage (₹)" fill="#1a56db" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgReferenceWage" name="Reference Wage (₹)" fill="#0e9f6e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Filters */}
              <div className="filter-bar">
                <div className="form-group">
                  <label className="form-label">Sector</label>
                  <select className="form-control" name="sector" value={filters.sector} onChange={handleFilter}>
                    {SECTORS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-control" name="state" value={filters.state} onChange={handleFilter}>
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select className="form-control" name="severity" value={filters.severity} onChange={handleFilter}>
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Workers Table */}
              <div className="card">
                <div className="section-title">
                  Workers with Wage Issues ({filtered.length})
                </div>
                {filtered.length === 0 ? (
                  <div className="empty-state">No wage issues found for the selected filters.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Worker</th>
                          <th>State</th>
                          <th>Sector</th>
                          <th>Actual Wage (₹)</th>
                          <th>Reference Wage (₹)</th>
                          <th>Variance</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((w, i) => {
                          const diff = w.actualWage && w.referenceWage
                            ? ((w.actualWage - w.referenceWage) / w.referenceWage * 100).toFixed(1)
                            : null;
                          return (
                            <tr key={i}>
                              <td>{w.workerName || w.name || `Worker ${i + 1}`}</td>
                              <td>{w.state || '—'}</td>
                              <td>{w.sector || '—'}</td>
                              <td>₹{w.actualWage ?? '—'}</td>
                              <td>₹{w.referenceWage ?? '—'}</td>
                              <td>
                                {diff !== null ? (
                                  <span style={{ color: diff < 0 ? 'var(--danger)' : 'var(--secondary)' }}>
                                    {diff > 0 ? '+' : ''}{diff}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td>
                                <span className={`badge ${severityBadge(w.severity)}`}>
                                  {w.severity || 'medium'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function severityBadge(sev) {
  switch (sev) {
    case 'critical': case 'emergency': return 'badge-danger';
    case 'high': return 'badge-orange';
    case 'medium': return 'badge-warning';
    default: return 'badge-success';
  }
}
