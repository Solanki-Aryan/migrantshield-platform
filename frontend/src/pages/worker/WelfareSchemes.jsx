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

export default function WelfareSchemes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('eligible');
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchSchemes() {
      setLoading(true);
      try {
        const [eligRes, allRes] = await Promise.all([
          api.get(`/workers/${user._id}/welfare-eligibility`),
          api.get('/welfare'),
        ]);
        setEligibleSchemes(eligRes.data || []);
        setAllSchemes(allRes.data || []);
      } catch (err) {
        setError('Failed to load welfare schemes.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchSchemes();
  }, [user]);

  async function handleApply(schemeId, schemeName) {
    setApplying(schemeId);
    setError('');
    setSuccess('');
    try {
      await api.post(`/welfare/${schemeId}/apply`, { workerId: user._id });
      setSuccess(`Successfully applied for "${schemeName}".`);
    } catch (err) {
      setError(err.response?.data?.message || 'Application failed.');
    } finally {
      setApplying(null);
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>Welfare Schemes</h1>
            <p>View government welfare programs you're eligible for</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'eligible' ? 'active' : ''}`}
              onClick={() => setActiveTab('eligible')}
            >
              ✅ Eligible Schemes ({eligibleSchemes.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              📋 All Schemes ({allSchemes.length})
            </button>
          </div>

          {loading && <div className="loading-wrapper">Loading schemes...</div>}

          {!loading && activeTab === 'eligible' && (
            <>
              {eligibleSchemes.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    No eligible schemes found. Make sure your profile is complete.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {eligibleSchemes.map((item) => {
                    const scheme = item.scheme || item;
                    return (
                      <div className="card" key={scheme._id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: 4 }}>{scheme.name}</h3>
                            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                              {scheme.department} — {scheme.ministry}
                            </p>
                          </div>
                          <span className={`badge ${item.eligible ? 'badge-success' : 'badge-danger'}`}>
                            {item.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                          </span>
                        </div>
                        <p style={{ marginBottom: 12 }}>{scheme.benefits?.summary || scheme.description}</p>

                        {scheme.documentsRequired && scheme.documentsRequired.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <strong style={{ fontSize: 13 }}>Documents Required:</strong>
                            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                              {scheme.documentsRequired.map((doc, i) => (
                                <li key={i} style={{ fontSize: 13, color: 'var(--muted)' }}>
                                  {doc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.eligible && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApply(scheme._id, scheme.name)}
                            disabled={applying === scheme._id}
                          >
                            {applying === scheme._id ? 'Applying...' : 'Apply Now'}
                          </button>
                        )}
                        {item.reasons && item.reasons.length > 0 && (
                          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                            {item.reasons.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && activeTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {allSchemes.length === 0 ? (
                <div className="card"><div className="empty-state">No schemes found.</div></div>
              ) : (
                allSchemes.map((scheme) => (
                  <div className="card" key={scheme._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ margin: 0 }}>{scheme.name}</h3>
                      <span className="badge badge-info">{scheme.targetBeneficiary || 'All Workers'}</span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                      {scheme.department} — {scheme.ministry}
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      {scheme.benefits?.summary || scheme.description}
                    </p>
                    {scheme.eligibilityCriteria && (
                      <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
                        <strong>Eligibility:</strong>{' '}
                        <span style={{ color: 'var(--muted)' }}>
                          {typeof scheme.eligibilityCriteria === 'string'
                            ? scheme.eligibilityCriteria
                            : JSON.stringify(scheme.eligibilityCriteria)}
                        </span>
                      </div>
                    )}
                    {scheme.documentsRequired && scheme.documentsRequired.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <strong style={{ fontSize: 13 }}>Documents Required:</strong>
                        <div className="tags-container" style={{ marginTop: 4 }}>
                          {scheme.documentsRequired.map((doc, i) => (
                            <span key={i} className="badge badge-muted">{doc}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
