import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

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

/**
 * Composant principal de l'application gérant toutes les routes.
 * Il utilise des PrivateRoute pour restreindre l'accès aux pages
 * en fonction des rôles utilisateur (admin ou superviseur).
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Route publique accessible à tous */}
        <Route path="/login" element={<Login />} />

        {/* ======================================================= */}
        {/* Routes protégées pour les ADMINISTRATEURS     */}
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
        <Route path="/agents" element={<PrivateRoute roleRequired="admin"><Agents /></PrivateRoute>} />
        <Route path="/merchants/:id" element={<PrivateRoute roleRequired="admin"><MerchantDetail /></PrivateRoute>} />
        
        {/* 👈 NOUVEAU : Route pour la page des rapports */}
        <Route path="/reports" element={<PrivateRoute roleRequired="admin"><Reports /></PrivateRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
