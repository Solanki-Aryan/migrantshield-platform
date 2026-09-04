import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
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

const STATUS_COLORS = {
  applied: '#1a56db',
  approved: '#0e9f6e',
  rejected: '#e02424',
  pending: '#ff5a1f',
};

export default function WelfareAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/dashboard/welfare-analytics');
        setAnalytics(res.data);
      } catch {
        setError('Failed to load welfare analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusData = analytics?.statusBreakdown
    ? Object.entries(analytics.statusBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const schemeData = analytics?.schemeBreakdown || [];

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Welfare Analytics</h1>
            <p>Welfare scheme application status and coverage</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && analytics && (
            <>
              {/* Summary stats */}
              <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-label">Total Applications</div>
                  <div className="stat-value">{analytics.totalApplications ?? '—'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Approved</div>
                  <div className="stat-value" style={{ color: '#0e9f6e' }}>
                    {analytics.statusBreakdown?.approved ?? 0}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value" style={{ color: '#ff5a1f' }}>
                    {analytics.statusBreakdown?.pending ?? 0}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Rejected</div>
                  <div className="stat-value" style={{ color: 'var(--danger)' }}>
                    {analytics.statusBreakdown?.rejected ?? 0}
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Pie Chart */}
                <div className="card">
                  <div className="section-title">Application Status Distribution</div>
                  {statusData.length === 0 ? (
                    <div className="empty-state">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={STATUS_COLORS[entry.name] || '#9ca3af'}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Coverage Stats */}
                <div className="card">
                  <div className="section-title">Coverage Highlights</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Workers Covered</span>
                      <strong>{analytics.workersCovered ?? '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Coverage Rate</span>
                      <strong>{analytics.coverageRate ?? '—'}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Active Schemes</span>
                      <strong>{analytics.activeSchemes ?? schemeData.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Approval Rate</span>
                      <strong style={{ color: '#0e9f6e' }}>
                        {analytics.approvalRate != null
                          ? `${analytics.approvalRate.toFixed(1)}%`
                          : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheme Breakdown Table */}
              <div className="card">
                <div className="section-title">Scheme-wise Breakdown</div>
                {schemeData.length === 0 ? (
                  <div className="empty-state">No scheme breakdown available.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Scheme Name</th>
                          <th>Total Applied</th>
                          <th>Approved</th>
                          <th>Pending</th>
                          <th>Rejected</th>
                          <th>Approval Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemeData.map((s, i) => (
                          <tr key={i}>
                            <td>{s.schemeName || s.name}</td>
                            <td>{s.totalApplied ?? s.total ?? '—'}</td>
                            <td>{s.approved ?? '—'}</td>
                            <td>{s.pending ?? '—'}</td>
                            <td>{s.rejected ?? '—'}</td>
                            <td>
                              {s.approvalRate != null
                                ? `${s.approvalRate.toFixed(1)}%`
                                : s.totalApplied
                                ? `${((s.approved / s.totalApplied) * 100).toFixed(1)}%`
                                : '—'}
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
