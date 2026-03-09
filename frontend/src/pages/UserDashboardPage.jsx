import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserDashboard.css';

function UserDashboardPage() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tiers, setTiers] = useState([]);
    const [selectedTier, setSelectedTier] = useState('basic');
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [payLoading, setPayLoading] = useState(false);
    const [paySuccess, setPaySuccess] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchUserData();
        fetchTiers();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await axios.get('/api/auth/me', { headers });
            setUserData(res.data);
        } catch (err) {
            console.error('Failed to load user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTiers = async () => {
        try {
            const res = await axios.get('/api/membership/tiers');
            setTiers(res.data);
        } catch (err) {
            console.error('Failed to load tiers:', err);
        }
    };

    const handlePayment = async () => {
        setPayLoading(true);
        try {
            const tier = tiers.find(t => t.tier_id === selectedTier);
            await axios.post('/api/payments/create', {
                amount: tier.price,
                tier: selectedTier,
                payment_method: paymentMethod,
                transaction_id: `TXN-${Date.now()}`
            }, { headers });

            setPaySuccess(true);
            // Refresh user data
            await fetchUserData();
        } catch (err) {
            console.error('Payment failed:', err);
        } finally {
            setPayLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="user-dashboard">
                <div className="status-card">
                    <div className="skeleton" style={{ height: '120px' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-dashboard">
            <h1>Welcome, {userData?.name}!</h1>
            <p className="subtitle">Your membership dashboard</p>

            {/* PENDING STATE */}
            {userData?.status === 'pending' && (
                <div className="status-card">
                    <span className="status-icon">⏳</span>
                    <h2>Registration Under Review</h2>
                    <p>Your registration has been submitted successfully. An admin will review and approve your account soon. You'll be able to make a payment and download your certificate after approval.</p>
                    <span className="status-badge pending">Pending Approval</span>
                </div>
            )}

            {/* REJECTED STATE */}
            {userData?.status === 'rejected' && (
                <div className="status-card">
                    <span className="status-icon">❌</span>
                    <h2>Registration Rejected</h2>
                    <p>Unfortunately, your registration was not approved. Please contact support for more information.</p>
                    <span className="status-badge rejected">Rejected</span>
                </div>
            )}

            {/* APPROVED — NOT PAID */}
            {userData?.status === 'approved' && !userData?.has_paid && (
                <>
                    <div className="status-card">
                        <span className="status-icon">✅</span>
                        <h2>You're Approved!</h2>
                        <p>Your registration has been approved by the admin. Select a membership tier below and complete your payment to get started.</p>
                        <span className="status-badge approved">Approved</span>
                    </div>

                    {paySuccess ? (
                        <div className="action-card">
                            <div className="success-message">
                                ✓ Payment completed! Your certificate has been generated.
                            </div>
                        </div>
                    ) : (
                        <div className="action-card">
                            <h3>Select Your Membership Tier</h3>
                            <div className="tier-grid">
                                {tiers.map(tier => (
                                    <div
                                        key={tier.tier_id}
                                        className={`tier-option ${selectedTier === tier.tier_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedTier(tier.tier_id)}
                                    >
                                        <h4>{tier.name}</h4>
                                        <div className="price">${tier.price}</div>
                                        <ul>
                                            {tier.benefits.map((b, i) => (
                                                <li key={i}>{b}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="form-group" style={{ maxWidth: '300px' }}>
                                <label>Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="stripe">Stripe</option>
                                    <option value="razorpay">Razorpay</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handlePayment}
                                disabled={payLoading}
                                style={{ marginTop: '12px' }}
                            >
                                {payLoading ? 'Processing...' : `Pay $${tiers.find(t => t.tier_id === selectedTier)?.price || '0.00'}`}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* PAID — HAS CERTIFICATE */}
            {userData?.has_paid && (
                <>
                    <div className="status-card">
                        <span className="status-icon">🎉</span>
                        <h2>Membership Active</h2>
                        <p>Your {userData?.tier?.toUpperCase() || 'BASIC'} membership is active. You can view and download your certificate below.</p>
                        <span className="status-badge paid">Active Member</span>
                    </div>

                    <div className="cert-card">
                        <h3>Your Certificate</h3>
                        <p>Your membership certificate has been generated and is ready for download.</p>
                        <div className="cert-actions">
                            <button
                                className="btn-primary"
                                onClick={() => navigate(`/certificate/${userData?.member_id}`)}
                            >
                                View Certificate
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => window.print()}
                            >
                                Print Certificate
                            </button>
                        </div>
                    </div>

                    <div className="action-card">
                        <h3>Upgrade Your Tier</h3>
                        <p>Switch to a different membership tier.</p>
                        <div className="tier-grid">
                            {tiers.filter(t => t.tier_id !== userData?.tier).map(tier => (
                                <div
                                    key={tier.tier_id}
                                    className={`tier-option ${selectedTier === tier.tier_id ? 'selected' : ''}`}
                                    onClick={() => setSelectedTier(tier.tier_id)}
                                >
                                    <h4>{tier.name}</h4>
                                    <div className="price">${tier.price}</div>
                                    <ul>
                                        {tier.benefits.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handlePayment}
                            disabled={payLoading || selectedTier === userData?.tier}
                            style={{ marginTop: '12px' }}
                        >
                            {payLoading ? 'Processing...' : `Upgrade & Pay $${tiers.find(t => t.tier_id === selectedTier)?.price || '0.00'}`}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default UserDashboardPage;
