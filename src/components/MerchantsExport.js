// src/components/MerchantsExport.js
import React, { useState } from 'react';
import axios from 'axios';
import './MerchantsExport.css';

const MerchantsExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise pour l\'exportation.');
      }

      const response = await axios.get('https://backend-vercel-one-kappa.vercel.app/api/merchants/export', {
        headers: {
          'x-auth-token': token,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'merchants_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de l\'exportation :', err.response || err);
      if (err.response && err.response.status === 404) {
        setError('Aucun marchand trouvé pour l\'exportation.');
      } else if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Une erreur est survenue lors de l\'exportation.');
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <h3 className="export-title">Exporter les marchands</h3>
      <p className="export-description">
        Cliquez sur le bouton ci-dessous pour télécharger un fichier Excel contenant la liste complète de tous les marchands enregistrés.
      </p>
      <button
        onClick={handleExport}
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Exportation en cours...' : 'Télécharger le rapport Excel'}
      </button>

      {success && (
        <div className="alert alert-success mt-3">
          Rapport exporté avec succès !
        </div>
      )}
      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}
    </div>
  );
};


export default MerchantsExport;
