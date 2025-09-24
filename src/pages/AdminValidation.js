
// src/pages/AdminValidation.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal/Modal'; // Assuming you have a Modal component
import './Merchants.css';

const AdminValidation = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const navigate = useNavigate();

  const fetchPendingMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise.');
      }

      const url = `https://backend-vercel-one-kappa.vercel.app/api/merchants/pending-admin-validation`;
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
      const token = localStorage.getItem('token');
      await axios.post(`https://backend-vercel-one-kappa.vercel.app/api/merchants/admin-validate/${merchantId}`, {}, {
        headers: { 'x-auth-token': token },
      });
      fetchPendingMerchants(); // Refresh the list
    } catch (err) {
      console.error('Erreur lors de la validation du marchand', err);
    }
  };

  const openRejectModal = (merchantId) => {
    setSelectedMerchantId(merchantId);
    setShowModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('La raison du rejet est obligatoire.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://backend-vercel-one-kappa.vercel.app/api/merchants/admin-reject/${selectedMerchantId}`, 
        { rejectionReason }, 
        {
          headers: { 'x-auth-token': token },
        }
      );
      setShowModal(false);
      setRejectionReason('');
      fetchPendingMerchants(); // Refresh the list
    } catch (err) {
      console.error('Erreur lors du rejet du marchand', err);
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
                          <span className={`status-badge status-${merchant.statut.replace(' ', '_')}`}>
                            {merchant.statut}
                          </span>
                        </td>
                        <td>{merchant.agentRecruteurId?.matricule || 'N/A'}</td>
                        <td>
                          <button onClick={() => handleValidate(merchant._id)} className="btn btn-success btn-sm">Valider</button>
                          <button onClick={() => openRejectModal(merchant._id)} className="btn btn-danger btn-sm">Rejeter</button>
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
        <Modal onClose={() => setShowModal(false)}>
          <h2>Raison du Rejet</h2>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez pourquoi le marchand est rejeté..."
            rows="4"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <button onClick={handleReject} className="btn btn-primary">Envoyer</button>
        </Modal>
      )}
    </div>
  );
};

export default AdminValidation;
