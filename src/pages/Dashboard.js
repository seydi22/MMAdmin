// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import './Dashboard.css';

const Dashboard = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [merchantsCount, setMerchantsCount] = useState(0); // Nouveau state pour le nombre de marchands
  const [agentsCount, setAgentsCount] = useState(0); // Nouveau state pour le nombre d'agents
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchSupervisors = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous authentifier.');
      return;
    }
    try {
      const res = await axios.get('https://moov-money-backend.onrender.com/api/agents/all-supervisors', {
        headers: { 'x-auth-token': token }
      });
      setSupervisors(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des superviseurs.');
      console.error(err);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Récupère la liste de tous les marchands pour en compter le total
      const merchantsRes = await axios.get('https://moov-money-backend.onrender.com/api/merchants/all', {
        headers: { 'x-auth-token': token }
      });
      setMerchantsCount(merchantsRes.data.length);

      // Récupère la liste de tous les agents pour en compter le total
      const agentsRes = await axios.get('https://moov-money-backend.onrender.com/api/agents/all-agents', {
        headers: { 'x-auth-token': token }
      });
      setAgentsCount(agentsRes.data.length);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
    fetchStats(); // Appelle la nouvelle fonction pour récupérer les stats
  }, []);

  const handleDeleteSupervisor = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://moov-money-backend.onrender.com/api/agents/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setSupervisors(supervisors.filter(sup => sup._id !== id));
      alert('Superviseur supprimé avec succès.');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="main-header">
          <h2>Dashboard</h2>
          <div className="user-info">Admin</div>
        </header>

        <div className="stats-cards-container">
          <StatsCards title="Superviseurs" value={supervisors.length} />
          <StatsCards title="Marchands" value={merchantsCount} /> {/* Carte dynamique */}
          <StatsCards title="Agents" value={agentsCount} /> {/* Carte dynamique */}
        </div>

        <div className="table-header">
          <h3>Liste des superviseurs</h3>
          <button className="add-btn" onClick={() => navigate('/supervisors/new')}>
            Ajouter un superviseur
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;