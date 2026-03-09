import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MemberDetail.css';

function MemberDetailPage() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMember(response.data);
    } catch (err) {
      setError('Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `/api/certificates/generate?member_id=${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Certificate generated successfully!');
      fetchMember();
    } catch (err) {
      alert('Failed to generate certificate');
    }
  };

  const handleUpgradeTier = async (newTier) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `/api/members/${id}/upgrade-tier?new_tier=${newTier}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tier upgraded successfully!');
      fetchMember();
    } catch (err) {
      alert('Failed to upgrade tier');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container error-message">{error}</div>;
  if (!member) return <div className="container">Member not found</div>;

  return (
    <div className="member-detail-container">
      <button className="btn-back" onClick={() => navigate('/members')}>
        ← Back to Members
      </button>

      <div className="member-card">
        <h1>{member.name}</h1>

        <div className="member-info">
          <div className="info-group">
            <label>Email</label>
            <p>{member.email}</p>
          </div>

          <div className="info-group">
            <label>Phone</label>
            <p>{member.phone || 'N/A'}</p>
          </div>

          <div className="info-group">
            <label>Current Tier</label>
            <p><span className={`badge badge-${member.tier}`}>{member.tier}</span></p>
          </div>

          <div className="info-group">
            <label>Status</label>
            <p><span className={`status status-${member.status}`}>{member.status}</span></p>
          </div>

          <div className="info-group">
            <label>Joined Date</label>
            <p>{new Date(member.joined_date).toLocaleDateString()}</p>
          </div>

          <div className="info-group">
            <label>Tier Expiry</label>
            <p>{new Date(member.tier_expiry_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="member-actions">
          <button
            className="btn-primary"
            onClick={handleGenerateCertificate}
            disabled={member.certificate_issued}
          >
            {member.certificate_issued ? 'Certificate Issued' : 'Generate Certificate'}
          </button>



          <div className="upgrade-tier">
            <label>Upgrade Tier:</label>
            {member.tier !== 'basic' && (
              <button onClick={() => handleUpgradeTier('basic')}>Basic</button>
            )}
            {member.tier !== 'premium' && (
              <button onClick={() => handleUpgradeTier('premium')}>Premium</button>
            )}
            {member.tier !== 'gold' && (
              <button onClick={() => handleUpgradeTier('gold')}>Gold</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberDetailPage;
