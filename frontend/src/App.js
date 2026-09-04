import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerProfile from './pages/worker/WorkerProfile';
import SkillMapping from './pages/worker/SkillMapping';
import WelfareSchemes from './pages/worker/WelfareSchemes';
import WageAnalysis from './pages/worker/WageAnalysis';
import GrievanceForm from './pages/worker/GrievanceForm';
import AIAssistant from './pages/worker/AIAssistant';

// Employer pages
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerProfile from './pages/employer/EmployerProfile';
import ComplianceView from './pages/employer/ComplianceView';

// Government pages
import GovDashboard from './pages/government/GovDashboard';
import WorkerMap from './pages/government/WorkerMap';
import WelfareAnalytics from './pages/government/WelfareAnalytics';
import WageMonitor from './pages/government/WageMonitor';
import GrievanceMonitor from './pages/government/GrievanceMonitor';
import EmployerMonitor from './pages/government/EmployerMonitor';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SchemeManagement from './pages/admin/SchemeManagement';

// Notifications
import Notifications from './pages/Notifications';

const GOV_ROLES = ['labor_officer', 'district_officer'];

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrapper">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'worker': return <Navigate to="/worker/dashboard" replace />;
    case 'employer': return <Navigate to="/employer/dashboard" replace />;
    case 'labor_officer':
    case 'district_officer': return <Navigate to="/gov/dashboard" replace />;
    case 'admin': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function UnauthorizedPage() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h2 style={{ marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--muted)' }}>
          You don't have permission to view this page.
        </p>
        <a href="/" style={{ marginTop: 16, display: 'inline-block' }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Worker routes */}
          <Route
            path="/worker/dashboard"
            element={
              <PrivateRoute role="worker">
                <WorkerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/profile"
            element={
              <PrivateRoute role="worker">
                <WorkerProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/skills"
            element={
              <PrivateRoute role="worker">
                <SkillMapping />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/welfare"
            element={
              <PrivateRoute role="worker">
                <WelfareSchemes />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/wage"
            element={
              <PrivateRoute role="worker">
                <WageAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/grievance"
            element={
              <PrivateRoute role="worker">
                <GrievanceForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/worker/assistant"
            element={
              <PrivateRoute role="worker">
                <AIAssistant />
              </PrivateRoute>
            }
          />

          {/* Employer routes */}
          <Route
            path="/employer/dashboard"
            element={
              <PrivateRoute role="employer">
                <EmployerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employer/profile"
            element={
              <PrivateRoute role="employer">
                <EmployerProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/employer/compliance"
            element={
              <PrivateRoute role="employer">
                <ComplianceView />
              </PrivateRoute>
            }
          />

          {/* Government routes */}
          <Route
            path="/gov/dashboard"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <GovDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/gov/workers"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <WorkerMap />
              </PrivateRoute>
            }
          />
          <Route
            path="/gov/welfare"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <WelfareAnalytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/gov/wages"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <WageMonitor />
              </PrivateRoute>
            }
          />
          <Route
            path="/gov/grievances"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <GrievanceMonitor />
              </PrivateRoute>
            }
          />
          <Route
            path="/gov/employers"
            element={
              <PrivateRoute role={GOV_ROLES}>
                <EmployerMonitor />
              </PrivateRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute role="admin">
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/schemes"
            element={
              <PrivateRoute role="admin">
                <SchemeManagement />
              </PrivateRoute>
            }
          />

          {/* Notifications — all authenticated roles */}
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
