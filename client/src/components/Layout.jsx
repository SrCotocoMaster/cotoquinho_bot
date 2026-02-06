import { useAuth } from '../hooks/useAuth';
import '../styles/index.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="layout-container">
      {/* Sidebar / Bottom Nav */}
      <aside className="sidebar">
        <h2 className="title-gradient" style={{ display: 'none' }}>Cotoquinho</h2>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ padding: '8px', cursor: 'pointer' }}>🏠 Dash</div>
          <div style={{ padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>⚙️ Config</div>
        </div>

        {user && (
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="desktop-user">
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.username}</p>
              <button onClick={logout} className="btn" style={{ padding: '0', fontSize: '0.7rem', color: '#ff4444', minHeight: 'unset' }}>Sair</button>
            </div>
            {user.avatar ? (
              <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} style={{ width: '38px', borderRadius: '50%' }} alt="Avatar" />
            ) : <div style={{ width: '38px', height: '38px', background: '#333', borderRadius: '50%' }}></div>}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
