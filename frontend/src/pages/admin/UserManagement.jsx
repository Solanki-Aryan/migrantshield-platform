import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/schemes', label: 'Welfare Schemes', icon: '🏥' },
];

const ALL_ROLES = ['worker', 'employer', 'labor_officer', 'district_officer', 'admin'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      // Try /auth/users, fall back to /dashboard/stats if needed
      const res = await api.get('/auth/users');
      setUsers(Array.isArray(res.data) ? res.data : (res.data.users || []));
    } catch {
      // fallback: empty
      setUsers([]);
      setError('Could not load users from /api/auth/users. Ensure the endpoint exists.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user) {
    setUpdatingId(user._id);
    try {
      await api.put(`/auth/users/${user._id}`, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch {
      setError('Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeRole(user, newRole) {
    setUpdatingId(user._id);
    try {
      await api.put(`/auth/users/${user._id}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch {
      setError('Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar />
      <Sidebar links={ADMIN_LINKS} portalName="Admin Panel" />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header">
            <h1>User Management</h1>
            <p>View and manage all registered platform users</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-wrapper">Loading users...</div>
          ) : (
            <div className="card">
              <div className="section-title">All Users ({filtered.length})</div>
              {filtered.length === 0 ? (
                <div className="empty-state">No users found.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name || '—'}</td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '3px 6px', fontSize: 12, width: 140 }}
                              value={u.role}
                              onChange={(e) => changeRole(u, e.target.value)}
                              disabled={updatingId === u._id}
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                              {u.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${u.isActive !== false ? 'btn-danger' : 'btn-secondary'}`}
                              onClick={() => toggleActive(u)}
                              disabled={updatingId === u._id}
                            >
                              {updatingId === u._id
                                ? '…'
                                : u.isActive !== false
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
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
