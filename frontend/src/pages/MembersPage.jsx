import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Members.css';

function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    organization: '',
    tier: 'basic',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `/api/admin/add-member?tier=${formData.tier}`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          organization: formData.organization || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', phone: '', organization: '', tier: 'basic' });
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create member');
    }
  };

  const getTierBadgeClass = (tier) => {
    return `badge badge-${tier}`;
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="members-container">
      <div className="members-header">
        <h1>Members</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Add New Member</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            This member will be pre-approved and can login immediately with the password you set.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label>Membership Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="gold">Gold</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-success">Create Member</button>
        </form>
      )}

      <div className="members-list">
        {members.length === 0 ? (
          <p>No members yet. Click "+ Add Member" to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.member_id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td><span className={getTierBadgeClass(member.tier)}>{member.tier}</span></td>
                  <td><span className={`status status-${member.status}`}>{member.status}</span></td>
                  <td>{new Date(member.joined_date).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => navigate(`/members/${member.member_id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MembersPage;
