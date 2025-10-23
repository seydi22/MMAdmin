import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './AdminLogs.css';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const logsPerPage = 15;

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Veuillez vous authentifier.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { 'x-auth-token': token },
        params: {
          page: currentPage,
          limit: logsPerPage,
          search: debouncedSearchTerm,
        },
      };

      try {
        const res = await axios.get(`${API_BASE_URL}/api/logs`, config);
        setLogs(res.data.logs);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        setError('Erreur lors du chargement des logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, debouncedSearchTerm]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading-container">Chargement des logs...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Historique des Logs</h1>
        </header>

        <div className="card">
          <div className="card-header">
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par matricule ou action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="card-body">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Date/Heure</th>
                  <th>Matricule</th>
                  <th>Action</th>
                  <th>Adresse IP</th>
                  <th>Client Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.matricule}</td>
                    <td>{log.action}</td>
                    <td>{log.ipAddress}</td>
                    <td>{log.userAgent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <nav>
              <ul className="pagination justify-content-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button onClick={() => paginate(page)} className="page-link">
                      {page}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogs;
