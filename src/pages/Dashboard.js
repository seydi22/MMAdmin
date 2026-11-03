import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faUsers, faHourglassHalf, faSitemap, faCheckCircle, faBan, faEdit, faClock, faCheck } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import RecentActivityLogs from '../components/RecentActivityLogs'; // Import the new component
import API_BASE_URL from '../config/apiConfig';
import { canSee, voirDashboard } from '../utils/portalAccess';
import { formatMsisdn } from '../utils/saisie';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [alertes, setAlertes] = useState({ terrain: [], finale: [], seuilHeures: 24 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    const fetchStats = async () => {
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
        const [orgRes, merchantStatsRes, alertesRes] = await Promise.all([
          voirDashboard('dashboard-organisation')
            ? axios.get(`${API_BASE_URL}/api/organization`, config)
            : Promise.resolve({ data: {} }),
          voirDashboard('dashboard-marchands')
            ? axios.get(`${API_BASE_URL}/api/merchants/dashboard-stats`, config)
            : Promise.resolve({ data: {} }),
          voirDashboard('dashboard-alertes')
            ? axios.get(`${API_BASE_URL}/api/merchants/alertes-delai`, config)
            : Promise.resolve({ data: {} }),
        ]);

        const org = orgRes.data || {};
        const users = Array.isArray(org.users) ? org.users : [];
        const merchantStats = merchantStatsRes.data?.stats || {};

        setAlertes({
          terrain: alertesRes.data?.terrain || [],
          finale: alertesRes.data?.finale || [],
          seuilHeures: alertesRes.data?.seuilHeures || 24,
        });

        setStats({
          pams: (org.pams || []).length,
          sams: users.filter((user) => user.role === 'sam' && user.actif !== false).length,
          cams: users.filter((user) => user.role === 'cam' && user.actif !== false).length,
          equipes: users.filter((user) => user.role === 'aam' && user.actif !== false).length,
          totalMerchants: merchantStats.total || 0,
          enValidation: merchantStats['en attente'] || 0,
          validationFinale: merchantStats['validé_par_superviseur'] || 0,
          crees: merchantStats.cree || 0,
          aCorriger: merchantStats['rejeté'] || 0,
          livré: merchantStats['livré'] || 0,
          rejeteDefinitif: merchantStats['rejeté_définitivement'] || 0,
        });

      } catch (err) {
        setError('Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="loading-container">Chargement...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Dashboard</h1>
          <div className="user-info">{userRole === 'backoffice' ? 'Back-office' : 'Administrateur central'}</div>
        </header>

        {voirDashboard('dashboard-organisation') && (
          <div className="stats-grid">
            <StatsCards title="PAM" value={stats?.pams || 0} icon={<FontAwesomeIcon icon={faSitemap} />} onClick={canSee('organisation') ? () => navigate('/organisation') : undefined} className={canSee('organisation') ? 'clickable' : ''} />
            <StatsCards title="SAM" value={stats?.sams || 0} icon={<FontAwesomeIcon icon={faSitemap} />} onClick={canSee('organisation') ? () => navigate('/organisation') : undefined} className={canSee('organisation') ? 'clickable' : ''} />
            <StatsCards title="CAM" value={stats?.cams || 0} icon={<FontAwesomeIcon icon={faSitemap} />} onClick={canSee('organisation') ? () => navigate('/organisation') : undefined} className={canSee('organisation') ? 'clickable' : ''} />
            <StatsCards title="Équipes" value={stats?.equipes || 0} icon={<FontAwesomeIcon icon={faUsers} />} onClick={canSee('organisation') ? () => navigate('/organisation') : undefined} className={canSee('organisation') ? 'clickable' : ''} />
          </div>
        )}
        {voirDashboard('dashboard-marchands') && (
          <div className="stats-grid">
            <StatsCards title="Marchands" value={stats?.totalMerchants || 0} icon={<FontAwesomeIcon icon={faStore} />} onClick={canSee('marchands') ? () => navigate('/merchants') : undefined} className={canSee('marchands') ? 'clickable' : ''} />
            <StatsCards title="En validation terrain" value={stats?.enValidation || 0} icon={<FontAwesomeIcon icon={faClock} />} />
            <StatsCards title="Validé par superviseur" value={stats?.validationFinale || 0} icon={<FontAwesomeIcon icon={faHourglassHalf} />} onClick={canSee('validation') ? () => navigate('/merchants/pending-validation') : undefined} className={canSee('validation') ? 'clickable' : ''} />
            <StatsCards title="Créé" value={stats?.crees || 0} icon={<FontAwesomeIcon icon={faCheck} />} />
            <StatsCards title="À corriger" value={stats?.aCorriger || 0} icon={<FontAwesomeIcon icon={faEdit} />} />
            <StatsCards title="Livré" value={stats?.livré || 0} icon={<FontAwesomeIcon icon={faCheckCircle} />} />
            <StatsCards title="Rejeté définitivement" value={stats?.rejeteDefinitif || 0} icon={<FontAwesomeIcon icon={faBan} />} />
          </div>
        )}

        {voirDashboard('dashboard-alertes') && (
          <DelayAlerts alertes={alertes} onOpen={(id) => navigate(`/merchants/${id}`)} onFinale={() => navigate('/merchants/pending-validation')} />
        )}

        {voirDashboard('dashboard-activite') && <RecentActivityLogs />}

        {userRole === 'backoffice' && !voirDashboard('dashboard-organisation') && !voirDashboard('dashboard-marchands') && !voirDashboard('dashboard-alertes') && !voirDashboard('dashboard-activite') && (
          <p className="delay-empty">Les blocs de ce tableau de bord se choisissent dans Paramètres, comptes back-office.</p>
        )}

        {canSee('validation') && <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3>Raccourcis</h3>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/merchants/pending-validation')}
            >
              Voir les marchands à valider
            </button>
          </div>
        </div>}
      </main>
    </div>
  );
};

function Who({ people }) {
  const list = Array.isArray(people) ? people.filter((person) => person && person.nom) : [];
  if (!list.length) return <span className="delay-who">Personne non renseignée</span>;
  return (
    <span className="delay-who">
      {list.map((person) => (
        <span key={`${person.nom}-${person.telephone}`}>
          {person.nom}
          {' · '}
          {person.telephone ? formatMsisdn(person.telephone) : 'numéro non renseigné'}
        </span>
      ))}
    </span>
  );
}

function duree(heures) {
  const h = Math.max(0, Number(heures) || 0);
  if (h < 48) return `${h} h`;
  const jours = Math.floor(h / 24);
  const reste = h % 24;
  return reste ? `${jours} j ${reste} h` : `${jours} j`;
}

function DelayAlerts({ alertes, onOpen, onFinale }) {
  const terrain = alertes.terrain || [];
  const finale = alertes.finale || [];
  const retardFinale = finale.filter((item) => item.retard);
  const seuil = alertes.seuilHeures || 24;

  return (
    <div className="delay-alerts">
      <section className="card delay-card">
        <div className="card-header">
          <h3>Alertes de délai</h3>
        </div>
        <div className="card-body">
          <p className="delay-intro">
            Un dossier qui reste plus de {seuil} h à la même étape est signalé ici, avec le nom et le téléphone de la personne qui doit valider.
          </p>
          {terrain.length === 0 ? (
            <p className="delay-empty">Aucun dossier terrain en retard.</p>
          ) : (
            <ul className="delay-list">
              {terrain.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onOpen(item.id)}>
                    <strong>{item.nom}</strong>
                    <span>En attente du {item.niveauLabel}</span>
                    <Who people={item.intervenants} />
                    <em>depuis {duree(item.heures)}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card delay-card">
        <div className="card-header delay-card-head">
          <h3>Rappel : créer le marchand</h3>
          {finale.length > 0 && canSee('validation') && (
            <button type="button" className="btn btn-primary" onClick={onFinale}>
              Validation finale
            </button>
          )}
        </div>
        <div className="card-body">
          <p className="delay-intro">
            Ces dossiers sont validés par le terrain. La validation finale, ici, crée le marchand.
            {retardFinale.length > 0 ? ` ${retardFinale.length} attendent depuis plus de ${seuil} h.` : ''}
          </p>
          {finale.length === 0 ? (
            <p className="delay-empty">Aucun dossier en attente de création.</p>
          ) : (
            <ul className="delay-list">
              {finale.map((item) => (
                <li key={item.id} className={item.retard ? 'is-late' : ''}>
                  <button type="button" onClick={() => onOpen(item.id)}>
                    <strong>{item.nom}</strong>
                    <span>Validation finale</span>
                    <Who people={item.intervenants} />
                    <em>{item.retard ? `en retard, depuis ${duree(item.heures)}` : `depuis ${duree(item.heures)}`}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;