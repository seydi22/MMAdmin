// src/pages/MerchantDetail.js (code complet et corrigé)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './MerchantDetail.css';

const MerchantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchMerchant = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentification requise.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`https://backend-vercel-one-kappa.vercel.app/api/merchants/${id}`, {
        headers: { 'x-auth-token': token },
      });
      setMerchant(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des détails du marchand.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchant();
  }, [id]);

  const handleValidation = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(`https://backend-vercel-one-kappa.vercel.app/api/merchants/validate/${id}`, {},
        {
          headers: { 'x-auth-token': token },
        }
      );
      alert('Marchand validé avec succès.');
      navigate('/merchants');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation du marchand.');
    }
  };

  const handleRejection = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!rejectionReason || rejectionReason.length < 10) {
      alert("Veuillez fournir une raison de rejet d'au moins 10 caractères.");
      return;
    }
    try {
      await axios.post(`https://backend-vercel-one-kappa.vercel.app/api/merchants/reject/${id}`, { rejectionReason }, {
        headers: { 'x-auth-token': token },
      });
      alert('Marchand rejeté avec succès.');
      navigate('/merchants');
    } catch (err) {
      console.error(err);
      alert('Erreur lors du rejet du marchand.');
    }
  };

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!merchant) return <div className="error-container">Aucun marchand trouvé.</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header d-flex justify-content-between align-items-center">
          <h1>Détails du marchand</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/merchants')}>
            Retour à la liste
          </button>
        </header>

        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3>{merchant.nom}</h3>
              </div>
              <div className="card-body">
                <div className="detail-section">
                  <h5>Informations générales</h5>
                  <p><strong>Statut:</strong> <span className={`status-badge status-${merchant.statut.toLowerCase()}`}>{merchant.statut}</span></p>
                  <p><strong>Enrôlé par:</strong> {merchant.agentRecruteurId?.matricule || 'N/A'}</p>
                  <p><strong>Date d'enrôlement:</strong> {new Date(merchant.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="detail-section">
                  <h5>Informations du gérant</h5>
                  <p><strong>Nom:</strong> {merchant.nomGerant}</p>
                  <p><strong>Prénom:</strong> {merchant.prenomGerant}</p>
                </div>
                <div className="detail-section">
                  <h5>Informations de l'entreprise</h5>
                  <p><strong>Secteur:</strong> {merchant.secteur}</p>
                  <p><strong>Type de commerce:</strong> {merchant.typeCommerce}</p>
                  <p><strong>NIF:</strong> {merchant.nif}</p>
                  <p><strong>RC:</strong> {merchant.rc}</p>
                  <p><strong>Adresse:</strong> {merchant.adresse}</p>
                  <p><strong>Contact:</strong> {merchant.contact}</p>
                </div>
                <div className="detail-section">
                  <h5>Localisation</h5>
                  <p><strong>Région:</strong> {merchant.region}</p>
                  <p><strong>Ville:</strong> {merchant.ville}</p>
                  <p><strong>Commune:</strong> {merchant.commune}</p>
                  <p><strong>Coordonnées GPS:</strong> {merchant.latitude}, {merchant.longitude}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5>Actions</h5>
              </div>
              <div className="card-body">
                {merchant.statut === 'en attente' && (
                  <div className="action-section">
                    <button className="btn btn-success w-100 mb-3" onClick={handleValidation}>Valider</button>
                    <div className="rejection-form">
                      <textarea
                        className="form-control mb-2"
                        placeholder="Raison du rejet..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      ></textarea>
                      <button className="btn btn-danger w-100" onClick={handleRejection}>Rejeter</button>
                    </div>
                  </div>
                )}
                {merchant.statut === 'rejeté' && merchant.rejectionReason && (
                  <div className="rejection-info">
                    <h6>Raison du rejet</h6>
                    <p>{merchant.rejectionReason}</p>
                  </div>
                )}
                {merchant.statut === 'validé' && (
                    <p>Ce marchand a déjà été validé.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4">
            <div className="card-header">
                <h3>Documents et Photos</h3>
            </div>
            <div className="card-body">
                <div className="image-gallery">
                    <div className="image-item">
                        <h6>Photo de l'enseigne</h6>
                        <img src={merchant.photoEnseigneUrl} alt="Enseigne" />
                    </div>
                    {merchant.pieceIdentite?.type === 'cni' && (
                    <>
                        <div className="image-item">
                        <h6>CNI Recto</h6>
                        <img src={merchant.pieceIdentite.cniRectoUrl} alt="CNI Recto" />
                        </div>
                        <div className="image-item">
                        <h6>CNI Verso</h6>
                        <img src={merchant.pieceIdentite.cniVersoUrl} alt="CNI Verso" />
                        </div>
                    </>
                    )}
                    {merchant.pieceIdentite?.type === 'passeport' && (
                    <div className="image-item">
                        <h6>Passeport</h6>
                        <img src={merchant.pieceIdentite.passeportUrl} alt="Passeport" />
                    </div>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default MerchantDetail;