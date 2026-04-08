function Header({ isAuthenticated, onLogout }) {
  return (
    <header style={{
      backgroundColor: '#1a1e3f',
      borderBottom: '3px solid #8b7355',
      padding: '20px',
      textAlign: 'center',
    }}>
      <h1>⚔️ TACTIC MONITOR V2 ⚔️</h1>
      <p style={{ fontSize: '14px', marginTop: '10px' }}>
        FAE 工程師進度監控系統
      </p>
      {isAuthenticated && (
        <button onClick={onLogout} style={{ marginTop: '15px' }}>
          LOGOUT
        </button>
      )}
    </header>
  );
}

export default Header;
