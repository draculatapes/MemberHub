import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

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
          <li><Link to="/members" className={isActive('/members')}>Members</Link></li>
          <li><Link to="/analytics" className={isActive('/analytics')}>Analytics</Link></li>
        </ul>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
