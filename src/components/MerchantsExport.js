// src/components/MerchantsExport.js
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig'; // Importer la constante
import './MerchantsExport.css';

const MerchantsExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async (exportType) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Correction ici : utilisation des backticks pour la chaîne
        throw new Error(`Authentification requise pour l'exportation.`);
      }

      const endpoint = exportType === 'operators' 
        ? '/api/merchants/export-operators' 
        : '/api/merchants/export';
      let url = `${API_BASE_URL}${endpoint}`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const generateFileName = (type) => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHmm
        const uniqueID = Math.random().toString(36).substring(2, 8); // 6-character random string
        return `export_${type}_${date}_${time}_${uniqueID}.xlsx`;
      };

      const fileName = generateFileName(exportType);

      const response = await axios.get(url, {
        headers: {
          'x-auth-token': token,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
    } catch (err) {
      console.error("Erreur lors de l'exportation :", err.response || err);
      if (err.response && err.response.status === 404) {
        setError("Aucune donnée trouvée pour l'exportation.");
      } else if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Une erreur est survenue lors de l'exportation.");
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <h3 className="export-title">Exporter les Données</h3>
      <p className="export-description">
        Téléchargez des rapports Excel pour les marchands ou leurs opérateurs (seuls les marchands validés sont inclus).
      </p>

      <div className="filter-container">
        <div className="form-group">
          <label htmlFor="startDate">Date de début de validation</label>
          <input
            type="datetime-local"
            id="startDate"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">Date de fin de validation</label>
          <input
            type="datetime-local"
            id="endDate"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="export-buttons">
        <button
          onClick={() => handleExport('merchants')}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Exportation...' : 'Exporter les Marchands'}
        </button>
        <button
          onClick={() => handleExport('operators')}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? 'Exportation...' : 'Exporter les Opérateurs'}
        </button>
      </div>

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