// src/components/Sidebar.js

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faFileAlt, faChartLine, faSignOutAlt, faStore, faUsers, faCheckDouble, faChartBar, faCog, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import logo from '../image/logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole'); // Récupérer le rôle

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Moov Money Logo" className="sidebar-logo" />
        <h1 className="sidebar-title">Moov Money</h1>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-link">
          <FontAwesomeIcon icon={faChartLine} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/settings" className="nav-link">
          <FontAwesomeIcon icon={faCog} />
          <span>Paramètres</span>
        </NavLink>

        {userRole === 'admin' && (
          <>
            <NavLink to="/supervisors" className="nav-link">
              <FontAwesomeIcon icon={faUserShield} />
              <span>Superviseurs</span>
            </NavLink>
            <NavLink to="/merchants" className="nav-link">
              <FontAwesomeIcon icon={faStore} />
              <span>Marchands</span>
            </NavLink>
            <NavLink to="/carte" className="nav-link">
              <FontAwesomeIcon icon={faMapMarkedAlt} />
              <span>Carte</span>
            </NavLink>
            <NavLink to="/merchants/pending-validation" className="nav-link">
              <FontAwesomeIcon icon={faCheckDouble} />
              <span>Validation Marchands</span>
            </NavLink>
            <NavLink to="/agents" className="nav-link">
              <FontAwesomeIcon icon={faUsers} />
              <span>Agents</span>
            </NavLink>
            <NavLink to="/reports" className="nav-link">
              <FontAwesomeIcon icon={faFileAlt} />
              <span>Rapports</span>
            </NavLink>
            <NavLink to="/performance-superviseurs" className="nav-link">
              <FontAwesomeIcon icon={faChartBar} />
              <span>Performance</span>
            </NavLink>
          </>
        )}

        {userRole === 'superviseur' && (
          <>
            <NavLink to="/merchants/pending-validation" className="nav-link">
              <FontAwesomeIcon icon={faCheckDouble} />
              <span>Validation Marchands</span>
            </NavLink>
            <NavLink to="/performance-superviseurs" className="nav-link">
              <FontAwesomeIcon icon={faChartBar} />
              <span>Performance</span>
            </NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn btn-outline-light w-100">
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;