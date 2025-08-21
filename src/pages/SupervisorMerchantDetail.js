// src/pages/SupervisorMerchantDetail.js

import React, { useState } from 'react';
import { FaSpinner, FaCheck, FaTimes, FaCamera, FaIdCard, FaPassport } from 'react-icons/fa';

const SupervisorMerchantDetail = ({ merchant, onStatusUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const API_URL = 'http://localhost:5000/api/merchants';

  // Fonction pour mettre à jour le statut du commerçant
  const updateMerchantStatus = async (action) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }

      let body = {};
      let url = `${API_URL}/${merchant._id}/validate`;
      let method = 'POST';

      if (action === 'validate') {
        url = `${API_URL}/${merchant._id}/validate`;
        method = 'POST';
      } else if (action === 'reject') {
        if (!rejectionReason) {
          setErrorMessage('Veuillez indiquer une raison de rejet.');
          setIsLoading(false);
          return;
        }
        url = `${API_URL}/${merchant._id}/reject`;
        method = 'POST';
        body = { rejectionReason };
      } else {
        setErrorMessage('Action non reconnue.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(`Commerçant ${action === 'validate' ? 'validé' : 'rejeté'} avec succès !`);
        onStatusUpdate(true); // Signale au parent de rafraîchir
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.msg || `Erreur lors de la ${action === 'validate' ? 'validation' : 'du rejet'}.`);
      }
    } catch (error) {
      setErrorMessage('Erreur réseau ou du serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  // Composant pour afficher une image
  const ImageDisplay = ({ url, label, icon }) => (
    <div className="flex flex-col items-center mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
      <div className="text-4xl text-gray-400 mb-2">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{label}</h4>
      {url ? (
        <img src={url} alt={label} className="w-full h-auto rounded-md shadow-md max-h-96 object-contain" />
      ) : (
        <p className="text-sm text-gray-500">Image non disponible.</p>
      )}
    </div>
  );

  const pieceIdentite = merchant.pieceIdentite || {};

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{merchant.nom}</h2>

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      )}

      {errorMessage && <div className="text-center text-red-500 font-bold mb-4">{errorMessage}</div>}

      <div className="space-y-4 text-gray-700 mb-8">
        <p><span className="font-semibold">Type de commerçant :</span> {merchant.typeCommercant}</p>
        <p><span className="font-semibold">Gérant :</span> {merchant.nomGerant}</p>
        <p><span className="font-semibold">Contact :</span> {merchant.contact}</p>
        <p><span className="font-semibold">Emplacement :</span> {merchant.emplacement}</p>
        <p><span className="font-semibold">Statut :</span> <span className={`font-semibold ${
          merchant.statut === 'validé' ? 'text-green-600' :
          merchant.statut === 'rejeté' ? 'text-red-600' :
          'text-yellow-600'
        }`}>{merchant.statut}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ImageDisplay url={merchant.photoEnseigneUrl} label="Photo de l'enseigne" icon={<FaCamera />} />
        
        {pieceIdentite.type === 'cni' || pieceIdentite.type === 'carte de sejour' ? (
          <>
            <ImageDisplay url={pieceIdentite.cniRectoUrl} label="CNI / Carte de séjour (Recto)" icon={<FaIdCard />} />
            <ImageDisplay url={pieceIdentite.cniVersoUrl} label="CNI / Carte de séjour (Verso)" icon={<FaIdCard />} />
          </>
        ) : pieceIdentite.type === 'passeport' ? (
          <ImageDisplay url={pieceIdentite.passeportUrl} label="Passeport" icon={<FaPassport />} />
        ) : null}
      </div>

      {merchant.statut === 'en attente' && (
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <button
            onClick={() => updateMerchantStatus('validate')}
            className="flex items-center justify-center bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <FaCheck className="mr-2" /> Valider
          </button>
          <button
            onClick={() => setShowRejectionInput(!showRejectionInput)}
            className="flex items-center justify-center bg-red-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <FaTimes className="mr-2" /> Rejeter
          </button>
        </div>
      )}

      {showRejectionInput && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <textarea
            className="w-full p-2 border rounded-md"
            rows="3"
            placeholder="Raison du rejet..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          ></textarea>
          <button
            onClick={() => updateMerchantStatus('reject')}
            className="mt-2 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200"
            disabled={isLoading || !rejectionReason.trim()}
          >
            Confirmer le rejet
          </button>
        </div>
      )}
    </div>
  );
};

export default SupervisorMerchantDetail;
