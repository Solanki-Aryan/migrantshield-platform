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

const CATEGORIES = [
  'Wage Theft', 'Unsafe Working Conditions', 'Harassment', 'Discrimination',
  'Forced Labour', 'Non-payment of Benefits', 'Contract Violation', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir',
];

const STEP_LABELS = ['Issue Details', 'Location & Employer', 'Evidence'];

export default function GrievanceForm() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category: '',
    description: '',
    isAnonymous: false,
    state: '',
    district: '',
    workplace: '',
    employerName: '',
    employerContact: '',
    evidenceFiles: [],
  });
  const [grievances, setGrievances] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [complaintId, setComplaintId] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    fetchGrievances();
  }, []);

  async function fetchGrievances() {
    try {
      const res = await api.get('/grievances');
      setGrievances(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoadingComplaints(false); }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, evidenceFiles: files }));
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!form.category || !form.description.trim()) {
        setError('Please select a category and describe the issue.');
        return;
      }
    }
    if (step === 2) {
      if (!form.state || !form.district) {
        setError('Please fill in the state and district.');
        return;
      }
    }
    setStep((s) => s + 1);
  }

  function prevStep() {
    setError('');
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('isAnonymous', form.isAnonymous);
      formData.append('state', form.state);
      formData.append('district', form.district);
      formData.append('workplace', form.workplace);
      formData.append('employerName', form.employerName);
      formData.append('employerContact', form.employerContact);
      form.evidenceFiles.forEach((file) => formData.append('evidence', file));

      const res = await api.post('/grievances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComplaintId(res.data._id || res.data.complaintId || 'Filed');
      setForm({
        category: '', description: '', isAnonymous: false,
        state: '', district: '', workplace: '',
        employerName: '', employerContact: '', evidenceFiles: [],
      });
      setPreviewUrls([]);
      setStep(1);
      fetchGrievances();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>File a Complaint</h1>
            <p>Report workplace issues to the appropriate authorities</p>
          </div>

          {complaintId && (
            <div className="alert alert-success">
              ✅ Complaint filed successfully! Your Complaint ID:{' '}
              <strong>{complaintId}</strong>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ marginBottom: 24 }}>
            {/* Step Indicator */}
            <div className="step-indicator">
              {STEP_LABELS.map((label, i) => (
                <div
                  key={i}
                  className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
                >
                  <div className="step-circle">
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <div className="step-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Step 1: Issue Details */}
            {step === 1 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows={5}
                    placeholder="Describe the issue in detail..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="anon"
                    name="isAnonymous"
                    checked={form.isAnonymous}
                    onChange={handleChange}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="anon" style={{ margin: 0, cursor: 'pointer' }}>
                    Submit anonymously
                  </label>
                </div>
                <button className="btn btn-primary" onClick={nextStep}>
                  Next →
                </button>
              </div>
            )}

            {/* Step 2: Location & Employer */}
            {step === 2 && (
              <div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <select
                      className="form-control"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <input
                      className="form-control"
                      name="district"
                      placeholder="e.g. Pune"
                      value={form.district}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Workplace Address</label>
                  <input
                    className="form-control"
                    name="workplace"
                    placeholder="Work site or workplace address"
                    value={form.workplace}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Employer Name</label>
                    <input
                      className="form-control"
                      name="employerName"
                      value={form.employerName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employer Contact</label>
                    <input
                      className="form-control"
                      name="employerContact"
                      value={form.employerContact}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={prevStep}>← Back</button>
                  <button className="btn btn-primary" onClick={nextStep}>Next →</button>
                </div>
              </div>
            )}

            {/* Step 3: Evidence */}
            {step === 3 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Upload Evidence (optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFiles}
                  />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    Accepted: images and videos up to 10MB each
                  </p>
                </div>
                {previewUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {previewUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`evidence-${i}`}
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={prevStep}>← Back</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : '📤 Submit Complaint'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* My Complaints Table */}
          <div className="card">
            <div className="section-title">My Complaints</div>
            {loadingComplaints ? (
              <div className="loading-wrapper">Loading...</div>
            ) : grievances.length === 0 ? (
              <div className="empty-state">No complaints filed yet.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Location</th>
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
