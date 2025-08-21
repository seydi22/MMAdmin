// src/components/Sidebar.js

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUserShield,faFileAlt,faChartLine, faSignOutAlt,faStore,faUsers} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import logo from '../image/logo.png'

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
     <div className="logo-section">
                <img src={logo} alt="Moov Money Logo" className="moov-logo" />
                <h1 className="brand-name">Moov Money</h1>
     </div>
      <nav className="main-nav">
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              <FontAwesomeIcon icon={faChartLine} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/supervisors" className={({ isActive }) => (isActive ? "active" : "")}>
              <FontAwesomeIcon icon={faUserShield} /> Superviseurs
            </NavLink>
          </li>
          <li>
            <NavLink to="/merchants" className={({ isActive }) => (isActive ? "active" : "")}>
              <FontAwesomeIcon icon={faStore} /> Marchands
            </NavLink>
          </li>
          <li>
            <NavLink to="/agents" className={({ isActive }) => (isActive ? "active" : "")}>
              <FontAwesomeIcon icon={faUsers} /> Agents
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
              <FontAwesomeIcon icon={faFileAlt} /> Rapports
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="logout-btn">
        <button onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;