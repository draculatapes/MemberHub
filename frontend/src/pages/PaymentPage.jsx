import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Payment.css';

function PaymentPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [tier, setTier] = useState('basic');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const tierPrices = {
    basic: 99.99,
    premium: 199.99,
    gold: 299.99,
  };

  const handleTierChange = (e) => {
    setTier(e.target.value);
    setAmount(tierPrices[e.target.value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const transactionId = `TXN-${Date.now()}`;

      await axios.post(
        '/api/payments/create',
        {
          member_id: memberId,
          amount: parseFloat(amount),
          tier,
          payment_method: paymentMethod,
          status: 'completed',
          transaction_id: transactionId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Generate certificate after successful payment
      await axios.post(`/api/certificates/generate?member_id=${memberId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/certificate/${memberId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <h1>Process Payment</h1>

      {success && (
        <div className="success-message">
          ✓ Payment processed successfully! Redirecting...
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label>Select Membership Tier</label>
          <select value={tier} onChange={handleTierChange} required>
            <option value="basic">Basic - $99.99</option>
            <option value="premium">Premium - $199.99</option>
            <option value="gold">Gold - $299.99</option>
          </select>
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            readOnly
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="stripe">Stripe</option>
            <option value="razorpay">Razorpay</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="payment-summary">
          <h3>Payment Summary</h3>
          <p><strong>Tier:</strong> {tier.toUpperCase()}</p>
          <p><strong>Amount:</strong> ${parseFloat(amount || 0).toFixed(2)}</p>
          <p><strong>Method:</strong> {paymentMethod}</p>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !amount}
        >
          {loading ? 'Processing...' : `Pay $${parseFloat(amount || 0).toFixed(2)}`}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/members')}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default PaymentPage;
