// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faStore, faUsers, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import RecentActivityLogs from '../components/RecentActivityLogs'; // Import the new component
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // Add userRole state
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    const fetchStats = async () => {
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
        const [supervisorsRes, agentsRes, merchantStatsRes] = await Promise.all([
          axios.get('https://backend-vercel-one-kappa.vercel.app/api/agents/all-supervisors', config),
          axios.get('https://backend-vercel-one-kappa.vercel.app/api/agents/all-agents', config),
          axios.get('https://backend-vercel-one-kappa.vercel.app/api/merchants/dashboard-stats', config),
        ]);

        const merchantStats = merchantStatsRes.data;

        if (merchantStats.totalAgents !== undefined) {
          // Admin role
          setStats({
            totalSupervisors: supervisorsRes.data.length,
            totalAgents: merchantStats.totalAgents,
            totalMerchants: merchantStats.stats.total,
            validatedBySupervisor: merchantStats.stats['validé_par_superviseur'],
          });
        } else {
          // Supervisor role
          const totalMerchants = Object.values(merchantStats.stats).reduce((sum, count) => sum + count, 0);
          setStats({
            totalSupervisors: supervisorsRes.data.length,
            totalAgents: agentsRes.data.length, // Fallback to the old way
            totalMerchants: totalMerchants,
            validatedBySupervisor: merchantStats.stats['validé_par_superviseur'],
          });
        }

      } catch (err) {
        setError('Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
            value={stats?.totalSupervisors || 0}
            icon={<FontAwesomeIcon icon={faUserShield} />}
          />
          <StatsCards
            title="Marchands"
            value={stats?.totalMerchants || 0}
            icon={<FontAwesomeIcon icon={faStore} />}
          />
          <StatsCards
            title="Agents"
            value={stats?.totalAgents || 0}
            icon={<FontAwesomeIcon icon={faUsers} />}
          />
          <StatsCards
            title="Validé par superviseur"
            value={stats?.validatedBySupervisor || 0} // Reverted to camelCase
            icon={<FontAwesomeIcon icon={faHourglassHalf} />}
          />
        </div>

        {userRole === 'admin' && <RecentActivityLogs />}

        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3>Raccourcis</h3>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/merchants/pending-validation')}
            >
              Voir les marchands à valider
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;