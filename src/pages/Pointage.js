import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './Pointage.css';

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatHeure(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuree(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return `${hours} h ${String(rest).padStart(2, '0')} min`;
}

const Pointage = () => {
  const [jour, setJour] = useState(todayKey);
  const [lignes, setLignes] = useState([]);
  const [totaux, setTotaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tournees`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
        params: { jour: date },
      });
      setLignes(res.data.lignes || []);
      setTotaux(res.data.totaux || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger le pointage.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(jour);
  }, [jour, load]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content pointage-page">
        <header className="main-header">
          <h1>Pointage</h1>
        </header>
        <p className="pointage-intro">
          Heure de début, heure de fin et temps de travail de chaque équipe. Une tournée encore ouverte est comptée jusqu’à maintenant.
        </p>
        <label className="pointage-date">
          Jour
          <input className="form-control" type="date" value={jour} onChange={(event) => setJour(event.target.value)} />
        </label>
        {error && <div className="pointage-alert">{error}</div>}
        {loading ? <div className="loading-container">Chargement...</div> : (
          <>
            <section className="pointage-section">
              <h2>Temps du jour</h2>
              <table className="pointage-table">
                <thead>
                  <tr>
                    <th>Équipe</th>
                    <th>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {totaux.length === 0 ? (
                    <tr><td colSpan="2">Aucune tournée sur cette journée.</td></tr>
                  ) : totaux.map((row) => (
                    <tr key={row.equipe}>
                      <td>{row.equipe}</td>
                      <td>{formatDuree(row.dureeMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="pointage-section">
              <h2>Tournées</h2>
              <table className="pointage-table">
                <thead>
                  <tr>
                    <th>Équipe</th>
                    <th>Compte</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Durée</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr><td colSpan="6">Aucune tournée sur cette journée.</td></tr>
                  ) : lignes.map((row) => (
                    <tr key={row._id}>
                      <td>{row.equipe}</td>
                      <td>{row.matricule || '—'}</td>
                      <td>{formatHeure(row.debut)}</td>
                      <td>{formatHeure(row.fin)}</td>
                      <td>{formatDuree(row.dureeMinutes)}</td>
                      <td>{row.ouverte ? 'En cours' : 'Terminée'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Pointage;
