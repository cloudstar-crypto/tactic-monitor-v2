function EngineerCard({ engineer }) {
  const getProgressColor = (progress) => {
    if (progress >= 80) return '#4a7c4e';
    if (progress >= 50) return '#c9714d';
    return '#8b3a3a';
  };

  return (
    <div style={{
      border: '2px solid #8b7355',
      padding: '15px',
      backgroundColor: '#1a1e3f',
    }}>
      <h3 style={{ marginBottom: '10px' }}>{engineer.name || 'Unknown'}</h3>
      <p style={{ fontSize: '14px', marginBottom: '10px' }}>
        任務：{engineer.task || 'N/A'}
      </p>
      <div style={{
        backgroundColor: '#0a0e27',
        overflow: 'hidden',
        height: '20px',
        marginBottom: '10px',
      }}>
        <div
          style={{
            backgroundColor: getProgressColor(engineer.progress || 0),
            width: `${engineer.progress || 0}%`,
            height: '100%',
          }}
        />
      </div>
      <p style={{ fontSize: '12px', color: '#888' }}>
        進度：{engineer.progress || 0}%
      </p>
    </div>
  );
}

export default EngineerCard;
