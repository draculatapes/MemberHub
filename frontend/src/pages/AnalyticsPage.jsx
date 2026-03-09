import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Analytics.css';

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="analytics-container">
      <h1>Analytics Dashboard</h1>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Members</h3>
          <p className="analytics-value">{analytics?.total_members || 0}</p>
          <span className="analytics-label">All time registrations</span>
        </div>

        <div className="analytics-card">
          <h3>Active Members</h3>
          <p className="analytics-value">{analytics?.active_members || 0}</p>
          <span className="analytics-label">Currently active</span>
        </div>

        <div className="analytics-card">
          <h3>Certificates</h3>
          <p className="analytics-value">{analytics?.certificates_issued || 0}</p>
          <span className="analytics-label">Certificates issued</span>
        </div>

        <div className="analytics-card">
          <h3>Total Revenue</h3>
          <p className="analytics-value">${(analytics?.total_revenue || 0).toFixed(2)}</p>
          <span className="analytics-label">From all payments</span>
        </div>
      </div>

      <div className="tier-analytics">
        <h2>Tier Distribution</h2>
        <div className="tier-list">
          <div className="tier-row">
            <span>Basic Tier</span>
            <span className="tier-count">{analytics?.tier_distribution?.basic || 0} members</span>
            <div className="tier-bar">
              <div className="tier-fill basic" 
                style={{width: `${Math.max(10, (analytics?.tier_distribution?.basic / Math.max(1, analytics?.total_members)) * 100) || 0}%`}}>
              </div>
            </div>
          </div>

          <div className="tier-row">
            <span>Premium Tier</span>
            <span className="tier-count">{analytics?.tier_distribution?.premium || 0} members</span>
            <div className="tier-bar">
              <div className="tier-fill premium" 
                style={{width: `${Math.max(10, (analytics?.tier_distribution?.premium / Math.max(1, analytics?.total_members)) * 100) || 0}%`}}>
              </div>
            </div>
          </div>

          <div className="tier-row">
            <span>Gold Tier</span>
            <span className="tier-count">{analytics?.tier_distribution?.gold || 0} members</span>
            <div className="tier-bar">
              <div className="tier-fill gold" 
                style={{width: `${Math.max(10, (analytics?.tier_distribution?.gold / Math.max(1, analytics?.total_members)) * 100) || 0}%`}}>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
