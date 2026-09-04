import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/schemes', label: 'Welfare Schemes', icon: '🏥' },
];

const EMPTY_FORM = {
  name: '',
  department: '',
  ministry: '',
  description: '',
  benefits: '',
  eligibilityCriteria: '',
  documentsRequired: '',
  targetBeneficiary: '',
  isActive: true,
};

export default function SchemeManagement() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  async function fetchSchemes() {
    setLoading(true);
    try {
      const res = await api.get('/welfare');
      setSchemes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load schemes.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function openEditForm(scheme) {
    setForm({
      name: scheme.name || '',
      department: scheme.department || '',
      ministry: scheme.ministry || '',
      description: scheme.description || scheme.benefits?.summary || '',
      benefits: scheme.benefits?.summary || scheme.description || '',
      eligibilityCriteria:
        typeof scheme.eligibilityCriteria === 'string'
          ? scheme.eligibilityCriteria
          : JSON.stringify(scheme.eligibilityCriteria || ''),
      documentsRequired: Array.isArray(scheme.documentsRequired)
        ? scheme.documentsRequired.join(', ')
        : scheme.documentsRequired || '',
      targetBeneficiary: scheme.targetBeneficiary || '',
      isActive: scheme.isActive !== false,
    });
    setEditingId(scheme._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.department) {
      setError('Name and department are required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      name: form.name,
      department: form.department,
      ministry: form.ministry,
      description: form.description,
      benefits: { summary: form.benefits },
      eligibilityCriteria: form.eligibilityCriteria,
      documentsRequired: form.documentsRequired
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      targetBeneficiary: form.targetBeneficiary,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        const res = await api.put(`/welfare/${editingId}`, payload);
        setSchemes((prev) =>
          prev.map((s) => (s._id === editingId ? res.data : s))
        );
        setSuccess('Scheme updated successfully.');
      } else {
        const res = await api.post('/welfare', payload);
        setSchemes((prev) => [res.data, ...prev]);
        setSuccess('Scheme created successfully.');
      }
      cancelForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this scheme?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/welfare/${id}`);
      setSchemes((prev) => prev.filter((s) => s._id !== id));
      setSuccess('Scheme deleted.');
    } catch {
      setError('Failed to delete scheme.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={ADMIN_LINKS} portalName="Admin Panel" />
      <div className="main-content">
        <div className="page-body">
          <div
            className="page-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <h1>Welfare Scheme Management</h1>
              <p>Create, edit, and manage all welfare schemes</p>
            </div>
            {!showForm && (
              <button className="btn btn-primary" onClick={openAddForm}>
                + Add Scheme
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-title">
                {editingId ? 'Edit Scheme' : 'Add New Scheme'}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Scheme Name *</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      className="form-control"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ministry</label>
                    <input
                      className="form-control"
                      name="ministry"
                      value={form.ministry}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Beneficiary</label>
                    <input
                      className="form-control"
                      name="targetBeneficiary"
                      placeholder="e.g. Migrant Workers"
                      value={form.targetBeneficiary}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Benefits Summary</label>
                  <textarea
                    className="form-control"
                    name="benefits"
                    rows={2}
                    placeholder="Describe the financial or other benefits..."
                    value={form.benefits}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Eligibility Criteria</label>
                  <textarea
                    className="form-control"
                    name="eligibilityCriteria"
                    rows={2}
                    placeholder="Who is eligible..."
                    value={form.eligibilityCriteria}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Documents Required (comma-separated)</label>
                  <input
                    className="form-control"
                    name="documentsRequired"
                    placeholder="Aadhaar Card, Bank Account, etc."
                    value={form.documentsRequired}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>
                    Active (visible to workers)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update Scheme' : 'Create Scheme'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Schemes Table */}
          {loading ? (
            <div className="loading-wrapper">Loading schemes...</div>
          ) : (
            <div className="card">
              <div className="section-title">All Schemes ({schemes.length})</div>
              {schemes.length === 0 ? (
                <div className="empty-state">No schemes found. Add one above.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Ministry</th>
                        <th>Beneficiary</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemes.map((s) => (
                        <tr key={s._id}>
                          <td>{s.name}</td>
                          <td>{s.department}</td>
                          <td>{s.ministry || '—'}</td>
                          <td>{s.targetBeneficiary || '—'}</td>
                          <td>
                            <span className={`badge ${s.isActive !== false ? 'badge-success' : 'badge-muted'}`}>
                              {s.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-row">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEditForm(s)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(s._id)}
                                disabled={deletingId === s._id}
                              >
                                {deletingId === s._id ? '…' : '🗑️ Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
