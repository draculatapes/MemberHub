import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [analyticsRes, pendingRes, allRes] = await Promise.all([
                axios.get('/api/admin/analytics', { headers }),
                axios.get('/api/admin/pending-users', { headers }),
                axios.get('/api/admin/all-users', { headers }),
            ]);
            setAnalytics(analyticsRes.data);
            setPendingUsers(pendingRes.data);
            setAllUsers(allRes.data);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId, userName) => {
        setActionLoading(userId);
        try {
            await axios.post(`/api/admin/approve/${userId}?tier=basic`, {}, { headers });
            await fetchData();
        } catch (err) {
            console.error('Failed to approve:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId) => {
        setActionLoading(userId);
        try {
            await axios.post(`/api/admin/reject/${userId}`, {}, { headers });
            await fetchData();
        } catch (err) {
            console.error('Failed to reject:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="admin-stats">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="admin-stat"><div className="skeleton" style={{ height: '60px' }}></div></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Manage registrations, approvals, and membership analytics</p>

            {/* Stats */}
            <div className="admin-stats">
                <div className="admin-stat">
                    <h3>Total Users</h3>
                    <div className="value">{analytics?.total_users || 0}</div>
                </div>
                <div className="admin-stat">
                    <h3>Pending Approval</h3>
                    <div className="value pending">{analytics?.pending_users || 0}</div>
                </div>
                <div className="admin-stat">
                    <h3>Approved</h3>
                    <div className="value success">{analytics?.approved_users || 0}</div>
                </div>
                <div className="admin-stat">
                    <h3>Revenue</h3>
                    <div className="value">${analytics?.total_revenue?.toFixed(2) || '0.00'}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({pendingUsers.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Users ({allUsers.length})
                </button>
            </div>

            {/* Pending Users */}
            {activeTab === 'pending' && (
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>Pending Registrations</h2>
                        <span className="count warning">{pendingUsers.length}</span>
                    </div>
                    <div className="user-cards">
                        {pendingUsers.length === 0 ? (
                            <div className="empty-state">No pending registrations</div>
                        ) : (
                            pendingUsers.map(user => (
                                <div key={user.user_id} className="user-card">
                                    <div className="user-info">
                                        <h4>{user.name}</h4>
                                        <p>{user.email}</p>
                                        {user.phone && <p>📞 {user.phone}</p>}
                                        {user.organization && <p>🏢 {user.organization}</p>}
                                        <span className="tag pending">Pending</span>
                                    </div>
                                    <div className="user-actions">
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleApprove(user.user_id, user.name)}
                                            disabled={actionLoading === user.user_id}
                                        >
                                            {actionLoading === user.user_id ? '...' : '✓ Approve'}
                                        </button>
                                        <button
                                            className="btn-reject"
                                            onClick={() => handleReject(user.user_id)}
                                            disabled={actionLoading === user.user_id}
                                        >
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* All Users */}
            {activeTab === 'all' && (
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>All Users</h2>
                        <span className="count">{allUsers.length}</span>
                    </div>
                    <div className="user-cards">
                        {allUsers.length === 0 ? (
                            <div className="empty-state">No users registered yet</div>
                        ) : (
                            allUsers.map(user => (
                                <div key={user.user_id} className="user-card">
                                    <div className="user-info">
                                        <h4>{user.name}</h4>
                                        <p>{user.email}</p>
                                        {user.phone && <p>📞 {user.phone}</p>}
                                        {user.organization && <p>🏢 {user.organization}</p>}
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            <span className={`tag ${user.status}`}>{user.status}</span>
                                            {user.has_paid && <span className="tag paid">Paid</span>}
                                            {user.tier && <span className="tag approved">{user.tier}</span>}
                                        </div>
                                    </div>
                                    {user.status === 'pending' && (
                                        <div className="user-actions">
                                            <button
                                                className="btn-approve"
                                                onClick={() => handleApprove(user.user_id, user.name)}
                                                disabled={actionLoading === user.user_id}
                                            >
                                                {actionLoading === user.user_id ? '...' : '✓ Approve'}
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => handleReject(user.user_id)}
                                                disabled={actionLoading === user.user_id}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboardPage;
