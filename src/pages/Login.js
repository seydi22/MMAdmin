// src/pages/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
      // Envoie les informations de connexion à l'API
      const res = await axios.post('https://moov-money-backend.onrender.com/api/agents/login', formData);

      // Stocke le token JWT et le rôle de l'utilisateur dans le localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.agent.role); // Assumant que l'API renvoie le rôle

      // Redirige l'utilisateur en fonction de son rôle
      if (res.data.agent.role === 'superviseur') {
        navigate('/supervisor');
      } else {
        // Redirige les autres rôles (par exemple, 'admin') vers le tableau de bord par défaut
        navigate('/');
      }
    } catch (err) {
      console.error(err.response.data.msg);
      setError(err.response.data.msg || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Connexion</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Matricule</label>
            <input
              type="text"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-btn">Se connecter</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
