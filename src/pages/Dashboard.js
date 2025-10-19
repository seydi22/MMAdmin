import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faUserTie, faUsers, faStore, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import RecentActivityLogs from '../components/RecentActivityLogs';
import { fetchUsers } from '../services/userService';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [userCounts, setUserCounts] = useState({ admins: 0, supervisors: 0, agents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Veuillez vous authentifier.');
        setLoading(false);
        return;
      }

      const config = { headers: { 'x-auth-token': token } };

      try {
        const [users, merchantStatsRes] = await Promise.all([
          fetchUsers(),
          axios.get(`${API_BASE_URL}/api/merchants/dashboard-stats`, config),
        ]);

        const admins = users.filter(u => u.role === 'admin').length;
        const supervisors = users.filter(u => u.role === 'superviseur').length;
        const agents = users.filter(u => u.role === 'agent').length;
        setUserCounts({ admins, supervisors, agents });

        const merchantStats = merchantStatsRes.data;
        setStats({
          totalMerchants: merchantStats.stats.total,
          validatedBySupervisor: merchantStats.stats['validé_par_superviseur'],
        });

      } catch (err) {
        setError('Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
            title="Admins"
            value={userCounts.admins}
            icon={<FontAwesomeIcon icon={faUserShield} />}
          />
          <StatsCards
            title="Superviseurs"
            value={userCounts.supervisors}
            icon={<FontAwesomeIcon icon={faUserTie} />}
            onClick={() => navigate('/supervisors')}
            className="clickable"
          />
          <StatsCards
            title="Agents"
            value={userCounts.agents}
            icon={<FontAwesomeIcon icon={faUsers} />}
            onClick={() => navigate('/agents')}
            className="clickable"
          />
          <StatsCards
            title="Marchands"
            value={stats?.totalMerchants || 0}
            icon={<FontAwesomeIcon icon={faStore} />}
          />
          <StatsCards
            title="Validé par superviseur"
            value={stats?.validatedBySupervisor || 0}
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