// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faStore, faUsers } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import './Dashboard.css';

const Dashboard = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [merchantsCount, setMerchantsCount] = useState(0);
  const [agentsCount, setAgentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
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
      const [supervisorsRes, merchantsRes, agentsRes] = await Promise.all([
        axios.get('https://moov-money-backend.onrender.com/api/agents/all-supervisors', config),
        axios.get('https://moov-money-backend.onrender.com/api/merchants/all', config),
        axios.get('https://moov-money-backend.onrender.com/api/agents/all-agents', config),
      ]);

      setSupervisors(supervisorsRes.data);
      setMerchantsCount(merchantsRes.data.length);
      setAgentsCount(agentsRes.data.length);
    } catch (err) {
      setError('Erreur lors du chargement des données.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Dashboard</h1>
          <div className="user-info">Admin</div>
        </header>

        <div className="stats-grid">
          <StatsCards
            title="Superviseurs"
            value={supervisors.length}
            icon={<FontAwesomeIcon icon={faUserShield} />}
          />
          <StatsCards
            title="Marchands"
            value={merchantsCount}
            icon={<FontAwesomeIcon icon={faStore} />}
          />
          <StatsCards
            title="Agents"
            value={agentsCount}
            icon={<FontAwesomeIcon icon={faUsers} />}
          />
        </div>

        <div className="card mt-4">
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
            {/* Supervisor table will go here */}
            <p>Le tableau des superviseurs sera affiché ici.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;