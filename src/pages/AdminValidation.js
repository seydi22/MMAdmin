
// src/pages/AdminValidation.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal/Modal'; // Assuming you have a Modal component
import API_BASE_URL from '../config/apiConfig';
import {
  formatMerchantStatutLabel,
  statusBadgeCssSuffix,
  isMerchantLockedDefinitive,
  canAdminRejectDefinitive,
} from '../utils/merchantStatus';
import './Merchants.css';

const AdminValidation = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validatingId, setValidatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDefinitiveModal, setShowDefinitiveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [definitiveReason, setDefinitiveReason] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [definitiveSubmitting, setDefinitiveSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchPendingMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise.');
      }

      const url = `${API_BASE_URL}/api/merchants/pending-admin-validation`;
      const response = await axios.get(url, {
        headers: {
          'x-auth-token': token,
        },
      });
      setMerchants(response.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des marchands en attente de validation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMerchants();
  }, []);

  const handleValidate = async (merchantId) => {
    try {
      setValidatingId(merchantId);
      setErrorMessage('');
      const token = localStorage.getItem('token');
      const resp = await axios.post(`${API_BASE_URL}/api/merchants/admin-validate/${merchantId}`, {}, {
        headers: { 'x-auth-token': token },
      });
      const merchantName = resp?.data?.merchant?.nom ? ` (${resp.data.merchant.nom})` : '';
      setSuccessMessage(`Marchand${merchantName} créé sur le SP Portal avec succès.`);
      fetchPendingMerchants(); // Refresh the list
    } catch (err) {
      console.error('Erreur lors de la validation du marchand', err);
      const msg = err.response?.data?.msg || err.message || 'Erreur lors de la validation.';
      setErrorMessage(msg);
    } finally {
      setValidatingId(null);
    }
  };

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const openRejectModal = (merchantId) => {
    setSelectedMerchantId(merchantId);
    setShowDefinitiveModal(false);
    setShowModal(true);
  };

  const openDefinitiveModal = (merchantId) => {
    setSelectedMerchantId(merchantId);
    setShowModal(false);
    setDefinitiveReason('');
    setShowDefinitiveModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('La raison du rejet est obligatoire.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/merchants/admin-reject/${selectedMerchantId}`, 
        { rejectionReason }, 
        {
          headers: { 'x-auth-token': token },
        }
      );
      setShowModal(false);
      setRejectionReason('');
      fetchPendingMerchants(); // Refresh the list
    } catch (err) {
      const msg = err.response?.data?.msg || err.message;
      alert(msg || 'Erreur lors du rejet du marchand.');
      console.error('Erreur lors du rejet du marchand', err);
    }
  };

  const handleDefinitiveReject = async () => {
    const reason = definitiveReason.trim();
    if (!reason) {
      alert('La raison du rejet définitif est obligatoire.');
      return;
    }
    setDefinitiveSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/merchants/admin-reject-definitive/${selectedMerchantId}`,
        { rejectionReason: reason },
        { headers: { 'x-auth-token': token } }
      );
      setShowDefinitiveModal(false);
      setDefinitiveReason('');
      fetchPendingMerchants();
    } catch (err) {
      const msg = err.response?.data?.msg || err.message;
      alert(msg || 'Erreur lors du rejet définitif.');
      console.error('Erreur lors du rejet définitif', err);
    } finally {
      setDefinitiveSubmitting(false);
    }
  };

  const handleMerchantClick = (merchantId) => {
    navigate(`/merchants/${merchantId}`);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Validation Finale des Marchands</h1>
        </header>

        {successMessage && (
          <div className="alert-success" role="status">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {loading ? (
              <p>Chargement...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Enseigne</th>
                      <th>Gérant</th>
                      <th>Contact</th>
                      <th>Statut</th>
                      <th>Enrôlé par</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((merchant) => (
                      <tr key={merchant._id}>
                        <td onClick={() => handleMerchantClick(merchant._id)} className="merchant-name-clickable">{merchant.nom}</td>
                        <td>{merchant.nomGerant}</td>
                        <td>{merchant.contact}</td>
                        <td>
                          <span className={`status-badge status-${statusBadgeCssSuffix(merchant.statut)}`}>
                            {formatMerchantStatutLabel(merchant.statut)}
                          </span>
                        </td>
                        <td>{merchant.agentRecruteurId?.matricule || 'N/A'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {isMerchantLockedDefinitive(merchant.statut) ? (
                            <span className="text-muted" title="Dossier verrouillé">
                              —
                            </span>
                          ) : (
                            <div className="admin-validation-actions">
                              <button
                                type="button"
                                onClick={() => handleValidate(merchant._id)}
                                className="btn btn-success btn-sm"
                                disabled={validatingId === merchant._id}
                                title={validatingId === merchant._id ? 'Validation en cours…' : 'Valider'}
                              >
                                {validatingId === merchant._id ? 'Validation…' : 'Valider'}
                              </button>
                              <button type="button" onClick={() => openRejectModal(merchant._id)} className="btn btn-danger btn-sm">Rejeter</button>
                              {canAdminRejectDefinitive(merchant.statut) && (
                                <button
                                  type="button"
                                  onClick={() => openDefinitiveModal(merchant._id)}
                                  className="btn btn-definitive-sm"
                                >
                                  Rejet définitif
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <h2>Rejet (renvoi / correction)</h2>
          <p className="modal-helper-text">Le dossier peut être repris selon le workflow habituel.</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez pourquoi le marchand est rejeté..."
            rows="4"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <button type="button" onClick={handleReject} className="btn btn-primary">Envoyer</button>
        </Modal>
      )}

      {showDefinitiveModal && (
        <Modal
          isOpen={showDefinitiveModal}
          onClose={() => !definitiveSubmitting && setShowDefinitiveModal(false)}
        >
          <h2>Rejet définitif</h2>
          <p className="modal-helper-text">
            Action irréversible : le dossier ne pourra plus être modifié ni validé.
          </p>
          <textarea
            value={definitiveReason}
            onChange={(e) => setDefinitiveReason(e.target.value)}
            placeholder="Raison du rejet définitif (obligatoire)…"
            rows="4"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={definitiveSubmitting}
          />
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={definitiveSubmitting}
              onClick={() => setShowDefinitiveModal(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-definitive-sm"
              disabled={definitiveSubmitting || !definitiveReason.trim()}
              onClick={handleDefinitiveReject}
            >
              {definitiveSubmitting ? 'Envoi…' : 'Confirmer le rejet définitif'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminValidation;
