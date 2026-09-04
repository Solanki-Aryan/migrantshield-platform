import React, { useEffect, useState } from 'react';
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

const RISK_LEVELS = ['All', 'low', 'medium', 'high', 'critical'];

export default function EmployerMonitor() {
  const [employers, setEmployers] = useState([]);
  const [filters, setFilters] = useState({
    sector: 'All Sectors',
    state: 'All States',
    riskLevel: 'All',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/employers');
        const list = Array.isArray(res.data) ? res.data : (res.data.employers || []);
        // Fetch risk scores in parallel (best-effort)
        const withRisk = await Promise.all(
          list.map(async (emp) => {
            try {
              const rRes = await api.get(`/employers/${emp._id}/risk-score`);
              return { ...emp, riskScore: rRes.data.riskScore, riskLevel: rRes.data.riskLevel };
            } catch {
              return emp;
            }
          })
        );
        setEmployers(withRisk);
      } catch {
        setError('Failed to load employer data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const filtered = employers.filter((e) => {
    if (filters.sector !== 'All Sectors' && e.sector !== filters.sector && e.industry !== filters.sector) return false;
    const eState = Array.isArray(e.locations) ? e.locations[0] : e.state;
    if (filters.state !== 'All States' && eState !== filters.state) return false;
    if (filters.riskLevel !== 'All' && e.riskLevel !== filters.riskLevel) return false;
    return true;
  });

  function riskColor(score) {
    if (!score) return '#9ca3af';
    if (score <= 30) return '#0e9f6e';
    if (score <= 60) return '#ff5a1f';
    return '#e02424';
  }

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Employer Monitor</h1>
            <p>Risk profiles and compliance status for all registered employers</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

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
              <label className="form-label">Risk Level</label>
              <select className="form-control" name="riskLevel" value={filters.riskLevel} onChange={handleFilter}>
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Levels' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-wrapper">Loading employers...</div>
          ) : (
            <div className="card">
              <div className="section-title">Employers ({filtered.length})</div>
              {filtered.length === 0 ? (
                <div className="empty-state">No employers match the selected filters.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Sector</th>
                        <th>State</th>
                        <th>Workers</th>
                        <th>Complaints</th>
                        <th>Risk Score</th>
                        <th>Risk Level</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e) => (
                        <tr key={e._id}>
                          <td>{e.companyName}</td>
                          <td>{e.sector || e.industry || '—'}</td>
                          <td>
                            {Array.isArray(e.locations)
                              ? e.locations.slice(0, 2).join(', ')
                              : e.state || '—'}
                          </td>
                          <td>{e.workerCount ?? '—'}</td>
                          <td>{e.complaintCount ?? '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar-wrapper" style={{ width: 70 }}>
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${Math.min(e.riskScore || 0, 100)}%`,
                                    background: riskColor(e.riskScore),
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 12, minWidth: 24 }}>
                                {e.riskScore ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${riskBadge(e.riskLevel)}`}>
                              {e.riskLevel || 'unknown'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => alert(`Employer ID: ${e._id}\n${e.companyName}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function riskBadge(level) {
  switch (level) {
    case 'low': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'high': return 'badge-orange';
    case 'critical': return 'badge-danger';
    default: return 'badge-muted';
  }
}
