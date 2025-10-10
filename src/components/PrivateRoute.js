import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, roleRequired, rolesRequired }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Crée une liste des rôles autorisés
  const allowedRoles = rolesRequired || (roleRequired ? [roleRequired] : []);

  // Si des rôles sont spécifiés et que le rôle de l'utilisateur n'est pas inclus, redirige
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirige vers la page de connexion si le rôle ne correspond pas
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;