import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canSee, firstPortalPath } from '../utils/portalAccess';

const PrivateRoute = ({ children, roleRequired, habilitation, habilitations, centralOnly, stockPortal }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'logisticien' && !stockPortal) {
    return <Navigate to="/stock" replace />;
  }

  if (stockPortal) {
    const ouvert = userRole === 'admin'
      || userRole === 'logisticien'
      || (userRole === 'backoffice' && canSee('materiel'));
    if (!ouvert) return <Navigate to={firstPortalPath()} replace />;
    return children;
  }

  if (centralOnly) {
    if (userRole !== 'admin') return <Navigate to={firstPortalPath()} replace />;
    return children;
  }

  if (roleRequired === 'admin') {
    if (userRole !== 'admin' && userRole !== 'backoffice') {
      return <Navigate to="/login" replace />;
    }
    const keys = habilitations || (habilitation ? [habilitation] : []);
    if (userRole === 'backoffice' && keys.length && !keys.some((key) => canSee(key))) {
      const next = firstPortalPath();
      if (next === location.pathname) return <Navigate to="/aucune-habilitation" replace />;
      return <Navigate to={next} replace />;
    }
    return children;
  }

  const allowedRoles = roleRequired ? [roleRequired] : [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
