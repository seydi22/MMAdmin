import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MerchantsExport from '../components/MerchantsExport';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './Merchants.css';

const Merchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const navigate = useNavigate();

  const handleMerchantClick = (merchantId) => {
    navigate(`/merchants/${merchantId}`);
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise.');
      }
      const response = await axios.get(`${API_BASE_URL}/api/agents/all-agents`, {
        headers: { 'x-auth-token': token },
      });
      setAgents(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise.');
      }

      const url = `${API_BASE_URL}/api/merchants/all`;
      const params = {
        statut: statusFilter === 'Tous' ? '' : statusFilter,
        search: searchTerm,
        agentId: selectedAgent,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
      };

      const response = await axios.get(url, {
        headers: { 'x-auth-token': token },
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
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter, searchTerm, selectedAgent, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedMerchants = useMemo(() => {
    return [...merchants];
  }, [merchants]);

  const formatReadableDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
                <option value="validé_par_superviseur">Validé par superviseur</option>
                <option value="validé">Validé</option>
                <option value="rejeté">Rejeté</option>
                <option value="livré">Livré</option>
              </select>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="form-control"
              >
                <option value="">Enrôlé par (tous)</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.nom} ({agent.matricule})
                  </option>
                ))}
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
                      <th onClick={() => requestSort('nom')}>Enseigne</th>
                      <th onClick={() => requestSort('nomGerant')}>Gérant</th>
                      <th onClick={() => requestSort('contact')}>Contact</th>
                      <th onClick={() => requestSort('statut')}>Statut</th>
                      <th onClick={() => requestSort('agentRecruteurId')}>Enrôlé par</th>
                      <th onClick={() => requestSort('createdAt')}>Date d’enrôlement</th>
                      <th onClick={() => requestSort('validatedBySupervisorAt')}>Date de validation par superviseur</th>
                      <th onClick={() => requestSort('validatedAt')}>Date de validation finale</th>
                      <th onClick={() => requestSort('deliveredAt')}>Date de livraison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMerchants.map((merchant) => (
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
                        <td>{formatReadableDate(merchant.createdAt)}</td>
                        <td>{formatReadableDate(merchant.validatedBySupervisorAt)}</td>
                        <td>{formatReadableDate(merchant.validatedAt)}</td>
                        <td>{formatReadableDate(merchant.deliveredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="card mt-4">
          <div className="card-body">
            <MerchantsExport />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Merchants;