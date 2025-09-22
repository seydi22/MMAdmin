// src/pages/Merchants.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // S'assurer que les styles du tableau de bord sont inclus
import './Merchants.css';

const Merchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const navigate = useNavigate();

  const handleMerchantClick = (merchantId) => {
    navigate(`/merchants/${merchantId}`);
  };

  const fetchMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise.');
      }

      const url = `https://moov-money-backend.onrender.com/api/merchants/all`;
      const params = {
        statut: statusFilter === 'Tous' ? '' : statusFilter,
        search: searchTerm,
      };

      const response = await axios.get(url, {
        headers: {
          'x-auth-token': token,
        },
        params: params,
      });
      setMerchants(response.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des marchands.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter, searchTerm]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Gestion des marchands</h1>
        </header>

        <div className="card">
          <div className="card-header">
            <div className="filters-container">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="en attente">En attente</option>
                <option value="validé">Validé</option>
                <option value="rejeté">Rejeté</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <p>Chargement...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Enseigne</th>
                      <th>Gérant</th>
                      <th>Contact</th>
                      <th>Statut</th>
                      <th>Enrôlé par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((merchant) => (
                      <tr
                        key={merchant._id}
                        onClick={() => handleMerchantClick(merchant._id)}
                        className="merchant-row"
                      >
                        <td>{merchant.nom}</td>
                        <td>{merchant.nomGerant}</td>
                        <td>{merchant.contact}</td>
                        <td>
                          <span className={`status-badge status-${merchant.statut.replace(' ', '_')}`}>
                            {merchant.statut}
                          </span>
                        </td>
                        <td>{merchant.agentRecruteurId?.matricule || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Merchants;