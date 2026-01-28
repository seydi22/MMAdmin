// src/components/NearbyExport.js
import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import API_BASE_URL from '../config/apiConfig';
import './NearbyExport.css';

const NearbyExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise pour l\'exportation.');
      }

      const endpoint = '/api/export/nearby';
      let url = `${API_BASE_URL}${endpoint}`;

      const params = new URLSearchParams();
      if (startDate) {
        // Format ISO date (YYYY-MM-DD)
        const isoDate = new Date(startDate).toISOString().split('T')[0];
        params.append('startDate', isoDate);
      }
      if (endDate) {
        // Format ISO date (YYYY-MM-DD)
        const isoDate = new Date(endDate).toISOString().split('T')[0];
        params.append('endDate', isoDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const generateFileName = (extension = 'zip') => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHmm
        const uniqueID = Math.random().toString(36).substring(2, 8); // 6-character random string
        return `export_nearby_${date}_${time}_${uniqueID}.${extension}`;
      };

      const response = await axios.get(url, {
        headers: {
          'x-auth-token': token,
        },
        responseType: 'blob',
      });

      // Vérifier si la réponse est une erreur JSON (backend peut renvoyer JSON dans un blob)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.msg || 'Erreur lors de l\'export');
      }

      // Déterminer l'extension en fonction du type de contenu renvoyé par le backend
      const isZip = contentType.includes('zip');
      const fileExtension = isZip ? 'zip' : 'xlsx';
      const fileName = generateFileName(fileExtension);

      const blob = new Blob([response.data], { 
        type: contentType || (isZip ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      });
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
      console.error("Erreur lors de l'exportation Nearby :", err.response || err);
      
      // Gestion des erreurs blob (quand le backend renvoie du JSON dans un blob)
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          setError(errorData.msg || 'Erreur lors de l\'export');
        } catch (parseError) {
          setError("Une erreur est survenue lors de l'exportation.");
        }
      } else if (err.response && err.response.status === 404) {
        setError("Aucun marchand validé à exporter.");
      } else if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else if (err.message) {
        setError(err.message);
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
      <h3 className="export-title">Export Nearby</h3>
      <p className="export-description">
        Téléchargez les données des marchands au format Excel avec deux feuilles : "Nearby Item" et "Location Map".
      </p>

      <div className="filter-container">
        <div className="form-group">
          <label htmlFor="startDate">Date de début</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            placeholderText="Sélectionner une date (optionnel)"
            isClearable
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">Date de fin</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            placeholderText="Sélectionner une date (optionnel)"
            isClearable
          />
        </div>
      </div>

      <div className="export-buttons">
        <button
          onClick={handleExport}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Exportation...' : 'Exporter Nearby'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success mt-3">
          Export Nearby réussi !
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

export default NearbyExport;
