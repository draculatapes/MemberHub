import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <h2>MemberHub</h2>
        </Link>

        <ul className="nav-menu">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/members">Members</Link></li>
          <li><Link to="/analytics">Analytics</Link></li>
        </ul>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
