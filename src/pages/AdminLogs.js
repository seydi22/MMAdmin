import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './AdminLogs.css';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Veuillez vous authentifier.');
        setLoading(false);
        return;
      }

      const config = {
        headers: { 'x-auth-token': token },
      };

      try {
        const res = await axios.get('https://backend-vercel-one-kappa.vercel.app/api/logs', config);
        setLogs(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredLogs = logs.filter(log =>
    log.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

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
              onChange={handleSearch}
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
                {currentLogs.map(log => (
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
