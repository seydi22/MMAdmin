import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './Materiel.css';
import './Stock.css';

function authHeaders() {
  return { 'x-auth-token': localStorage.getItem('token') };
}

const ONGLES = [
  { id: 'magasin', label: 'Magasin central' },
  { id: 'kits', label: 'Kits' },
  { id: 'comptoir', label: 'Comptoir' },
  { id: 'sav', label: 'SAV' },
];

function messageErreur(err, fallback) {
  return err.response?.data?.msg || fallback;
}

function Douchette({ label, placeholder, onScan, disabled }) {
  const [valeur, setValeur] = useState('');
  const champ = useRef(null);

  const envoyer = (event) => {
    event.preventDefault();
    const code = valeur.trim();
    if (!code || disabled) return;
    onScan(code);
    setValeur('');
    if (champ.current) champ.current.focus();
  };

  return (
    <form className="materiel-form" onSubmit={envoyer}>
      <label>
        {label}
        <input
          ref={champ}
          className="form-control"
          value={valeur}
          placeholder={placeholder}
          autoFocus
          disabled={disabled}
          onChange={(event) => setValeur(event.target.value)}
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={disabled}>Valider</button>
    </form>
  );
}

const Stock = () => {
  const [onglet, setOnglet] = useState('magasin');
  const [lignes, setLignes] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [kits, setKits] = useState([]);
  const [sav, setSav] = useState({ lignes: [], comptes: {} });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const chargerParc = useCallback(async () => {
    const res = await axios.get(`${API_BASE_URL}/api/materiels`, { headers: authHeaders() });
    setLignes(res.data.lignes || []);
    setEquipes(res.data.equipes || []);
  }, []);

  const chargerKits = useCallback(async () => {
    const res = await axios.get(`${API_BASE_URL}/api/materiels/kits`, { headers: authHeaders() });
    setKits(res.data || []);
  }, []);

  const chargerSav = useCallback(async () => {
    const res = await axios.get(`${API_BASE_URL}/api/materiels/sav`, { headers: authHeaders() });
    setSav(res.data || { lignes: [], comptes: {} });
  }, []);

  useEffect(() => {
    let ignore = false;
    const lancer = async () => {
      setError('');
      try {
        if (onglet === 'sav') await chargerSav();
        else if (onglet === 'kits' || onglet === 'comptoir') {
          await Promise.all([chargerParc(), chargerKits()]);
        } else {
          await chargerParc();
        }
      } catch (err) {
        if (!ignore) setError(messageErreur(err, 'Impossible de charger le parc.'));
      }
    };
    lancer();
    return () => { ignore = true; };
  }, [onglet, chargerParc, chargerKits, chargerSav]);

  const stock = useMemo(() => lignes.filter((item) => item.etat === 'en_stock'), [lignes]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content materiel-page stock-page">
        <header className="main-header"><h1>Portail logistique</h1></header>
        <p className="materiel-intro">
          Réception des fournisseurs, préparation des kits et remise au comptoir. La douchette USB écrit dans le champ actif, puis envoie Entrée.
        </p>
        <div className="stock-tabs" role="tablist">
          {ONGLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={onglet === item.id ? 'is-active' : ''}
              onClick={() => { setOnglet(item.id); setError(''); setNotice(''); }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {error && <div className="materiel-alert">{error}</div>}
        {notice && <div className="materiel-alert materiel-alert-ok">{notice}</div>}
        {onglet === 'magasin' && (
          <Magasin
            stock={stock}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            setNotice={setNotice}
            onDone={chargerParc}
          />
        )}
        {onglet === 'kits' && (
          <Kits
            stock={stock}
            kits={kits}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            setNotice={setNotice}
            onDone={async () => { await Promise.all([chargerParc(), chargerKits()]); }}
          />
        )}
        {onglet === 'comptoir' && (
          <Comptoir
            kits={kits}
            equipes={equipes}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            setNotice={setNotice}
            onDone={async () => { await Promise.all([chargerParc(), chargerKits()]); }}
          />
        )}
        {onglet === 'sav' && (
          <Sav
            sav={sav}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            setNotice={setNotice}
            onDone={chargerSav}
          />
        )}
      </main>
    </div>
  );
};

function Magasin({ stock, busy, setBusy, setError, setNotice, onDone }) {
  const importer = async (event) => {
    const fichier = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!fichier) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const form = new FormData();
      form.append('fichier', fichier);
      const res = await axios.post(`${API_BASE_URL}/api/materiels/import`, form, { headers: authHeaders() });
      const ignores = (res.data.ignores || []).length;
      setNotice(`${res.data.crees || 0} équipement(s) entré(s) en stock.${ignores ? ` ${ignores} ligne(s) ignorée(s).` : ''}`);
      await onDone();
    } catch (err) {
      setError(messageErreur(err, 'Import impossible.'));
    } finally {
      setBusy(false);
    }
  };

  const modele = () => {
    const contenu = '\uFEFFMarque;Modèle;IMEI;Type\nSamsung;Galaxy Tab;123456789012345;tablette\nZebra;ZQ220;SN-ACC-001;imprimante\n';
    const url = window.URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-materiel.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="materiel-section">
      <h2>Réception</h2>
      <p className="materiel-intro">
        Le fichier fournisseur a les colonnes Marque, Modèle, IMEI et Type. Les IMEI déjà connus sont ignorés.
      </p>
      <div className="materiel-toolbar">
        <label>
          Fichier Excel ou CSV
          <input className="form-control" type="file" accept=".xlsx,.xls,.csv" onChange={importer} disabled={busy} />
        </label>
        <button className="btn btn-outline-primary" type="button" onClick={modele}>Télécharger le modèle</button>
      </div>
      <h2>En stock ({stock.length})</h2>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Marque</th>
            <th>Modèle</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {stock.length === 0 ? (
            <tr><td colSpan="4">Aucun équipement en stock.</td></tr>
          ) : stock.map((item) => (
            <tr key={item._id}>
              <td>{item.code}</td>
              <td>{item.marque}</td>
              <td>{item.modele}</td>
              <td>{item.typeLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Kits({ stock, kits, busy, setBusy, setError, setNotice, onDone }) {
  const [nom, setNom] = useState('');
  const [codes, setCodes] = useState([]);
  const connus = useMemo(() => new Map(stock.map((item) => [String(item.code).toUpperCase(), item])), [stock]);

  const ajouter = (code) => {
    const propre = code.replace(/\s+/g, '').toUpperCase();
    if (!propre) return;
    setCodes((prev) => (prev.includes(propre) ? prev : [...prev, propre]));
    setError('');
  };

  const creer = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/materiels/kits`, { nom, codes }, { headers: authHeaders() });
      setNotice(`Kit ${res.data.nom} prêt au comptoir.`);
      setNom('');
      setCodes([]);
      await onDone();
    } catch (err) {
      setError(messageErreur(err, 'Création du kit impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="materiel-section">
      <h2>Préparer un kit</h2>
      <p className="materiel-intro">
        Scannez au moins deux équipements en stock, par exemple une tablette et une imprimante, puis donnez un identifiant comme KIT_NOUAKCHOTT_12.
      </p>
      <form className="materiel-form" onSubmit={creer}>
        <label>
          Identifiant du kit
          <input className="form-control" value={nom} onChange={(event) => setNom(event.target.value)} placeholder="KIT_NOUAKCHOTT_12" required />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy || codes.length < 2}>Créer le kit</button>
      </form>
      <Douchette label="Équipement" placeholder="Scannez l’IMEI ou le numéro de série" onScan={ajouter} disabled={busy} />
      {codes.length > 0 && (
        <div className="stock-codes">
          {codes.map((code) => {
            const item = connus.get(code);
            return (
              <button key={code} type="button" onClick={() => setCodes((prev) => prev.filter((itemCode) => itemCode !== code))}>
                {code}{item ? ` · ${item.marque} ${item.modele}` : ''} ×
              </button>
            );
          })}
        </div>
      )}
      <h2>Kits</h2>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>État</th>
            <th>Équipe</th>
            <th>Contenu</th>
          </tr>
        </thead>
        <tbody>
          {kits.length === 0 ? (
            <tr><td colSpan="4">Aucun kit.</td></tr>
          ) : kits.map((kit) => (
            <tr key={kit._id}>
              <td>{kit.nom}</td>
              <td>{kit.etatLabel}</td>
              <td>{kit.equipe || '—'}</td>
              <td>{(kit.lignes || []).map((item) => item.code).filter(Boolean).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Comptoir({ kits, equipes, busy, setBusy, setError, setNotice, onDone }) {
  const [nom, setNom] = useState('');
  const [eamId, setEamId] = useState('');
  const pret = useMemo(() => kits.filter((kit) => kit.etat === 'pret'), [kits]);
  const choisi = pret.find((kit) => kit.nom === nom.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9_]/g, ''));

  const scanner = (code) => {
    const propre = code.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const kit = pret.find((item) => item.nom === propre);
    setNom(propre);
    setError(kit ? '' : 'Aucun kit prêt au comptoir ne correspond à ce code.');
    setNotice('');
  };

  const remettre = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/materiels/dispatch`, { nom, eamId }, { headers: authHeaders() });
      setNotice(`Kit ${res.data.kit} remis à ${res.data.equipe}. L’équipe confirme la réception sur le téléphone.`);
      setNom('');
      setEamId('');
      await onDone();
    } catch (err) {
      setError(messageErreur(err, 'Remise impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="materiel-section">
      <h2>Remise à l’équipe</h2>
      <p className="materiel-intro">
        Scannez le kit, choisissez l’équipe qui l’emporte, puis validez. Le matériel passe en transit et l’équipe reçoit l’avis sur son téléphone.
      </p>
      <Douchette label="Kit" placeholder="Scannez l’identifiant du kit" onScan={scanner} disabled={busy} />
      <form className="materiel-form" onSubmit={remettre}>
        <label>
          Kit sélectionné
          <input className="form-control" value={nom} onChange={(event) => setNom(event.target.value)} required />
        </label>
        <label>
          Équipe
          <select className="form-control" value={eamId} onChange={(event) => setEamId(event.target.value)} required>
            <option value="">Choisir</option>
            {equipes.map((equipe) => (
              <option key={equipe._id} value={equipe._id}>{equipe.nom}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>Remettre le kit</button>
      </form>
      {choisi && (
        <p className="materiel-intro">
          Contenu : {(choisi.lignes || []).map((item) => `${item.code} (${item.designation || item.modele || item.typeLabel})`).join(', ')}
        </p>
      )}
      <h2>Prêts au comptoir ({pret.length})</h2>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Contenu</th>
          </tr>
        </thead>
        <tbody>
          {pret.length === 0 ? (
            <tr><td colSpan="2">Aucun kit en attente de remise.</td></tr>
          ) : pret.map((kit) => (
            <tr key={kit._id}>
              <td>{kit.nom}</td>
              <td>{(kit.lignes || []).map((item) => item.code).filter(Boolean).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Sav({ sav, busy, setBusy, setError, setNotice, onDone }) {
  const comptes = sav.comptes || {};

  const agir = async (code, etat, libelle) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await axios.post(`${API_BASE_URL}/api/materiels/restituer`, { code, etat }, { headers: authHeaders() });
      setNotice(`${code} : ${libelle}.`);
      await onDone();
    } catch (err) {
      setError(messageErreur(err, 'Mise à jour impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="materiel-section">
      <h2>Retours</h2>
      <div className="stock-kpis">
        <article className="stock-kpi"><span>En panne</span><strong>{comptes.panne || 0}</strong></article>
        <article className="stock-kpi"><span>Chez le fournisseur</span><strong>{comptes.fournisseur || 0}</strong></article>
        <article className="stock-kpi"><span>Perdus</span><strong>{comptes.perdus || 0}</strong></article>
        <article className="stock-kpi"><span>Volés</span><strong>{comptes.voles || 0}</strong></article>
      </div>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Équipement</th>
            <th>État</th>
            <th>Équipe</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(sav.lignes || []).length === 0 ? (
            <tr><td colSpan="5">Aucun appareil en SAV.</td></tr>
          ) : sav.lignes.map((item) => (
            <tr key={item._id}>
              <td>{item.code}</td>
              <td>{`${item.marque} ${item.modele}`.trim() || item.designation}</td>
              <td>{[item.etatLabel, item.incidentLabel].filter(Boolean).join(' · ')}</td>
              <td>{item.equipe || '—'}</td>
              <td>
                <div className="stock-actions">
                  <button className="btn btn-secondary" type="button" disabled={busy || item.etat === 'en_reparation'} onClick={() => agir(item.code, 'en_reparation', 'envoyé chez le fournisseur')}>Chez le fournisseur</button>
                  <button className="btn btn-outline-primary" type="button" disabled={busy} onClick={() => agir(item.code, 'en_stock', 'retourné en stock')}>Retour en stock</button>
                  <button className="btn btn-outline-primary" type="button" disabled={busy || item.etat === 'rebut'} onClick={() => agir(item.code, 'rebut', 'passé au rebut')}>Rebut</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Stock;
