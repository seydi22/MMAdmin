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
    role: 'superviseur'
  });

  useEffect(() => {
    if (id) {
      const fetchSupervisor = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await axios.get(`https://moov-money-backend.onrender.com/api/agents/${id}`, {
            headers: { 'x-auth-token': token }
          });
          setFormData({
            matricule: res.data.matricule,
            motDePasse: '', // Ne jamais pré-remplir le mot de passe pour des raisons de sécurité
            affiliation: res.data.affiliation,
            role: res.data.role
          });
        } catch (err) {
          console.error(err);
        }
      };
      fetchSupervisor();
    }
  }, [id]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (id) {
        // Logique de mise à jour
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.motDePasse) {
          delete dataToUpdate.motDePasse; // Supprimer le champ s'il est vide pour ne pas hacher une chaîne vide
        }
        await axios.put(`https://moov-money-backend.onrender.com/api/agents/${id}`, dataToUpdate, {
          headers: { 'x-auth-token': token }
        });
      } else {
        // Logique de création
        await axios.post('https://moov-money-backend.onrender.com/api/agents', formData, {
          headers: { 'x-auth-token': token }
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="supervisor-form-container">
          <h2>{id ? 'Modifier un superviseur' : 'Ajouter un nouveau superviseur'}</h2>
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
              <label>Affiliation</label>
              <input 
                type="text" 
                name="affiliation" 
                value={formData.affiliation} 
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
                required={!id} // Requis seulement à la création
              />
            </div>
            <button type="submit" className="submit-btn">{id ? 'Modifier' : 'Ajouter'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupervisorForm;