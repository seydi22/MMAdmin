import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import { formatMerchantStatutLabel } from '../utils/merchantStatus';
import { formatMsisdn } from '../utils/saisie';
import './Dashboard.css';
import './AntiFraude.css';

function authHeaders() {
  return { 'x-auth-token': localStorage.getItem('token') };
}

const PIECE_LABEL = {
  cni: 'CNI',
  passeport: 'Passeport',
  'carte de sejour': 'Carte de séjour',
};

function dateCourte(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function lieu(dossier) {
  return [dossier.localite, dossier.commune, dossier.ville, dossier.region].filter(Boolean).join(' · ');
}

function Photo({ src, legende, nom, miseEnEvidence }) {
  return (
    <figure className={miseEnEvidence ? 'is-focus' : ''}>
      <figcaption>{legende} · {nom}</figcaption>
      {src ? <img src={src} alt={`${legende} de ${nom}`} /> : <p>Photo absente.</p>}
    </figure>
  );
}

function Dossier({ dossier, kind }) {
  if (!dossier) {
    return <article><h3>Dossier retiré</h3></article>;
  }
  const commerce = [dossier.secteur, dossier.categorie, dossier.typeCommerce, dossier.taille].filter(Boolean).join(' · ');
  return (
    <article>
      <h3>{dossier.nom}</h3>
      <p className="antifraude-statut">{formatMerchantStatutLabel(dossier.statut)}{dossier.taille ? ` · ${dossier.taille}` : ''}</p>
      <dl>
        {commerce && <div><dt>Commerce</dt><dd>{commerce}</dd></div>}
        {lieu(dossier) && <div><dt>Lieu</dt><dd>{lieu(dossier)}</dd></div>}
        {dossier.adresse && <div><dt>Adresse</dt><dd>{dossier.adresse}</dd></div>}
        {dossier.gerant && <div><dt>Gérant</dt><dd>{dossier.gerant}</dd></div>}
        {dossier.contact && <div><dt>Téléphone</dt><dd>{formatMsisdn(dossier.contact)}</dd></div>}
        {dossier.equipe && <div><dt>Équipe</dt><dd>{dossier.equipe}</dd></div>}
        {dossier.createdAt && <div><dt>Enrôlé le</dt><dd>{dateCourte(dossier.createdAt)}</dd></div>}
        {dossier.typePiece && <div><dt>Pièce</dt><dd>{PIECE_LABEL[dossier.typePiece] || dossier.typePiece}</dd></div>}
        {dossier.operators.map((operator) => (
          <div key={`${operator.nni}-${operator.telephone}`}>
            <dt>Opérateur</dt>
            <dd>{[operator.nom, operator.nni, formatMsisdn(operator.telephone)].filter((item) => item && item !== '—').join(' · ')}</dd>
          </div>
        ))}
      </dl>
      <Photo src={dossier.photoEnseigneUrl} legende="Enseigne" nom={dossier.nom} miseEnEvidence={kind === 'enseigne'} />
      <Photo src={dossier.pieceUrl} legende="Pièce" nom={dossier.nom} miseEnEvidence={kind === 'piece'} />
      {dossier.pieceVersoUrl && (
        <Photo src={dossier.pieceVersoUrl} legende="Verso" nom={dossier.nom} miseEnEvidence={kind === 'piece'} />
      )}
      <Link to={`/merchants/${dossier._id}`}>Ouvrir le dossier</Link>
    </article>
  );
}

const AntiFraude = () => {
  const [alertes, setAlertes] = useState([]);
  const [seuil, setSeuil] = useState(85);
  const [filtre, setFiltre] = useState('ouverte');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (statut) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/alertes-fraude`, {
        headers: authHeaders(),
        params: { statut },
      });
      setAlertes(res.data.alertes || []);
      setSeuil(res.data.seuil || 85);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger les alertes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filtre); }, [filtre, load]);

  const ouvrir = async (id) => {
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/alertes-fraude/${id}`, { headers: authHeaders() });
      setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible d’ouvrir l’alerte.');
    }
  };

  const ecarter = async () => {
    if (!detail) return;
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/alertes-fraude/${detail._id}/ecarter`, {}, { headers: authHeaders() });
      setDetail(null);
      await load(filtre);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible d’écarter l’alerte.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content antifraude-page">
        <header className="main-header"><h1>Anti-fraude</h1></header>
        <p className="antifraude-intro">
          Les photos d’enseigne et de pièce sont comparées après l’enregistrement. Une alerte apparaît à partir de {seuil} %. Le dossier terrain n’est pas bloqué : la décision reste ici.
        </p>
        {error && <div className="antifraude-alert">{error}</div>}
        <label className="antifraude-filtre">
          Alertes
          <select className="form-control" value={filtre} onChange={(event) => { setDetail(null); setFiltre(event.target.value); }}>
            <option value="ouverte">Ouvertes</option>
            <option value="ecartee">Écartées</option>
            <option value="toutes">Toutes</option>
          </select>
        </label>
        {loading ? <div className="loading-container">Chargement...</div> : (
          <div className="antifraude-layout">
            <table className="antifraude-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Marchand</th>
                  <th>Autre marchand</th>
                  <th>Score</th>
                  <th>Détectée</th>
                </tr>
              </thead>
              <tbody>
                {alertes.length === 0 ? (
                  <tr><td colSpan="5">Aucune alerte.</td></tr>
                ) : alertes.map((alerte) => (
                  <tr key={alerte._id} onClick={() => ouvrir(alerte._id)} className={detail && detail._id === alerte._id ? 'is-active' : ''}>
                    <td>{alerte.kindLabel}</td>
                    <td>{alerte.merchantNom}{alerte.merchantLieu ? <span>{alerte.merchantLieu}</span> : null}</td>
                    <td>{alerte.autreMerchantNom}{alerte.autreMerchantLieu ? <span>{alerte.autreMerchantLieu}</span> : null}</td>
                    <td>{alerte.score} %</td>
                    <td>{dateCourte(alerte.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detail && (
              <section className="antifraude-revue">
                <h2>{detail.kindLabel} · {detail.score} %</h2>
                <p className="antifraude-motif">{detail.motif} Seuil d’alerte : {detail.seuil} %.</p>
                <div className="antifraude-pair">
                  <Dossier dossier={detail.gauche} kind={detail.kind} />
                  <Dossier dossier={detail.droite} kind={detail.kind} />
                </div>
                {detail.statut === 'ouverte' && (
                  <button className="btn btn-secondary" type="button" onClick={ecarter}>Écarter l’alerte</button>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AntiFraude;
