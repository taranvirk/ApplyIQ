import { useCallback, useEffect, useMemo, useState } from 'react';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationList from '../components/ApplicationList';
import StatsCards from '../components/StatsCards';
import StatusChart from '../components/StatusChart';
import { createApplication, deleteApplication, listApplications, listJobDescriptions, updateApplication, upsertJobDescription } from '../lib/supabase';

function normalizeApplication(app, jdMap = {}) {
  return {
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
    appliedDate: app.applied_date || '',
    jobLink: app.job_link || '',
    notes: app.notes || '',
    location: app.location || '',
    salaryRange: app.salary_range || '',
    jdText: jdMap[app.id] || ''
  };
}

export default function DashboardPage({ session, user }) {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('');
  const [editingApplication, setEditingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const apps = await listApplications(user.id, session.access_token);
      const appIds = apps.map((app) => app.id);
      const descriptions = await listJobDescriptions(user.id, appIds, session.access_token);
      const jdMap = descriptions.reduce((acc, item) => {
        if (!acc[item.application_id]) acc[item.application_id] = item.content || '';
        return acc;
      }, {});

      setApplications(apps.map((app) => normalizeApplication(app, jdMap)));
    } catch (err) {
      setError(err.message || 'Could not load applications from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [session.access_token, user.id]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const appPayload = {
        user_id: user.id,
        company: payload.company,
        role: payload.role,
        status: payload.status,
        applied_date: payload.appliedDate || null,
        job_link: payload.jobLink || null,
        notes: payload.notes || null,
        location: payload.location || null,
        salary_range: payload.salaryRange || null
      };

      let applicationId = editingApplication?.id;

      if (editingApplication) {
        await updateApplication(editingApplication.id, user.id, appPayload, session.access_token);
      } else {
        const inserted = await createApplication(appPayload, session.access_token);
        applicationId = inserted.id;
      }

      await upsertJobDescription(
        {
          applicationId,
          userId: user.id,
          content: payload.jdText || ''
        },
        session.access_token
      );

      setEditingApplication(null);
      setSuccess(editingApplication ? 'Application updated.' : 'Application saved.');
      await loadApplications();
    } catch (err) {
      setError(err.message || 'Could not save the application.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      setSuccess('');
      await deleteApplication(id, user.id, session.access_token);
      if (editingApplication?.id === id) setEditingApplication(null);
      setSuccess('Application deleted.');
      await loadApplications();
    } catch (err) {
      setError(err.message || 'Could not delete the application.');
    }
  };

  const filteredApplications = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return applications;

    return applications.filter((app) => {
      return [app.company, app.role, app.status, app.notes, app.location, app.salaryRange]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [applications, filter]);

  const stats = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        acc.total += 1;
        acc.byStatus[app.status] = (acc.byStatus[app.status] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} }
    );
  }, [applications]);

  const interviews = stats.byStatus?.Interview || 0;
  const offers = stats.byStatus?.Offer || 0;
  const conversion = stats.total ? Math.round(((interviews + offers) / stats.total) * 100) : 0;

  return (
    <div className="feed-stack">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Application command center</span>
          <h1>Stay organized through every stage of your job search.</h1>
          <p>Manage applications in Supabase, keep notes together, and present your work in a polished dashboard that feels like a real SaaS product.</p>
        </div>
        <div className="hero-metrics">
          <div>
            <span>Pipeline conversion</span>
            <strong>{conversion}%</strong>
          </div>
          <div>
            <span>Interviews + offers</span>
            <strong>{interviews + offers}</strong>
          </div>
        </div>
      </section>

      <section className="composer-card">
        <div className="page-header tight">
          <div>
            <h2>Your pipeline</h2>
            <p>Search by company, role, status, or notes.</p>
          </div>
          <label className="search-wrap light">
            <i className="bx bx-search" />
            <input
              className="filter-input"
              placeholder="Search applications"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
        </div>
      </section>

      {error ? <div className="alert error"><i className="bx bx-error-circle" /> {error}</div> : null}
      {success ? <div className="alert success"><i className="bx bx-check-circle" /> {success}</div> : null}

      <StatsCards stats={stats} />

      <div className="content-grid">
        <div className="main-column">
          <StatusChart stats={stats} />
          {loading ? (
            <div className="content-card loading-card"><i className="bx bx-loader-alt bx-spin" /> Loading applications...</div>
          ) : (
            <ApplicationList
              applications={filteredApplications}
              onDelete={handleDelete}
              onEdit={setEditingApplication}
            />
          )}
        </div>

        <div className="side-column">
          <ApplicationForm
            key={editingApplication?.id ?? 'new'}
            onSubmit={handleSubmit}
            editingApplication={editingApplication}
            onCancelEdit={() => setEditingApplication(null)}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
