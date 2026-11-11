// src/components/Sidebar.js

import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faChartLine, faSignOutAlt, faStore, faCheckDouble, faCog, faMapMarkedAlt, faSitemap, faList, faGlobe, faClock, faUsers, faBarcode, faShieldHalved, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import logo from '../image/logo.png';
import { canSee } from '../utils/portalAccess';
import ThemeSwitch from './ThemeSwitch';

const LINKS = [
  { key: 'dashboard', to: '/', icon: faChartLine, label: 'Dashboard' },
  { key: 'parametres', to: '/settings', icon: faCog, label: 'Paramètres' },
  { key: 'organisation', to: '/organisation', icon: faSitemap, label: 'Organisation' },
  { key: 'referentiel-kyc', to: '/referentiel-kyc', icon: faList, label: 'Référentiel KYC' },
  { key: 'referentiel-geo', to: '/referentiel-geo', icon: faGlobe, label: 'Référentiel géographique' },
  { key: 'pointage', to: '/pointage', icon: faClock, label: 'Pointage' },
  { key: 'materiel', to: '/materiel', icon: faBarcode, label: 'Matériel' },
  { key: 'marchands', to: '/merchants', icon: faStore, label: 'Marchands' },
  { key: 'carte-marchand', to: '/carte', icon: faMapMarkedAlt, label: 'Carte marchand' },
  { key: 'carte-equipe', to: '/carte-equipe', icon: faUsers, label: 'Carte équipe' },
  { key: 'anti-fraude', to: '/anti-fraude', icon: faShieldHalved, label: 'Anti-fraude' },
  { key: 'validation', to: '/merchants/pending-validation', icon: faCheckDouble, label: 'Validation Marchands' },
  { key: 'rapports', to: '/reports', icon: faFileAlt, label: 'Rapports' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('habilitations');
    navigate('/login');
  };

  const close = () => setOpen(false);

  return (
    <>
    <button
      type="button"
      className="sidebar-burger"
      aria-expanded={open}
      aria-controls="portal-nav"
      onClick={() => setOpen((value) => !value)}
    >
      <FontAwesomeIcon icon={open ? faXmark : faBars} />
      <span className="sr-only">{open ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
    </button>
    {open && <button type="button" className="sidebar-backdrop" aria-label="Fermer le menu" onClick={close} />}
    <aside id="portal-nav" className={open ? 'sidebar is-open' : 'sidebar'} aria-label="Navigation du portail">
      <div className="sidebar-header">
        <img src={logo} alt="" className="sidebar-logo" />
        <p className="sidebar-title">Moov Money</p>
      </div>
      <nav className="sidebar-nav">
        {userRole === 'logisticien' ? (
          <NavLink to="/stock" className="nav-link" onClick={close}>
            <FontAwesomeIcon icon={faBarcode} />
            <span>Parc matériel</span>
          </NavLink>
        ) : (
          <>
            {LINKS.filter((item) => canSee(item.key)).map((item) => (
              <NavLink key={item.key} to={item.to} className="nav-link" onClick={close}>
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            {(userRole === 'admin' || canSee('materiel')) && (
              <NavLink to="/stock" className="nav-link" onClick={close}>
                <FontAwesomeIcon icon={faBarcode} />
                <span>Portail logistique</span>
              </NavLink>
            )}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <ThemeSwitch />
        <button onClick={handleLogout} className="btn btn-outline-light w-100">
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;