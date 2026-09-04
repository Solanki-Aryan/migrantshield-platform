import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLE_LABELS = {
  worker: 'Worker',
  employer: 'Employer',
  labor_officer: 'Labor Officer',
  district_officer: 'District Officer',
  admin: 'Admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchUnread() {
      try {
        const res = await api.get('/notifications');
        if (!cancelled) {
          const count = (res.data.data || []).filter((n) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch {
        // Non-critical — silently ignore
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">🛡️ MigrantShield</div>
      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">{user.name || user.email}</span>
            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/notifications')}
              title="Notifications"
              style={{ position: 'relative', padding: '4px 10px' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#e53e3e',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  padding: '0 3px',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </>
        )}
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function getRoleBadgeClass(role) {
  switch (role) {
    case 'admin': return 'badge-danger';
    case 'employer': return 'badge-warning';
    case 'labor_officer':
    case 'district_officer': return 'badge-info';
    default: return 'badge-success';
  }
}
