import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import AgentsTable from '../components/AgentsTable';
import API_BASE_URL from '../config/apiConfig';
import './Agents.css';

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
      const res = await axios.get(`${API_BASE_URL}/api/agents/all-agents`, {
        headers: { 'x-auth-token': token },
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

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Performance des Agents</h1>
        </header>
        <div className="card">
          <div className="card-header">
            <h3>Liste des Agents</h3>
          </div>
          <div className="card-body">
            <AgentsTable agents={agents} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agents;