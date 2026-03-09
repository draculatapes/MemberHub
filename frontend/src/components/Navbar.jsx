import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('user_role');
  const name = localStorage.getItem('user_name');

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <h2>Member<span>Hub</span></h2>
        </Link>

        <ul className="nav-menu">
          <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
          {role === 'admin' && (
            <>
              <li><Link to="/members" className={isActive('/members')}>Members</Link></li>
              <li><Link to="/analytics" className={isActive('/analytics')}>Analytics</Link></li>
            </>
          )}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {name && <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{name}</span>}
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
