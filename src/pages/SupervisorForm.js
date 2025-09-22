// src/pages/SupervisorForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SupervisorForm.css';
import Sidebar from '../components/Sidebar';

const SupervisorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    matricule: '',
    motDePasse: '',
    affiliation: '',
    role: 'superviseur',
  });

  useEffect(() => {
    if (id) {
      const fetchSupervisor = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await axios.get(`https://moov-money-backend.onrender.com/api/agents/${id}`, {
            headers: { 'x-auth-token': token },
          });
          setFormData({
            matricule: res.data.matricule,
            motDePasse: '',
            affiliation: res.data.affiliation,
            role: res.data.role,
          });
        } catch (err) {
          console.error(err);
        }
      };
      fetchSupervisor();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (id) {
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.motDePasse) {
          delete dataToUpdate.motDePasse;
        }
        await axios.put(`https://moov-money-backend.onrender.com/api/agents/${id}`, dataToUpdate, {
          headers: { 'x-auth-token': token },
        });
      } else {
        await axios.post('https://moov-money-backend.onrender.com/api/agents', formData, {
          headers: { 'x-auth-token': token },
        });
      }
      navigate('/supervisors');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>{id ? 'Modifier un superviseur' : 'Ajouter un superviseur'}</h1>
        </header>
        <div className="card">
          <div className="card-body">
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
                <label className="form-label">Affiliation</label>
                <input
                  type="text"
                  name="affiliation"
                  className="form-control"
                  value={formData.affiliation}
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
                  required={!id}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {id ? 'Modifier' : 'Ajouter'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupervisorForm;