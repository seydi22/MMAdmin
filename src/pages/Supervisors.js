// src/pages/Supervisors.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SupervisorsTable from '../components/SupervisorsTable';
import './Dashboard.css'; // On réutilise les styles pour le layout
import './Supervisors.css'; // Changed from Dashboard.css

const Supervisors = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSupervisors = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous authentifier.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('https://moov-money-backend.onrender.com/api/agents/all-supervisors', {
        headers: { 'x-auth-token': token },
      });
      setSupervisors(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des superviseurs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleDeleteSupervisor = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://moov-money-backend.onrender.com/api/agents/${id}`, {
        headers: { 'x-auth-token': token },
      });
      setSupervisors(supervisors.filter((sup) => sup._id !== id));
      alert('Superviseur supprimé avec succès.');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Gestion des superviseurs</h1>
        </header>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3>Liste des superviseurs</h3>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/supervisors/new')}
            >
              Ajouter un superviseur
            </button>
          </div>
          <div className="card-body">
            <SupervisorsTable
              supervisors={supervisors}
              onDeleteSupervisor={handleDeleteSupervisor}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Supervisors;