import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import './Login.css';
import logo from '../image/logo.png'; // Import the logo

const Login = () => {
  const [formData, setFormData] = useState({
    matricule: '',
    motDePasse: '',
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/api/agents/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.agent.role);

      if (res.data.agent.role === 'superviseur') {
        navigate('/supervisor');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.msg) {
        console.error(err.response.data.msg);
        setError(err.response.data.msg);
      } else {
        console.error('An unexpected error occurred:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-branding">
        <img src={logo} alt="Company Logo" className="login-logo" />
        <h1 className="branding-title">Bienvenue</h1>
        <p className="branding-subtitle">Connectez-vous pour accéder à votre tableau de bord</p>
      </div>
      <div className="login-form-container">
        <div className="login-form">
          <h3 className="form-title">Connexion</h3>
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
            <div className="form-group password-container">
              <label className="form-label">Mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="motDePasse"
                  className="form-control"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary password-toggle-btn"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 login-btn">
              Se connecter
            </button>
          </form>
          <p className="login-footer">© Moov Money 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;