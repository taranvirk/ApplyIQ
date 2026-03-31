const cardConfig = [
  { key: 'total', label: 'Total Applications', icon: 'bx-briefcase-alt-2', tone: 'tone-blue' },
  { key: 'applied', label: 'Applied', icon: 'bx-send', tone: 'tone-indigo' },
  { key: 'interview', label: 'Interviews', icon: 'bx-calendar-check', tone: 'tone-amber' },
  { key: 'offer', label: 'Offers', icon: 'bx-trophy', tone: 'tone-green' }
];

export default function StatsCards({ stats }) {
  const applied = stats.byStatus?.Applied || 0;
  const interview = stats.byStatus?.Interview || 0;
  const offer = stats.byStatus?.Offer || 0;

  const values = {
    total: stats.total,
    applied,
    interview,
    offer
  };

  const meta = {
    total: 'All roles tracked in your pipeline',
    applied: 'Applications currently sent',
    interview: 'Roles that advanced to interviews',
    offer: 'Opportunities with an offer stage'
  };

  return (
    <section className="stats-grid">
      {cardConfig.map((card) => (
        <article key={card.key} className={`content-card stat-card ${card.tone}`}>
          <div className="stat-meta">
            <div>
              <span className="eyebrow" style={{ color: '#64748b', opacity: 1 }}>{card.label}</span>
              <h3>{values[card.key]}</h3>
            </div>
            <div className="stat-icon-wrap">
              <i className={`bx ${card.icon}`} />
            </div>
          </div>
          <p className="muted-text" style={{ margin: '10px 0 0' }}>{meta[card.key]}</p>
        </article>
      ))}
    </section>
  );
}
