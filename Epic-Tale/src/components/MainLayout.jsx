import { Outlet, Link } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div id="app">
      <header>
        <div className="logo">
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <img 
              src="" 
              alt="Benchwarmers Logo" 
              style={{ height: '40px', display: 'block', border: '1px solid rgba(255,255,255,0.2)' }} 
            />
          </Link>
        </div>
        <div className="search-container">
          <input type="text" className="search-bar" placeholder="search" />
        </div>
        <div className="header-actions">
          <Link to="/add">
            <button className="btn-nav">ADD +</button>
          </Link>
          <Link to="/">
            <button className="btn-icon">
              <img 
                src="" 
                alt="Home" 
                style={{ width: '24px', height: '24px', display: 'block', border: '1px solid rgba(255,255,255,0.2)' }} 
              />
            </button>
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        Copyright The Benchwarmers 2026.
      </footer>
    </div>
  );
}
