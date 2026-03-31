function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ApplicationList({ applications, onDelete, onEdit }) {
  return (
    <div className="content-card list-card">
      <div className="section-header">
        <div>
          <h2>Applications</h2>
          <p className="muted-text">A polished snapshot of each company, role, and next step.</p>
        </div>
        <span className="results-pill">{applications.length} shown</span>
      </div>
      {applications.length === 0 ? (
        <div className="empty-state compact-empty">
          <i className="bx bx-folder-open" />
          <p>No applications match your current filter.</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((app) => (
            <article className="application-row" key={app.id}>
              <div className="application-row-main">
                <div className="company-badge">{(app.company || '?').slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="row-title-line">
                    <h3>{app.company}</h3>
                    <span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span>
                  </div>
                  <p className="role-line">{app.role}</p>
                  <div className="meta-line wrap">
                    <span><i className="bx bx-calendar" /> {formatDate(app.appliedDate)}</span>
                    {app.location ? <span><i className="bx bx-map" /> {app.location}</span> : null}
                    {app.salaryRange ? <span><i className="bx bx-wallet" /> {app.salaryRange}</span> : null}
                    {app.jobLink ? <a href={app.jobLink} target="_blank" rel="noreferrer"><i className="bx bx-link-external" /> View posting</a> : null}
                  </div>
                  {app.notes ? <p className="notes-line">{app.notes}</p> : null}
                </div>
              </div>

              <div className="row-actions">
                <button className="secondary-button icon-button" onClick={() => onEdit(app)}>
                  <i className="bx bx-edit-alt" /> Edit
                </button>
                <button className="danger-button icon-button" onClick={() => onDelete(app.id)}>
                  <i className="bx bx-trash" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
