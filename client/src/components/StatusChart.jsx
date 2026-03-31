const STATUS_ORDER = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function StatusChart({ stats }) {
  const maxValue = Math.max(1, ...STATUS_ORDER.map((status) => stats.byStatus?.[status] || 0));

  return (
    <section className="content-card">
      <div className="section-header">
        <div>
          <h2>Status Breakdown</h2>
          <p className="muted-text">A quick visual of where your opportunities currently stand.</p>
        </div>
        <span className="results-pill">{stats.total} total</span>
      </div>

      <div style={{ display: 'grid', gap: '14px' }}>
        {STATUS_ORDER.map((status) => {
          const value = stats.byStatus?.[status] || 0;
          const width = `${(value / maxValue) * 100}%`;

          return (
            <div key={status} style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700 }}>
                <span>{status}</span>
                <span className="muted-text">{value}</span>
              </div>
              <div style={{ height: '12px', borderRadius: '999px', background: '#e9eff6', overflow: 'hidden' }}>
                <div
                  style={{
                    width,
                    height: '100%',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #0a66c2, #57a4f5)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
