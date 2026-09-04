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

export default function ComplianceView() {
  const { user } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [eRes, rRes, gRes] = await Promise.all([
          api.get(`/employers/${user._id}`),
          api.get(`/employers/${user._id}/risk-score`),
          api.get('/grievances'),
        ]);
        setEmployer(eRes.data);
        setRiskData(rRes.data);
        setGrievances(Array.isArray(gRes.data) ? gRes.data : []);
      } catch (err) {
        setError('Failed to load compliance data.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchData();
  }, [user]);

  const riskScore = riskData?.riskScore ?? employer?.riskScore ?? 0;
  const riskLevel = riskData?.riskLevel ?? employer?.riskLevel ?? 'unknown';

  function riskColor(score) {
    if (score <= 30) return 'var(--secondary)';
    if (score <= 60) return 'var(--warning)';
    return 'var(--danger)';
  }

  return (
    <>
      <Navbar />
      <Sidebar links={EMPLOYER_LINKS} portalName="Employer Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Compliance Overview</h1>
            <p>Monitor your compliance status and worker complaints</p>
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && employer && (
            <>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                {/* Compliance Metrics */}
                <div className="card">
                  <div className="section-title">Compliance Metrics</div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Wage Compliance</span>
                      <span className={`badge ${employer.wageCompliance === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
                        {employer.wageCompliance || 'Not Assessed'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Safety Compliance</span>
                      <span className={`badge ${employer.safetyCompliance === 'compliant' ? 'badge-success' : 'badge-warning'}`}>
                        {employer.safetyCompliance || 'Not Assessed'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Overall Status</span>
                      <span className={`badge ${employer.complianceStatus === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
                        {employer.complianceStatus || 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Last Audit</span>
                      <span style={{ color: 'var(--muted)' }}>
                        {employer.lastAuditDate
                          ? new Date(employer.lastAuditDate).toLocaleDateString()
                          : 'No audit on record'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="card">
                  <div className="section-title">Risk Score</div>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: riskColor(riskScore) }}>
                      {riskScore}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>out of 100</div>
                    <span className={`badge ${riskBadge(riskLevel)}`} style={{ marginTop: 8 }}>
                      {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(riskScore, 100)}%`,
                        background: riskColor(riskScore),
                      }}
                    />
                  </div>
                  {riskData?.breakdown && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Score breakdown:</div>
                      {Object.entries(riskData.breakdown).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Complaints list */}
              <div className="card">
                <div className="section-title">Complaints Against Your Company</div>
                {grievances.length === 0 ? (
                  <div className="empty-state">No complaints on record. Keep it up! ✅</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
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
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {String(g._id).slice(-8)}
                            </td>
                            <td>{g.category}</td>
                            <td style={{ maxWidth: 200 }}>
                              {String(g.description || '').slice(0, 60)}
                              {String(g.description || '').length > 60 ? '…' : ''}
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
