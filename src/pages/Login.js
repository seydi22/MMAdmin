import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import './Login.css';
import logo from '../image/logo.png';
import ThemeSwitch from '../components/ThemeSwitch';

const Login = () => {
  const [formData, setFormData] = useState({
    matricule: '',
    motDePasse: '',
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/agents/login', formData);
      const role = res.data.agent.role;
      if (role !== 'admin' && role !== 'backoffice' && role !== 'logisticien') {
        setError('Ce portail est réservé à l’administrateur central, aux comptes back-office et au gestionnaire de stock. PAM, CAM, SAM et AAM se connectent sur l’application mobile.');
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('habilitations', JSON.stringify(res.data.agent.habilitations || []));
      navigate(role === 'logisticien' ? '/stock' : '/');
    } catch (err) {
      const message = err.response && err.response.data && err.response.data.msg;
      setError(message || 'Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
    <div className="login-page">
      <section className="login-branding">
        <img src={logo} alt="Moov Money" className="login-logo" />
        <h1>Back-office PNAM</h1>
        <p>Le portail d’administration du programme.</p>
        <ul>
          <li>Organisation des PAM, SAM, CAM et EAM</li>
          <li>Validation finale des marchands</li>
          <li>Suivi et journal d’activité</li>
          <li>Parc matériel pour le gestionnaire de stock</li>
        </ul>
      </section>
      <section className="login-form-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <ThemeSwitch />
          <h2>Connexion</h2>
          <p className="login-intro">Administrateur central, comptes back-office et gestionnaire de stock.</p>
          {error && <div className="login-alert" role="alert">{error}</div>}
          <div className="login-field">
            <label htmlFor="matricule">Matricule</label>
            <input
              id="matricule"
              type="text"
              name="matricule"
              autoComplete="username"
              value={formData.matricule}
              onChange={handleChange}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="motDePasse">Mot de passe</label>
            <div className="login-password">
              <input
                id="motDePasse"
                type={showPassword ? 'text' : 'password'}
                name="motDePasse"
                autoComplete="current-password"
                value={formData.motDePasse}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="login-reveal"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <p className="login-footer">© Moov Money {new Date().getFullYear()}</p>
        </form>
      </section>
    </div>
    </div>
  );
};

export default Login;
