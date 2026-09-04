import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const TYPE_ICONS = {
  scheme_eligible: '🏥',
  complaint_update: '📋',
  wage_alert: '💰',
  document_expiry: '📄',
  job_recommendation: '💼',
  safety_alert: '⚠️',
};

const WORKER_LINKS = [
  { path: '/worker/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/worker/profile', label: 'My Profile', icon: '👤' },
  { path: '/worker/skills', label: 'Skills', icon: '🎯' },
  { path: '/worker/welfare', label: 'Welfare Schemes', icon: '🏥' },
  { path: '/worker/wage', label: 'Wage Analysis', icon: '💰' },
  { path: '/worker/grievance', label: 'File Complaint', icon: '📋' },
  { path: '/worker/assistant', label: 'AI Assistant', icon: '🤖' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent — not critical
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Determine sidebar links based on role
  const sidebarLinks = WORKER_LINKS;
  const portalName = 'Notifications';

  return (
    <>
      <Navbar />
      <Sidebar links={sidebarLinks} portalName={portalName} />
      <div className="main-content">
        <div className="page-body">
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>🔔 Notifications</h1>
              <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}</p>
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? 'Marking…' : 'Mark all as read'}
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-wrapper">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <p style={{ color: 'var(--muted)' }}>No notifications yet. We'll let you know when something important happens.</p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {notifications.map((n, idx) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    background: n.isRead ? 'transparent' : 'rgba(59,130,212,0.05)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 15, color: 'var(--text)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    {!n.isRead && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--primary, #3b82d4)',
                      }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
