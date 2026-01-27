// src/components/SuiviExport.js
import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import API_BASE_URL from '../config/apiConfig';
import './MerchantsExport.css'; // We can reuse the same CSS

const SuiviExport = () => {
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

      const endpoint = '/api/export/suivi';
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

      const fileName = generateFileName('suivi');

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
      <h3 className="export-title">Export Suivi Marchands</h3>
      <p className="export-description">
        Téléchargez le rapport de suivi des marchands validés.
      </p>

      <div className="filter-container">
        <div className="form-group">
          <label htmlFor="startDate">Date de début d\'enrôlement</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            showTimeSelect
            dateFormat="Pp"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">Date de fin d\'enrôlement</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            showTimeSelect
            dateFormat="Pp"
            className="form-control"
          />
        </div>
      </div>

      <div className="export-buttons">
        <button
          onClick={handleExport}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Exportation...' : 'Exporter le Suivi'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success mt-3">
          Rapport de suivi exporté avec succès !
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

export default SuiviExport;
