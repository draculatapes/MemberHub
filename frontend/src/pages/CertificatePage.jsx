import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Certificate.css';

function CertificatePage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificate();
  }, [memberId]);

  const fetchCertificate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/certificates/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCertificate(response.data);
    } catch (err) {
      setError('Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="certificate-container">
      <button className="btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {error && <div className="error-message">{error}</div>}

      {certificate && (
        <div className="certificate-card">
          <div className="certificate-border">
            <div className="certificate-content">
              <h1>Certificate of Completion</h1>
              <p className="certificate-subtitle">This certifies that</p>

              <h2 className="member-name">{certificate.member_name}</h2>

              <p className="certificate-text">
                has successfully completed the membership in our organization at the <strong>{certificate.tier}</strong> tier level
              </p>

              <div className="certificate-info">
                <p><strong>Tier:</strong> {certificate.tier.toUpperCase()}</p>
                <p><strong>Date Issued:</strong> {new Date(certificate.issue_date).toLocaleDateString()}</p>
              </div>

              <p className="certificate-footer">
                This certificate is a formal recognition of the member's commitment and excellence.
              </p>
            </div>
          </div>

          <div className="certificate-actions">
            <button className="btn-primary" onClick={() => window.print()}>
              Print Certificate
            </button>
            <a
              href={certificate.certificate_url}
              className="btn-secondary"
              download
            >
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertificatePage;
