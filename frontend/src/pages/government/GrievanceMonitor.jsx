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

const CATEGORIES = [
  'All', 'Wage Theft', 'Unsafe Working Conditions', 'Harassment',
  'Discrimination', 'Forced Labour', 'Non-payment of Benefits',
  'Contract Violation', 'Other',
];

const SEVERITIES = ['All', 'emergency', 'high', 'medium', 'low'];

const STATUSES = ['All', 'pending', 'under_review', 'investigating', 'resolved', 'closed'];

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat',
  'Haryana','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh',
  'West Bengal','Delhi',
];

const PAGE_SIZE = 15;

export default function GrievanceMonitor() {
  const [grievances, setGrievances] = useState([]);
  const [filters, setFilters] = useState({
    category: 'All',
    severity: 'All',
    status: 'All',
    state: 'All States',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    fetchGrievances();
  }, []);

  async function fetchGrievances() {
    setLoading(true);
    try {
      const res = await api.get('/grievances');
      setGrievances(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load grievances.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(e) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const filtered = grievances.filter((g) => {
    if (filters.category !== 'All' && g.category !== filters.category) return false;
    if (filters.severity !== 'All' && g.severity !== filters.severity) return false;
    if (filters.status !== 'All' && g.status !== filters.status) return false;
    const gState = g.location?.state || g.state;
    if (filters.state !== 'All States' && gState !== filters.state) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.put(`/grievances/${id}`, { status });
      setGrievances((prev) =>
        prev.map((g) => (g._id === id ? { ...g, status } : g))
      );
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Grievance Monitor</h1>
            <p>Track and manage all worker complaints</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Filters */}
          <div className="filter-bar">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" name="category" value={filters.category} onChange={handleFilter}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-control" name="severity" value={filters.severity} onChange={handleFilter}>
                {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={filters.status} onChange={handleFilter}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="form-control" name="state" value={filters.state} onChange={handleFilter}>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-wrapper">Loading grievances...</div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Complaints ({filtered.length})
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Page {page} of {totalPages}
                </span>
              </div>

              {paginated.length === 0 ? (
                <div className="empty-state">No complaints match the current filters.</div>
              ) : (
                <>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Category</th>
                          <th>Worker</th>
                          <th>Employer</th>
                          <th>State</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Filed</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((g) => (
                          <tr key={g._id}>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {String(g._id).slice(-8)}
                            </td>
                            <td>{g.category}</td>
                            <td>{g.workerName || (g.isAnonymous ? '(Anonymous)' : '—')}</td>
                            <td>{g.employerName || g.employer?.companyName || '—'}</td>
                            <td>{g.location?.state || g.state || '—'}</td>
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
                            <td>
                              <div className="actions-row">
                                <select
                                  className="form-control"
                                  style={{ padding: '3px 6px', fontSize: 12, width: 130 }}
                                  value={selectedStatus[g._id] || g.status}
                                  onChange={(e) =>
                                    setSelectedStatus((prev) => ({
                                      ...prev,
                                      [g._id]: e.target.value,
                                    }))
                                  }
                                >
                                  {STATUSES.filter((s) => s !== 'All').map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() =>
                                    updateStatus(g._id, selectedStatus[g._id] || g.status)
                                  }
                                  disabled={updatingId === g._id}
                                >
                                  {updatingId === g._id ? '…' : 'Update'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2)
                      .map((p) => (
                        <button
                          key={p}
                          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function severityBadge(sev) {
  switch (sev) {
    case 'emergency': return 'badge-danger';
    case 'high': return 'badge-orange';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-success';
    default: return 'badge-muted';
  }
}

function statusBadge(status) {
  switch (status) {
    case 'resolved': case 'closed': return 'badge-success';
    case 'investigating': return 'badge-info';
    case 'under_review': return 'badge-warning';
    case 'pending': return 'badge-orange';
    default: return 'badge-muted';
  }
}
