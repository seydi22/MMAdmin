import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import MerchantsExport from '../components/MerchantsExport'; // Import MerchantsExport
import './Dashboard.css';
import './Reports.css';

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const [supervisorsRes, agentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/agents/all-supervisors`, config),
          axios.get(`${API_BASE_URL}/api/agents/all-agents`, config),
        ]);
        setTeams(supervisorsRes.data);
        setAgents(agentsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      // You might want to redirect to login or show a message
      return;
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedTeam) params.append('teamId', selectedTeam);
    if (selectedAgent) params.append('agentId', selectedAgent);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/export/performance`, {
        params,
        headers: {
          'x-auth-token': token,
        },
        responseType: 'blob', // Important for file downloads
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'performances.xlsx'; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting performance data:', error);
      // Handle error, e.g., show a notification to the user
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Rapports</h1>
        </header>

        {/* Merchant Export Card */}
        <div className="card">
            <div className="card-body">
                <MerchantsExport />
            </div>
        </div>

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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Équipe (Superviseur)</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
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
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
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
            <button onClick={handleExport} className="btn btn-primary">
              Exporter en Excel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;