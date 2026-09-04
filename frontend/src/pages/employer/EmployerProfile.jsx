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

export default function EmployerProfile() {
  const { user } = useAuth();
  const [employer, setEmployer] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchEmployer() {
      try {
        const res = await api.get(`/employers/${user._id}`);
        setEmployer(res.data);
        setForm(flattenEmployer(res.data));
      } catch {
        setError('Failed to load company profile.');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchEmployer();
  }, [user]);

  function flattenEmployer(e) {
    return {
      companyName: e.companyName || '',
      industry: e.industry || '',
      sector: e.sector || '',
      contactEmail: e.contactEmail || '',
      contactPhone: e.contactPhone || '',
      registrationNumber: e.registrationNumber || '',
      workerCount: e.workerCount || '',
      locations: Array.isArray(e.locations) ? e.locations.join(', ') : (e.locations || ''),
      address: e.address || '',
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
        companyName: form.companyName,
        industry: form.industry,
        sector: form.sector,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        registrationNumber: form.registrationNumber,
        workerCount: Number(form.workerCount),
        locations: form.locations.split(',').map((l) => l.trim()).filter(Boolean),
        address: form.address,
      };
      const res = await api.put(`/employers/${user._id}`, payload);
      setEmployer(res.data);
      setSuccess('Company profile updated successfully.');
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
      <Sidebar links={EMPLOYER_LINKS} portalName="Employer Portal" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Company Profile</h1>
              <p>Manage your company information</p>
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

          {!loading && employer && (
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="card">
                  <div className="section-title">Company Information</div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      className="form-control"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input
                      className="form-control"
                      name="industry"
                      value={form.industry}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
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
                    <label className="form-label">Registration Number</label>
                    <input
                      className="form-control"
                      name="registrationNumber"
                      value={form.registrationNumber}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="card">
                  <div className="section-title">Contact & Workforce</div>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      className="form-control"
                      type="email"
                      name="contactEmail"
                      value={form.contactEmail}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      className="form-control"
                      name="contactPhone"
                      value={form.contactPhone}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Worker Count</label>
                    <input
                      className="form-control"
                      type="number"
                      name="workerCount"
                      value={form.workerCount}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Operating Locations (comma-separated)</label>
                    <input
                      className="form-control"
                      name="locations"
                      placeholder="e.g. Mumbai, Pune, Delhi"
                      value={form.locations}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registered Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      rows={3}
                      value={form.address}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              {editing && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setForm(flattenEmployer(employer));
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
