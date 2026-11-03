import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './AdminLogs.css';

const ROLE_LABEL = {
  admin: 'Admin',
  aam: 'AAM',
  sam: 'SAM',
  cam: 'CAM',
  pam: 'PAM',
  agent: 'Agent',
  superviseur: 'Superviseur',
};

const formatIp = (ip) => {
  if (!ip) return { text: '—', local: false };
  const text = String(ip).replace(/^::ffff:/, '');
  return { text, local: text === '::1' || text === '127.0.0.1' };
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 15;

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timerId);
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

      try {
        const res = await axios.get(`${API_BASE_URL}/api/logs`, {
          headers: { 'x-auth-token': token },
          params: {
            page: currentPage,
            limit: logsPerPage,
            search: debouncedSearchTerm,
          },
        });
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalLogs(res.data.totalLogs || 0);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, debouncedSearchTerm]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content logs-page">
        <header className="main-header">
          <div>
            <h1>Journal d'activité</h1>
            <p className="logs-lead">
              Qui a agi, sur quel dossier, et depuis quelle adresse. Une connexion ouverte sur cet ordinateur (navigateur ou émulateur) apparaît comme ::1. L’adresse du téléphone s’affiche quand l’application l’appelle par l’adresse du réseau, par exemple 192.168.1.20.
            </p>
          </div>
        </header>

        <section className="logs-panel">
          <div className="logs-toolbar">
            <input
              type="search"
              className="form-control logs-search"
              placeholder="Matricule, nom, action ou dossier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="logs-count">
              {loading ? 'Chargement...' : `${totalLogs} trace${totalLogs > 1 ? 's' : ''}`}
            </span>
          </div>

          {error && <p className="logs-alert">{error}</p>}

          <div className="logs-table-wrap">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Compte</th>
                  <th>Action</th>
                  <th>Cible</th>
                  <th>Détail</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="logs-empty">Aucune trace pour cette recherche.</td>
                  </tr>
                )}
                {logs.map((log) => {
                  const when = new Date(log.createdAt);
                  const role = ROLE_LABEL[log.role] || log.role;
                  const ip = formatIp(log.ipAddress);
                  return (
                    <tr key={log._id}>
                      <td className="logs-when">
                        <span>{when.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>{when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <div className="logs-matricule">{log.matricule}</div>
                        <div className="logs-meta">
                          {log.acteur || '—'}
                          {role && <em className={`logs-role logs-role-${log.role || 'none'}`}>{role}</em>}
                        </div>
                      </td>
                      <td>
                        <div className="logs-action">{log.action}</div>
                        {log.outcome === 'succes' && <span className="logs-outcome is-ok">Réussi</span>}
                        {log.outcome === 'echec' && <span className="logs-outcome is-ko">Échec</span>}
                      </td>
                      <td className="logs-cible">{log.cible || '—'}</td>
                      <td className="logs-detail">{log.detail || '—'}</td>
                      <td className="logs-ip">
                        <span>{ip.text}</span>
                        {ip.local && <span>Cet ordinateur</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="logs-footer">
            <span>Page {totalPages === 0 ? 0 : currentPage} / {totalPages}</span>
            <div className="logs-pager">
              <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                Précédent
              </button>
              <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)}>
                Suivant
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminLogs;
