import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/schemes', label: 'Welfare Schemes', icon: '🏥' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch {
        setError('Failed to load system stats.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar links={ADMIN_LINKS} portalName="Admin Panel" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Admin Dashboard</h1>
            <p>System overview and platform health</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && stats && (
            <>
              {/* Users by Role */}
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="section-title">Users by Role</div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.usersByRole
                          ? Object.entries(stats.usersByRole).map(([role, count]) => (
                              <tr key={role}>
                                <td style={{ textTransform: 'capitalize' }}>
                                  {role.replace(/_/g, ' ')}
                                </td>
                                <td>{count}</td>
                              </tr>
                            ))
                          : (
                            <>
                              <tr><td>Workers</td><td>{stats.totalWorkers ?? '—'}</td></tr>
                              <tr><td>Employers</td><td>{stats.totalEmployers ?? '—'}</td></tr>
                              <tr><td>Officers</td><td>{stats.totalOfficers ?? '—'}</td></tr>
                              <tr><td>Admins</td><td>{stats.totalAdmins ?? '—'}</td></tr>
                            </>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Records per Collection */}
                <div className="card">
                  <div className="section-title">Records per Collection</div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Collection</th>
                          <th>Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Workers</td><td>{stats.totalWorkers ?? '—'}</td></tr>
                        <tr><td>Employers</td><td>{stats.totalEmployers ?? '—'}</td></tr>
                        <tr><td>Grievances</td><td>{stats.totalGrievances ?? stats.openComplaints ?? '—'}</td></tr>
                        <tr><td>Welfare Schemes</td><td>{stats.totalSchemes ?? '—'}</td></tr>
                        <tr><td>Welfare Applications</td><td>{stats.totalApplications ?? '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-title">System Health Indicators</div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{stats.totalUsers ?? '—'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Open Complaints</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>
                      {stats.openComplaints ?? '—'}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Active Schemes</div>
                    <div className="stat-value">{stats.totalSchemes ?? stats.activeSchemes ?? '—'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">High-Risk Employers</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>
                      {stats.highRiskEmployers ?? '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="card">
                <div className="section-title">Quick Navigation</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/admin/users" className="btn btn-primary">👥 Manage Users</Link>
                  <Link to="/admin/schemes" className="btn btn-primary">🏥 Manage Schemes</Link>
                  <Link to="/gov/dashboard" className="btn btn-secondary">📊 Analytics Dashboard</Link>
                  <Link to="/gov/grievances" className="btn btn-secondary">📋 Grievances</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
