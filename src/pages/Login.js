// src/pages/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../image/logo.png'; // Import the logo

const Login = () => {
  const [formData, setFormData] = useState({
    matricule: '',
    motDePasse: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('https://moov-money-backend.onrender.com/api/agents/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.agent.role);

      if (res.data.agent.role === 'superviseur') {
        navigate('/supervisor');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err.response.data.msg);
      setError(err.response.data.msg || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="text-center mb-4">
          <img src={logo} alt="Company Logo" className="login-logo" />
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-center mb-4">Connexion</h3>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Matricule</label>
                <input
                  type="text"
                  name="matricule"
                  className="form-control"
                  value={formData.matricule}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  name="motDePasse"
                  className="form-control"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
