import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

// Composant pour protéger les routes en fonction du rôle
import PrivateRoute from './components/PrivateRoute';

// Pages de l'application
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import Reports from './pages/Reports';
import AdminValidation from './pages/AdminValidation';
import AdminLogs from './pages/AdminLogs';
import Settings from './pages/Settings';
import MerchantMap from './pages/MerchantMap';
import TeamMap from './pages/TeamMap';
import Organisation from './pages/Organisation';
import KycReferentiel from './pages/KycReferentiel';
import GeoReferentiel from './pages/GeoReferentiel';
import Pointage from './pages/Pointage';
import Materiel from './pages/Materiel';
import AntiFraude from './pages/AntiFraude';
import Stock from './pages/Stock';
import AucuneHabilitation from './pages/AucuneHabilitation';
import './styles/surfaces.css';
import './styles/themes.css';

/**
 * Composant principal de l'application gérant toutes les routes.
 * Il utilise des PrivateRoute pour restreindre l'accès aux pages
 * Le portail est réservé au back-office (admin).
 */

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let inactivityTimer;

    const logout = () => {
      // Supprime le token et le rôle de l'utilisateur
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('habilitations');
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
          <PrivateRoute roleRequired="admin" habilitation="dashboard">
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/merchants" element={<PrivateRoute roleRequired="admin" habilitation="marchands"><Merchants /></PrivateRoute>} />
      <Route path="/merchants/pending-validation" element={<PrivateRoute roleRequired="admin" habilitation="validation"><AdminValidation /></PrivateRoute>} />
      <Route path="/merchants/:id" element={<PrivateRoute roleRequired="admin" habilitations={['marchands', 'validation']}><MerchantDetail /></PrivateRoute>} />
      
      {/* 👈 NOUVEAU : Route pour la page des rapports */}
      <Route path="/reports" element={<PrivateRoute roleRequired="admin" habilitation="rapports"><Reports /></PrivateRoute>} />

      {/* Route pour l'historique des logs */}
      <Route path="/admin/logs" element={<PrivateRoute roleRequired="admin" habilitation="dashboard"><AdminLogs /></PrivateRoute>} />

      {/* Route pour la page des paramètres */}
      <Route 
        path="/settings"
        element={
          <PrivateRoute roleRequired="admin" habilitation="parametres">
            <Settings />
          </PrivateRoute>
        }
      />

      {/* Route pour la carte des marchands */}
      <Route path="/carte" element={<PrivateRoute roleRequired="admin" habilitation="carte-marchand"><MerchantMap /></PrivateRoute>} />
      <Route path="/carte-equipe" element={<PrivateRoute roleRequired="admin" habilitation="carte-equipe"><TeamMap /></PrivateRoute>} />

      <Route path="/organisation" element={<PrivateRoute roleRequired="admin" habilitation="organisation"><Organisation /></PrivateRoute>} />
      <Route path="/referentiel-kyc" element={<PrivateRoute roleRequired="admin" habilitation="referentiel-kyc"><KycReferentiel /></PrivateRoute>} />
      <Route path="/referentiel-geo" element={<PrivateRoute roleRequired="admin" habilitation="referentiel-geo"><GeoReferentiel /></PrivateRoute>} />
      <Route path="/pointage" element={<PrivateRoute roleRequired="admin" habilitation="pointage"><Pointage /></PrivateRoute>} />
      <Route path="/materiel" element={<PrivateRoute roleRequired="admin" habilitation="materiel"><Materiel /></PrivateRoute>} />
      <Route path="/anti-fraude" element={<PrivateRoute roleRequired="admin" habilitation="anti-fraude"><AntiFraude /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute stockPortal><Stock /></PrivateRoute>} />
      <Route path="/comptes-backoffice" element={<PrivateRoute centralOnly><Navigate to="/settings?section=backoffice" replace /></PrivateRoute>} />
      <Route path="/comptes-logistique" element={<PrivateRoute centralOnly><Navigate to="/settings?section=logistique" replace /></PrivateRoute>} />
      <Route path="/aucune-habilitation" element={<PrivateRoute roleRequired="admin"><AucuneHabilitation /></PrivateRoute>} />

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
