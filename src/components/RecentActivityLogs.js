import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/apiConfig';
import './RecentActivityLogs.css';

// Helper function to format the date
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `il y a ${seconds} secondes`;
  if (minutes < 60) return `il y a ${minutes} minutes`;
  if (hours < 24) return `il y a ${hours} heures`;
  return `il y a ${days} jours`;
};

const RecentActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Veuillez vous authentifier.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { 'x-auth-token': token },
      };

      try {
        const res = await axios.get(`${API_BASE_URL}/api/logs`, config);
        setLogs(res.data.slice(0, 5));
      } catch (err) {
        setError('Erreur lors du chargement des logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <div className="loading-container">Chargement des activités...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="recent-activity-widget card">
      <div className="card-header">
        <h3>Activité Récente</h3>
      </div>
      <ul className="list-group list-group-flush">
        {logs.map(log => (
          <li key={log._id} className="list-group-item">
            <div className="d-flex justify-content-between">
              <span>{log.action}</span>
              <span className="text-muted">{formatRelativeTime(log.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="card-footer text-center">
        <Link to="/admin/logs" className="btn btn-primary">Voir tout l'historique</Link>
      </div>
    </div>
  );
};

export default RecentActivityLogs;
