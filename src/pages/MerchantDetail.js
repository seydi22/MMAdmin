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
      const res = await axios.get(`https://moov-money-backend.onrender.com/api/merchants/${id}`, {
        headers: { 'x-auth-token': token }
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
      // Correction de la route pour utiliser POST
      await axios.post(`https://moov-money-backend.onrender.com/api/merchants/validate/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
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
      // Correction de la route pour utiliser POST
      await axios.post(`https://moov-money-backend.onrender.com/api/merchants/reject/${id}`, { rejectionReason }, {
        headers: { 'x-auth-token': token }
      });
      alert('Marchand rejeté avec succès.');
      navigate('/merchants');
    } catch (err) {
      console.error(err);
      alert('Erreur lors du rejet du marchand.');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;
  if (!merchant) return <div>Aucun marchand trouvé.</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="merchant-detail-card">
          <div className="detail-header">
            <h2>Détails du marchand : {merchant.nom}</h2>
            <button className="btn-back" onClick={() => navigate('/merchants')}>Retour</button>
          </div>
          <div className="detail-row">
            <p><strong>Statut :</strong> <span className={`status-badge status-${merchant.statut.toLowerCase()}`}>{merchant.statut}</span></p>
            {/* L'agentRecruteurId peut être un objet ou juste un ID */}
            <p><strong>Enrôlé par :</strong> {merchant.agentRecruteurId?.matricule || 'N/A'}</p>
            <p><strong>Date d'enrôlement :</strong> {new Date(merchant.createdAt).toLocaleDateString()}</p>
          </div>
          <hr/>
          <div className="section-title">Informations du gérant</div>
          <div className="detail-row">
            <p><strong>Nom du gérant :</strong> {merchant.nomGerant}</p>
            <p><strong>Prénom du gérant :</strong> {merchant.prenomGerant}</p>
          </div>
          <hr/>
          <div className="section-title">Informations de l'entreprise</div>
          <div className="detail-row">
            <p><strong>Secteur :</strong> {merchant.secteur}</p>
            <p><strong>Type de commerce :</strong> {merchant.typeCommerce}</p>
            <p><strong>NIF :</strong> {merchant.nif}</p>
            <p><strong>RC :</strong> {merchant.rc}</p>
          </div>
          <p><strong>Adresse :</strong> {merchant.adresse}</p>
          <div className="detail-row">
            <p><strong>Contact :</strong> {merchant.contact}</p>
          </div>
          <hr/>
          <div className="section-title">Localisation</div>
          <div className="detail-row">
            <p><strong>Région :</strong> {merchant.region}</p>
            <p><strong>Ville :</strong> {merchant.ville}</p>
            <p><strong>Commune :</strong> {merchant.commune}</p>
          </div>
          <div className="detail-row">
            <p><strong>Coordonnées GPS :</strong></p>
            <p><strong>Latitude :</strong> {merchant.latitude}</p>
            <p><strong>Longitude :</strong> {merchant.longitude}</p>
          </div>
          <hr/>
          <div className="section-title">Documents et Photos</div>
          <div className="image-gallery">
            <div className="image-item">
              <h4>Photo de l'enseigne</h4>
              <img src={merchant.photoEnseigneUrl} alt="Photo de l'enseigne" />
            </div>
            {merchant.pieceIdentite?.type === 'cni' && (
              <>
                <div className="image-item">
                  <h4>CNI Recto</h4>
                  <img src={merchant.pieceIdentite.cniRectoUrl} alt="CNI Recto" />
                </div>
                <div className="image-item">
                  <h4>CNI Verso</h4>
                  <img src={merchant.pieceIdentite.cniVersoUrl} alt="CNI Verso" />
                </div>
              </>
            )}
            {merchant.pieceIdentite?.type === 'passeport' && (
              <div className="image-item">
                <h4>Passeport</h4>
                <img src={merchant.pieceIdentite.passeportUrl} alt="Passeport" />
              </div>
            )}
          </div>
          
          {merchant.statut === 'en attente' && (
            <div className="action-buttons">
              <button className="btn-validate" onClick={handleValidation}>Valider</button>
              <div className="rejection-section">
                <input
                  type="text"
                  placeholder="Raison du rejet (min. 10 caractères)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <button className="btn-reject" onClick={handleRejection}>Rejeter</button>
              </div>
            </div>
          )}

          {merchant.statut === 'rejeté' && merchant.rejectionReason && (
            <p className="rejection-reason-display">
              <strong>Raison du rejet :</strong> {merchant.rejectionReason}
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default MerchantDetail;