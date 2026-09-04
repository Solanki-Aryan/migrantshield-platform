import React, { useEffect, useState } from 'react';
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

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [welfare, setWelfare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [wRes, gRes] = await Promise.all([
          api.get(`/workers/${user._id}`),
          api.get('/grievances'),
        ]);
        setWorker(wRes.data);
        const gData = gRes.data;
        setGrievances(Array.isArray(gData) ? gData.slice(0, 5) : []);
        setWelfare(wRes.data.welfareApplications || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchData();
  }, [user]);

  const activeComplaints = grievances.filter(
    (g) => g.status !== 'resolved' && g.status !== 'closed'
  ).length;

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Welcome, {user?.name || 'Worker'} 👋</h1>
            <p>Here's your welfare & compliance overview</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">Profile Status</div>
                  <div className="stat-value">
                    {worker?.isVerified ? '✅' : '⚠️'}
                  </div>
                  <div className="stat-sub">
                    {worker?.isVerified ? 'Verified' : 'Pending Verification'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Welfare Schemes</div>
                  <div className="stat-value">{welfare.length}</div>
                  <div className="stat-sub">Applications submitted</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Complaints</div>
                  <div className="stat-value">{activeComplaints}</div>
                  <div className="stat-sub">Open grievances</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Wage Status</div>
                  <div className="stat-value">
                    {worker?.wageData?.lastAnalysis
                      ? <span className="badge badge-success">Analyzed</span>
                      : <span className="badge badge-muted">Not set</span>}
                  </div>
                  <div className="stat-sub">Last wage check</div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="section-title">Recent Welfare Applications</div>
                  {welfare.length === 0 ? (
                    <div className="empty-state">No applications yet.</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Scheme</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {welfare.slice(0, 5).map((w, i) => (
                            <tr key={i}>
                              <td>{w.schemeName || w.scheme}</td>
                              <td>
                                <span className={`badge ${statusBadge(w.status)}`}>
                                  {w.status}
                                </span>
                              </td>
                              <td>{w.appliedAt ? new Date(w.appliedAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="section-title">Recent Complaints</div>
                  {grievances.length === 0 ? (
                    <div className="empty-state">No complaints filed.</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Severity</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grievances.map((g) => (
                            <tr key={g._id}>
                              <td>{g.category}</td>
                              <td>
                                <span className={`badge ${severityBadge(g.severity)}`}>
                                  {g.severity}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${statusBadge(g.status)}`}>
                                  {g.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function statusBadge(status) {
  switch (status) {
    case 'approved': case 'resolved': return 'badge-success';
    case 'rejected': case 'closed': return 'badge-danger';
    case 'pending': return 'badge-warning';
    default: return 'badge-info';
  }
}

function severityBadge(sev) {
  switch (sev) {
    case 'emergency': return 'badge-danger';
    case 'high': return 'badge-orange';
    case 'medium': return 'badge-warning';
    default: return 'badge-success';
  }
}
