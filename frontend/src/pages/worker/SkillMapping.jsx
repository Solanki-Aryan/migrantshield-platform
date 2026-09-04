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

export default function SkillMapping() {
  const { user } = useAuth();
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await api.get(`/workers/${user._id}`);
        setSkills(res.data.skills || []);
      } catch {}
    }
    if (user?._id) loadSkills();
  }, [user]);

  async function handleExtract() {
    if (!experience.trim()) {
      setError('Please describe your work experience first.');
      return;
    }
    setExtracting(true);
    setError('');
    try {
      const res = await api.post('/ai/extract-skills', {
        text: experience,
        workerId: user._id,
      });
      const extracted = res.data.skills || res.data.extractedSkills || [];
      // Merge without duplicates
      const merged = Array.from(new Set([...skills, ...extracted]));
      setSkills(merged);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract skills. Please try again.');
    } finally {
      setExtracting(false);
    }
  }

  function removeSkill(skill) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/workers/${user._id}`, { skills });
      setSuccess('Skills saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save skills.');
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
          <div className="page-header">
            <h1>Skill Mapping</h1>
            <p>Describe your work experience and let AI extract your skills</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title">Step 1: Describe Your Work Experience</div>
            <div className="form-group">
              <label className="form-label">
                Describe your past jobs, tasks, and expertise
              </label>
              <textarea
                className="form-control"
                rows={6}
                placeholder="E.g.: I have worked as a construction worker for 5 years in Mumbai. I have experience in masonry, plastering walls, laying bricks, and basic plumbing. I also worked as a helper in a textile factory operating sewing machines..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExtract}
              disabled={extracting}
            >
              {extracting ? '⏳ Extracting...' : '🤖 Extract Skills with AI'}
            </button>
          </div>

          <div className="card">
            <div className="section-title">
              Step 2: Review & Confirm Skills
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>
                ({skills.length} skills)
              </span>
            </div>

            {skills.length === 0 ? (
              <div className="empty-state">
                No skills yet. Extract from your experience description above.
              </div>
            ) : (
              <>
                <div className="tags-container">
                  {skills.map((skill, i) => (
                    <span key={i} className="tag">
                      {skill}
                      <span
                        className="tag-remove"
                        onClick={() => removeSkill(skill)}
                        title="Remove"
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
                  Click × to remove any incorrectly extracted skills.
                </p>
              </>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || skills.length === 0}
              >
                {saving ? 'Saving...' : '💾 Save Skills to Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
