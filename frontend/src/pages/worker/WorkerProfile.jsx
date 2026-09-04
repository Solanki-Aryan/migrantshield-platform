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

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir',
];

export default function WorkerProfile() {
  const { user } = useAuth();
  const [worker, setWorker] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchWorker() {
      try {
        const res = await api.get(`/workers/${user._id}`);
        setWorker(res.data);
        setForm(flattenWorker(res.data));
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchWorker();
  }, [user]);

  function flattenWorker(w) {
    return {
      name: w.name || '',
      mobile: w.mobile || '',
      dob: w.dob ? w.dob.split('T')[0] : '',
      gender: w.gender || '',
      originState: w.originState || '',
      currentState: w.currentState || '',
      currentDistrict: w.currentDistrict || '',
      sector: w.employment?.sector || '',
      occupation: w.employment?.occupation || '',
      employerName: w.employment?.employerName || '',
      yearsOfExperience: w.employment?.yearsOfExperience || '',
    };
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        dob: form.dob,
        gender: form.gender,
        originState: form.originState,
        currentState: form.currentState,
        currentDistrict: form.currentDistrict,
        employment: {
          sector: form.sector,
          occupation: form.occupation,
          employerName: form.employerName,
          yearsOfExperience: Number(form.yearsOfExperience),
        },
      };
      const res = await api.put(`/workers/${user._id}`, payload);
      setWorker(res.data);
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>My Profile</h1>
              <p>View and manage your personal information</p>
            </div>
            {!editing && (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {loading && <div className="loading-wrapper">Loading...</div>}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!loading && worker && (
            <form onSubmit={handleSave}>
              <div className="grid-2" style={{ gap: 20 }}>
                {/* Personal Info */}
                <div className="card">
                  <div className="section-title">Personal Information</div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input
                      className="form-control"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      className="form-control"
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      disabled={!editing}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div className="card">
                  <div className="section-title">Location</div>
                  <div className="form-group">
                    <label className="form-label">Origin State</label>
                    <select
                      className="form-control"
                      name="originState"
                      value={form.originState}
                      onChange={handleChange}
                      disabled={!editing}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current State</label>
                    <select
                      className="form-control"
                      name="currentState"
                      value={form.currentState}
                      onChange={handleChange}
                      disabled={!editing}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current District</label>
                    <input
                      className="form-control"
                      name="currentDistrict"
                      value={form.currentDistrict}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>

                {/* Employment */}
                <div className="card">
                  <div className="section-title">Employment</div>
                  <div className="form-group">
                    <label className="form-label">Sector</label>
                    <input
                      className="form-control"
                      name="sector"
                      value={form.sector}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Occupation</label>
                    <input
                      className="form-control"
                      name="occupation"
                      value={form.occupation}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employer Name</label>
                    <input
                      className="form-control"
                      name="employerName"
                      value={form.employerName}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input
                      className="form-control"
                      type="number"
                      name="yearsOfExperience"
                      value={form.yearsOfExperience}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="card">
                  <div className="section-title">Skills</div>
                  {worker.skills && worker.skills.length > 0 ? (
                    <div className="tags-container">
                      {worker.skills.map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 20 }}>
                      No skills listed. Use the{' '}
                      <a href="/worker/skills">Skills page</a> to add them.
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="section-title">Documents</div>
                {worker.documents && worker.documents.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Filename</th>
                          <th>Status</th>
                          <th>Uploaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worker.documents.map((doc, i) => (
                          <tr key={i}>
                            <td>{doc.type || doc.documentType}</td>
                            <td>{doc.filename || doc.name || '—'}</td>
                            <td>
                              <span className={`badge ${docStatusBadge(doc.status)}`}>
                                {doc.status || 'uploaded'}
                              </span>
                            </td>
                            <td>
                              {doc.uploadedAt
                                ? new Date(doc.uploadedAt).toLocaleDateString()
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">No documents uploaded yet.</div>
                )}
              </div>

              {editing && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setForm(flattenWorker(worker));
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function docStatusBadge(status) {
  switch (status) {
    case 'verified': return 'badge-success';
    case 'rejected': return 'badge-danger';
    case 'pending': return 'badge-warning';
    default: return 'badge-info';
  }
}
