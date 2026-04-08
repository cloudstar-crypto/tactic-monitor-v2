import TacticCard from './TacticCard';

function SquadPanel({ squad }) {
  const { name, colorPrimary, colorAccent, captainStats, memberStats } = squad;

  return (
    <section
      className="sq-panel"
      style={{
        '--sq-primary': colorPrimary,
        '--sq-accent': colorAccent,
      }}
    >
      <header className="sq-header">
        <div className="sq-header-bar" />
        <h2 className="sq-title">{name}</h2>
        <div className="sq-meta">
          {memberStats.length} OPERATIVES
        </div>
      </header>

      <div className="sq-captain-slot">
        <TacticCard data={captainStats} variant="captain" />
      </div>

      <div className="sq-members-grid">
        {memberStats.map((m) => (
          <TacticCard key={m.id} data={m} variant="member" />
        ))}
      </div>
    </section>
  );
}

export default SquadPanel;
