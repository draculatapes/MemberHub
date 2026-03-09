import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Members</h3>
          <p className="stat-value">{analytics?.total_members || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Active Members</h3>
          <p className="stat-value">{analytics?.active_members || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Certificates Issued</h3>
          <p className="stat-value">{analytics?.certificates_issued || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${analytics?.total_revenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="tier-distribution">
        <h2>Membership Tier Distribution</h2>
        <div className="tier-bars">
          <div className="tier-item">
            <span>Basic</span>
            <div className="bar">
              <div 
                className="bar-fill basic" 
                style={{width: `${analytics?.tier_distribution?.basic || 0}%`}}
              ></div>
            </div>
            <span className="count">{analytics?.tier_distribution?.basic || 0}</span>
          </div>

          <div className="tier-item">
            <span>Premium</span>
            <div className="bar">
              <div 
                className="bar-fill premium" 
                style={{width: `${analytics?.tier_distribution?.premium || 0}%`}}
              ></div>
            </div>
            <span className="count">{analytics?.tier_distribution?.premium || 0}</span>
          </div>

          <div className="tier-item">
            <span>Gold</span>
            <div className="bar">
              <div 
                className="bar-fill gold" 
                style={{width: `${analytics?.tier_distribution?.gold || 0}%`}}
              ></div>
            </div>
            <span className="count">{analytics?.tier_distribution?.gold || 0}</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <button className="btn-primary" onClick={() => navigate('/members')}>
          View Members
        </button>
        <button className="btn-secondary" onClick={() => navigate('/analytics')}>
          View Analytics
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
