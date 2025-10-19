import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

// Composant pour protéger les routes en fonction du rôle
import PrivateRoute from './components/PrivateRoute';

// Pages de l'application
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Tableau de bord Admin
import SupervisorForm from './pages/SupervisorForm';
import Supervisors from './pages/Supervisors';
import Merchants from './pages/Merchants';
import Agents from './pages/Agents';
import MerchantDetail from './pages/MerchantDetail'; // Importez le composant de détail du marchand
import Reports from './pages/Reports'; // 👈 NOUVEAU : Importation du composant Reports
import AdminValidation from './pages/AdminValidation'; // Import the new page
import SupervisorPerformance from './pages/SupervisorPerformance';
import AdminLogs from './pages/AdminLogs'; // Import the new page
import Settings from './pages/Settings'; // Import the Settings page

/**
 * Composant principal de l'application gérant toutes les routes.
 * Il utilise des PrivateRoute pour restreindre l'accès aux pages
 * en fonction des rôles utilisateur (admin ou superviseur).
 */

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let inactivityTimer;

    const logout = () => {
      // Supprime le token et le rôle de l'utilisateur
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      // Redirige vers la page de connexion
      navigate('/login');
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
    };

    // Événements pour détecter l'activité de l'utilisateur
    const events = ['mousemove', 'keypress', 'click', 'scroll'];

    // Ajoute les écouteurs d'événements
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialise le minuteur
    resetTimer();

    // Nettoyage : supprime les écouteurs d'événements et le minuteur
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Route publique accessible à tous */}
      <Route path="/login" element={<Login />} />

      {/* ======================================================= */}
      {/* Routes protégées pour les ADMINISTRATEURS         */}
      {/* ======================================================= */}
      
      {/* Route du tableau de bord principal pour les admins */}
      <Route
        path="/"
        element={
          <PrivateRoute roleRequired="admin">
            <Dashboard />
          </PrivateRoute>
        }
      />
      {/* Gestion des superviseurs par l'admin */}
      <Route path="/supervisors" element={<PrivateRoute roleRequired="admin"><Supervisors /></PrivateRoute>} />
      <Route path="/supervisors/new" element={<PrivateRoute roleRequired="admin"><SupervisorForm /></PrivateRoute>} />
      <Route path="/supervisors/edit/:id" element={<PrivateRoute roleRequired="admin"><SupervisorForm /></PrivateRoute>} />
      <Route path="/merchants" element={<PrivateRoute roleRequired="admin"><Merchants /></PrivateRoute>} />
      <Route path="/merchants/pending-validation" element={<PrivateRoute roleRequired="admin"><AdminValidation /></PrivateRoute>} />
      <Route path="/agents" element={<PrivateRoute roleRequired="admin"><Agents /></PrivateRoute>} />
      <Route path="/merchants/:id" element={<PrivateRoute roleRequired="admin"><MerchantDetail /></PrivateRoute>} />
      
      {/* 👈 NOUVEAU : Route pour la page des rapports */}
      <Route path="/reports" element={<PrivateRoute roleRequired="admin"><Reports /></PrivateRoute>} />

      {/* Route pour la performance des superviseurs */}
      <Route 
        path="/performance-superviseurs"
        element={
          <PrivateRoute rolesRequired={['admin', 'superviseur']}>
            <SupervisorPerformance />
          </PrivateRoute>
        }
      />

      {/* Route pour l'historique des logs */}
      <Route path="/admin/logs" element={<PrivateRoute roleRequired="admin"><AdminLogs /></PrivateRoute>} />

      {/* Route pour la page des paramètres */}
      <Route 
        path="/settings"
        element={
          <PrivateRoute rolesRequired={['admin', 'superviseur', 'agent']}>
            <Settings />
          </PrivateRoute>
        }
      />

    </Routes>
  );
};

function App() {
  console.log('URL d\'API utilisée au build :', process.env.REACT_APP_API_URL);
  return (
    <Router>
      <AppContent />
    </Router>
  );
}


export default App;
