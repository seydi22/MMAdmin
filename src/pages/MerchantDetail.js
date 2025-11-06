import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './MerchantDetail.css';
import { FaUser, FaBuilding, FaFileAlt, FaArrowLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { BiSupport } from 'react-icons/bi';

const MerchantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const fetchMerchant = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentification requise.');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/merchants/${id}`, {
          headers: { 'x-auth-token': token },
        });
        setMerchant(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des détails du marchand.');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'validé':
        return 'status-badge-validated';
      case 'en attente':
        return 'status-badge-pending';
      case 'rejeté':
        return 'status-badge-rejected';
      case 'livré':
        return 'status-badge-delivered';
      default:
        return 'status-badge-default';
    }
  };

  const DetailItem = ({ label, value }) => (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || 'N/A'}</span>
    </div>
  );

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!merchant) return <div className="error-container">Aucun marchand trouvé.</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content-details">
        <header className="details-header">
          <div>
            <h1 className="merchant-name">{merchant.nom}</h1>
            <div className="header-meta">
              <span className={`status-badge ${getStatusBadge(merchant.statut)}`}>{merchant.statut}</span>
              <span>Date d'enrôlement: {new Date(merchant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button className="btn-back" onClick={() => navigate('/merchants')}>
            <FaArrowLeft /> Retour à la liste
          </button>
        </header>

        <div className="details-grid">
          {/* General Info Card */}
          <div className="card-details">
            <div className="card-header-details">
              <FaFileAlt className="card-icon" />
              <h3>Informations générales</h3>
            </div>
            <div className="card-body-details">
              <DetailItem label="Enrôlé par" value={merchant.agentRecruteurId?.matricule} />
              <DetailItem label="Date de validation par superviseur" value={merchant.validatedBySupervisorAt ? new Date(merchant.validatedBySupervisorAt).toLocaleDateString() : 'N/A'} />
              <DetailItem label="Date de validation finale" value={merchant.validatedAt ? new Date(merchant.validatedAt).toLocaleDateString() : 'N/A'} />
              <DetailItem label="Date de livraison" value={merchant.deliveredAt ? new Date(merchant.deliveredAt).toLocaleDateString() : 'en attente de livraison'} />
            </div>
          </div>

          {/* Manager Info Card */}
          <div className="card-details">
            <div className="card-header-details">
              <FaUser className="card-icon" />
              <h3>Informations du gérant</h3>
            </div>
            <div className="card-body-details">
              <DetailItem label="Nom" value={merchant.nomGerant} />
              <DetailItem label="Prénom" value={merchant.prenomGerant} />
            </div>
          </div>

          {/* Company Info Card */}
          <div className="card-details full-width">
            <div className="card-header-details">
              <FaBuilding className="card-icon" />
              <h3>Informations de l'entreprise</h3>
            </div>
            <div className="card-body-details grid-col-2">
              <DetailItem label="Secteur" value={merchant.secteur} />
              <DetailItem label="Type de commerce" value={merchant.typeCommerce} />
              <DetailItem label="NIF" value={merchant.nif} />
              <DetailItem label="RC" value={merchant.rc} />
              <DetailItem label="Adresse" value={merchant.adresse} />
              <DetailItem label="Contact" value={merchant.contact} />
            </div>
          </div>
          
          {/* Location Info Card */}
          <div className="card-details full-width">
            <div className="card-header-details">
              <FaMapMarkerAlt className="card-icon" />
              <h3>Localisation</h3>
            </div>
            <div className="card-body-details grid-col-2">
                <DetailItem label="Région" value={merchant.region} />
                <DetailItem label="Ville" value={merchant.ville} />
                <DetailItem label="Commune" value={merchant.commune} />
                <DetailItem label="Coordonnées GPS" value={`${merchant.latitude}, ${merchant.longitude}`} />
            </div>
          </div>

          {/* Operators Info */}
          {merchant.statut === 'livré' && (
            <div className="card-details full-width">
              <div className="card-header-details">
                <FaFileAlt className="card-icon" />
                <h3>Informations de livraison</h3>
              </div>
              <div className="card-body-details grid-col-2">
                <DetailItem label="Date de livraison" value={new Date(merchant.deliveredAt).toLocaleDateString()} />
                <DetailItem label="Agent de livraison" value={merchant.deliveredBy} />
              </div>
              <div className="image-gallery-details">
                {merchant.qrCodePhotoUrl && (
                  <div className="image-item-details" onClick={() => setModalImage(merchant.qrCodePhotoUrl)}>
                    <h6>Photo du QR code posé</h6>
                    <img src={merchant.qrCodePhotoUrl} alt="QR Code" />
                  </div>
                )}
                {merchant.paymentTestPhotoUrl && (
                  <div className="image-item-details" onClick={() => setModalImage(merchant.paymentTestPhotoUrl)}>
                    <h6>Capture du test de paiement</h6>
                    <img src={merchant.paymentTestPhotoUrl} alt="Payment Test" />
                  </div>
                )}
              </div>
            </div>
          )}

          {merchant.operators && merchant.operators.length > 0 && (
            <div className="card-details full-width">
                <div className="card-header-details">
                    <BiSupport className="card-icon" />
                    <h3>Informations des opérateurs</h3>
                </div>
                <div className="card-body-details grid-col-2">
                    {merchant.operators.map((op, index) => (
                        <div key={index} className="operator-card">
                            <div className="card-header-details">
                                <h4>Opérateur {index + 1}</h4>
                            </div>
                            <div className="card-body-details">
                                <DetailItem label="Nom" value={`${op.prenom} ${op.nom}`} />
                                <DetailItem label="Téléphone" value={op.telephone} />
                                <DetailItem label="NNI" value={op.nni} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* Attachments Card */}
          <div className="card-details full-width">
            <div className="card-header-details">
              <FaFileAlt className="card-icon" />
              <h3>Pièces jointes</h3>
            </div>
            <div className="card-body-details">
              <div className="image-gallery-details">
                <div className="image-item-details" onClick={() => setModalImage(merchant.photoEnseigneUrl)}>
                  <h6>Photo de l'enseigne</h6>
                  <img src={merchant.photoEnseigneUrl} alt="Enseigne" />
                </div>
                {merchant.pieceIdentite?.type === 'cni' && (
                  <>
                    <div className="image-item-details" onClick={() => setModalImage(merchant.pieceIdentite.cniRectoUrl)}>
                      <h6>CNI Recto</h6>
                      <img src={merchant.pieceIdentite.cniRectoUrl} alt="CNI Recto" />
                    </div>
                    <div className="image-item-details" onClick={() => setModalImage(merchant.pieceIdentite.cniVersoUrl)}>
                      <h6>CNI Verso</h6>
                      <img src={merchant.pieceIdentite.cniVersoUrl} alt="CNI Verso" />
                    </div>
                  </>
                )}
                {merchant.pieceIdentite?.type === 'passeport' && (
                  <div className="image-item-details" onClick={() => setModalImage(merchant.pieceIdentite.passeportUrl)}>
                    <h6>Passeport</h6>
                    <img src={merchant.pieceIdentite.passeportUrl} alt="Passeport" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {modalImage && (
          <div className="modal-overlay" onClick={() => setModalImage(null)}>
            <div className="modal-content-details">
              <img src={modalImage} alt="Zoomed" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MerchantDetail;
