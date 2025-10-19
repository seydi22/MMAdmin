import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MerchantsExport from '../components/MerchantsExport';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './Merchants.css';
import './Reports.css'; // Import styles from Reports.css

const Merchants = () => {
  // States from Merchants.js
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const navigate = useNavigate();

  // States from Reports.js for performance export
  const [perfStartDate, setPerfStartDate] = useState('');
  const [perfEndDate, setPerfEndDate] = useState('');
  const [teams, setTeams] = useState([]);
  const [perfSelectedTeam, setPerfSelectedTeam] = useState('');
  const [perfSelectedAgent, setPerfSelectedAgent] = useState('');

  // Merged useEffect to fetch data for filters
  useEffect(() => {
    const fetchDataForFilters = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const [agentsRes, supervisorsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/agents/all-agents`, config),
          axios.get(`${API_BASE_URL}/api/agents/all-supervisors`, config),
        ]);
        setAgents(agentsRes.data);
        setTeams(supervisorsRes.data);
      } catch (error) {
        console.error('Error fetching data for filters:', error);
      }
    };
    fetchDataForFilters();
  }, []);

  // handlePerformanceExport function from Reports.js
  const handlePerformanceExport = () => {
    const params = new URLSearchParams();
    if (perfStartDate) params.append('startDate', perfStartDate);
    if (perfEndDate) params.append('endDate', perfEndDate);
    if (perfSelectedTeam) params.append('teamId', perfSelectedTeam);
    if (perfSelectedAgent) params.append('agentId', perfSelectedAgent);

    const url = `${API_BASE_URL}/api/export/performance?${params.toString()}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'performances.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Functions from Merchants.js
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
          <h1>Gestion des marchands et Rapports</h1>
        </header>

        {/* Existing merchants list card */}
        <div className="card">
          {/* ... card header with filters ... */}
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
          {/* ... card body with table ... */}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Export sections */}
        <div className="reports-section">
            {/* Performance Export Card */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3>Exporter les Performances</h3>
                </div>
                <div className="card-body">
                    <div className="filters-container">
                        <div className="form-group">
                            <label>Date de début</label>
                            <input
                                type="date"
                                value={perfStartDate}
                                onChange={(e) => setPerfStartDate(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date de fin</label>
                            <input
                                type="date"
                                value={perfEndDate}
                                onChange={(e) => setPerfEndDate(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Équipe (Superviseur)</label>
                            <select
                                value={perfSelectedTeam}
                                onChange={(e) => setPerfSelectedTeam(e.target.value)}
                                className="form-control"
                            >
                                <option value="">Toutes les équipes</option>
                                {teams.map((team) => (
                                <option key={team._id} value={team._id}>
                                    {team.nom}
                                </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Agent</label>
                            <select
                                value={perfSelectedAgent}
                                onChange={(e) => setPerfSelectedAgent(e.target.value)}
                                className="form-control"
                            >
                                <option value="">Tous les agents</option>
                                {agents.map((agent) => (
                                <option key={agent._id} value={agent._id}>
                                    {agent.nom} ({agent.matricule})
                                </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={handlePerformanceExport} className="btn btn-primary">
                        Exporter en Excel
                    </button>
                </div>
            </div>

            {/* Merchant Export Card */}
            <div className="card mt-4">
                <div className="card-body">
                    <MerchantsExport />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Merchants;
