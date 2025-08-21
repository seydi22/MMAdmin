// src/pages/Agents.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import AgentsTable from '../components/AgentsTable';
import './Dashboard.css'; // Réutilisation des styles de layout

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous authentifier.');
      setLoading(false);
      return;
    }
    try {
      // Endpoint pour récupérer tous les agents (y compris les superviseurs)
      const res = await axios.get('https://moov-money-backend.onrender.com/api/agents/all-agents', {
        headers: { 'x-auth-token': token }
      });
      setAgents(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des agents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <header className="main-header">
          <h2>Performance des Agents</h2>
        </header>

        <AgentsTable agents={agents} />
      </div>
    </div>
  );
};

export default Agents;