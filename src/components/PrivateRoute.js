import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && userRole !== roleRequired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;