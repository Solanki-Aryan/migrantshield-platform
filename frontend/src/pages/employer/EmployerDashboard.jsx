import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const EMPLOYER_LINKS = [
  { path: '/employer/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/employer/profile', label: 'Company Profile', icon: '🏢' },
  { path: '/employer/compliance', label: 'Compliance', icon: '✅' },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [eRes, gRes] = await Promise.all([
          api.get(`/employers/${user._id}`),
          api.get('/grievances'),
        ]);
        setEmployer(eRes.data);
        setGrievances(Array.isArray(gRes.data) ? gRes.data.slice(0, 10) : []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchData();
  }, [user]);

  const openComplaints = grievances.filter(
    (g) => g.status !== 'resolved' && g.status !== 'closed'
  ).length;

  return (
    <>
      <Navbar />
      <Sidebar links={EMPLOYER_LINKS} portalName="Employer Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Employer Dashboard</h1>
            <p>Overview of your workforce and compliance status</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && employer && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Workers</div>
                  <div className="stat-value">
                    {employer.workerCount || employer.totalWorkers || 0}
                  </div>
                  <div className="stat-sub">Registered workers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Open Complaints</div>
                  <div className="stat-value">{openComplaints}</div>
                  <div className="stat-sub">Pending resolution</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Compliance Status</div>
                  <div className="stat-value">
                    {employer.complianceStatus === 'compliant' ? (
                      <span className="badge badge-success">Compliant</span>
                    ) : employer.complianceStatus === 'non_compliant' ? (
                      <span className="badge badge-danger">Non-Compliant</span>
                    ) : (
                      <span className="badge badge-warning">Review Needed</span>
                    )}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Risk Level</div>
                  <div className="stat-value">
                    <span className={`badge ${riskBadge(employer.riskLevel)}`}>
                      {employer.riskLevel || 'Unknown'}
                    </span>
                  </div>
                  <div className="stat-sub">
                    Score: {employer.riskScore !== undefined ? employer.riskScore : '—'}/100
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="section-title">Recent Complaints</div>
                {grievances.length === 0 ? (
                  <div className="empty-state">No complaints filed against your company.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Filed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grievances.map((g) => (
                          <tr key={g._id}>
                            <td>{g.category}</td>
                            <td style={{ maxWidth: 220 }}>
                              <span title={g.description}>
                                {String(g.description || '').slice(0, 60)}
                                {String(g.description || '').length > 60 ? '…' : ''}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${severityBadge(g.severity)}`}>
                                {g.severity || 'medium'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${statusBadge(g.status)}`}>
                                {g.status}
                              </span>
                            </td>
                            <td>
                              {g.createdAt
                                ? new Date(g.createdAt).toLocaleDateString()
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

function riskBadge(level) {
  switch (level) {
    case 'low': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'high': return 'badge-orange';
    case 'critical': return 'badge-danger';
    default: return 'badge-muted';
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

function statusBadge(status) {
  switch (status) {
    case 'resolved': case 'closed': return 'badge-success';
    case 'rejected': return 'badge-danger';
    case 'pending': return 'badge-warning';
    default: return 'badge-info';
  }
}
