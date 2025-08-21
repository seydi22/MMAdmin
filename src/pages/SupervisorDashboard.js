import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios'; // Importez axios pour les requêtes HTTP
import './SupervisorDashboard.css'; // Assurez-vous d'avoir un fichier CSS pour le style

const SupervisorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: { 'en attente': 0, 'validé': 0, 'rejeté': 0 },
    pendingMerchants: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Fonction pour se déconnecter
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login'); // Redirige vers la page de connexion
  };

  // Fonction pour récupérer les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/merchants/dashboard-stats', {
          headers: {
            'x-auth-token': token,
          },
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error.response?.data?.msg || error.message);
        setErrorMessage(error.response?.data?.msg || 'Erreur lors du chargement des données du tableau de bord.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingMerchantsCount = dashboardData.pendingMerchants.length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Tableau de bord Superviseur</h2>
        <button onClick={handleLogout} className="logout-button">Déconnexion</button>
      </header>
      
      {isLoading ? (
        <div className="loading-state">
          {/* FaSpinner est une icône de react-icons, assurez-vous de l'avoir installée */}
          <FaSpinner className="spinner" />
          <p>Chargement...</p>
        </div>
      ) : errorMessage ? (
        <div className="error-state">
          <p>{errorMessage}</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <h3 className="stat-title">Validations en attente</h3>
              <p className="stat-value pending">{pendingMerchantsCount}</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-title">Validé</h3>
              <p className="stat-value validated">{dashboardData.stats.validé}</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-title">Rejeté</h3>
              <p className="stat-value rejected">{dashboardData.stats.rejeté}</p>
            </div>
          </div>

          <div className="pending-merchants-section">
            <h3 className="section-title">Marchands en attente de validation</h3>
            {pendingMerchantsCount > 0 ? (
              <ul className="merchant-list">
                {dashboardData.pendingMerchants.slice(0, 5).map((merchant) => (
                  <li key={merchant._id} className="merchant-item">
                    <span className="merchant-name">{merchant.nom}</span>
                    <button
                      onClick={() => navigate(`/merchants/${merchant._id}`)}
                      className="details-button"
                    >
                      Détails
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-merchants-message">Aucun marchand en attente de validation.</p>
            )}
          </div>
          
          <div className="navigation-links">
            <button onClick={() => navigate('/merchants')} className="nav-button">
              Tous les marchands
            </button>
            <button onClick={() => navigate('/agents')} className="nav-button">
              Gestion des agents
            </button>
            <button onClick={() => navigate('/agent-performance')} className="nav-button">
              Performance des agents
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SupervisorDashboard;