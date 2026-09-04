import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

const PIE_COLORS = ['#1a56db', '#e02424', '#0e9f6e', '#ff5a1f', '#7c3aed'];

export default function GovDashboard() {
  const [stats, setStats] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [sRes, hRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/high-risk-employers'),
        ]);
        setStats(sRes.data);
        setHighRisk(Array.isArray(hRes.data) ? hRes.data : []);
      } catch (err) {
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sectorData = stats?.sectorDistribution
    ? Object.entries(stats.sectorDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const complaintData = stats?.complaintCategories
    ? Object.entries(stats.complaintCategories).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Government Dashboard</h1>
            <p>Comprehensive analytics and monitoring for migrant worker welfare</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && stats && (
            <>
              {/* Stat Cards */}
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-label">Total Workers</div>
                  <div className="stat-value">{stats.totalWorkers ?? '—'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Welfare Coverage</div>
                  <div className="stat-value">{stats.welfareCoverage ?? 0}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Open Complaints</div>
                  <div className="stat-value" style={{ color: 'var(--danger)' }}>
                    {stats.openComplaints ?? '—'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Wage Alerts</div>
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>
                    {stats.wageAlerts ?? '—'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">High-Risk Employers</div>
                  <div className="stat-value" style={{ color: 'var(--danger)' }}>
                    {stats.highRiskEmployers ?? highRisk.length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending Investigations</div>
                  <div className="stat-value">{stats.pendingInvestigations ?? '—'}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="section-title">Sector Distribution</div>
                  {sectorData.length === 0 ? (
                    <div className="empty-state">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={sectorData} margin={{ top: 0, right: 16, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#1a56db" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card">
                  <div className="section-title">Complaint Categories</div>
                  {complaintData.length === 0 ? (
                    <div className="empty-state">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={complaintData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {complaintData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* High-Risk Employers */}
              <div className="card">
                <div className="section-title">High-Risk Employers</div>
                {highRisk.length === 0 ? (
                  <div className="empty-state">No high-risk employers identified.</div>
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
                        </tr>
                      </thead>
                      <tbody>
                        {highRisk.map((e) => (
                          <tr key={e._id}>
                            <td>{e.companyName}</td>
                            <td>{e.sector || e.industry}</td>
                            <td>{e.state || '—'}</td>
                            <td>{e.workerCount || '—'}</td>
                            <td>{e.complaintCount ?? '—'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="progress-bar-wrapper" style={{ width: 60 }}>
                                  <div
                                    className="progress-bar-fill"
                                    style={{
                                      width: `${e.riskScore || 0}%`,
                                      background: riskColor(e.riskScore),
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12 }}>{e.riskScore ?? '—'}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${riskBadge(e.riskLevel)}`}>
                                {e.riskLevel || 'unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
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

function riskColor(score) {
  if (!score) return '#9ca3af';
  if (score <= 30) return '#0e9f6e';
  if (score <= 60) return '#ff5a1f';
  return '#e02424';
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
