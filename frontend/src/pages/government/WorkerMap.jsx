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

const INDIAN_STATES = [
  'All States', 'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat',
  'Haryana','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi',
];

const SECTORS = [
  'All Sectors', 'Construction', 'Agriculture', 'Manufacturing', 'Textile',
  'Domestic Work', 'Mining', 'Transport', 'Hospitality',
];

export default function WorkerMap() {
  const [filters, setFilters] = useState({ state: 'All States', sector: 'All Sectors', skill: '' });
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/worker-analytics');
      setAnalytics(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load worker analytics.');
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const filtered = analytics.filter((row) => {
    if (filters.state !== 'All States' && row.state !== filters.state) return false;
    if (filters.sector !== 'All Sectors' && row.sector !== filters.sector) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <Sidebar links={GOV_LINKS} portalName="Government Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Worker Distribution Map</h1>
            <p>Geographic distribution of registered migrant workers</p>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="form-group">
              <label className="form-label">State</label>
              <select
                className="form-control"
                name="state"
                value={filters.state}
                onChange={handleFilter}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sector</label>
              <select
                className="form-control"
                name="sector"
                value={filters.sector}
                onChange={handleFilter}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Skill</label>
              <input
                className="form-control"
                name="skill"
                placeholder="e.g. masonry"
                value={filters.skill}
                onChange={handleFilter}
              />
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="map-placeholder" style={{ marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
              <p>Worker Distribution Map</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Requires Leaflet Map Integration</p>
            </div>
          </div>

          {/* Analytics Table */}
          {error && <div className="alert alert-error">{error}</div>}
          <div className="card">
            <div className="section-title">Worker Counts by State / District</div>
            {loading ? (
              <div className="loading-wrapper">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No data available for selected filters.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>District</th>
                      <th>Sector</th>
                      <th>Worker Count</th>
                      <th>Avg Experience (yrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={i}>
                        <td>{row.state}</td>
                        <td>{row.district || '—'}</td>
                        <td>{row.sector || '—'}</td>
                        <td>{row.count ?? row.workerCount}</td>
                        <td>{row.avgExperience != null ? row.avgExperience.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
