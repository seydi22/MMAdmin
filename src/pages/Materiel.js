import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './Materiel.css';

function authHeaders() {
  return { 'x-auth-token': localStorage.getItem('token') };
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ScanButton({ onCode }) {
  const videoRef = useRef(null);
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ouvert) return undefined;
    let stream;
    let timer;
    let stop = false;
    const fermer = () => {
      stop = true;
      if (timer) cancelAnimationFrame(timer);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
    const lancer = async () => {
      if (!window.BarcodeDetector || !navigator.mediaDevices) {
        setMessage('La webcam n’est pas disponible dans ce navigateur. La douchette remplit le champ, puis validez.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix'],
        });
        const lire = async () => {
          if (stop || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const valeur = codes[0] && codes[0].rawValue;
            if (valeur) {
              onCode(String(valeur).trim());
              setOuvert(false);
              return;
            }
          } catch (err) {
            setMessage('Lecture impossible.');
          }
          timer = requestAnimationFrame(lire);
        };
        lire();
      } catch (err) {
        setMessage('Autorisez la caméra, ou utilisez la douchette.');
      }
    };
    lancer();
    return fermer;
  }, [ouvert, onCode]);

  return (
    <div className="materiel-scan">
      <button className="btn btn-secondary" type="button" onClick={() => { setMessage(''); setOuvert((value) => !value); }}>
        {ouvert ? 'Fermer la caméra' : 'Scanner'}
      </button>
      {ouvert && <video ref={videoRef} className="materiel-video" muted playsInline />}
      {message && <p className="materiel-scan-note">{message}</p>}
    </div>
  );
}

const Materiel = () => {
  const [lignes, setLignes] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('maitre');
  const [selection, setSelection] = useState([]);
  const [eamId, setEamId] = useState('');
  const [restitution, setRestitution] = useState('');
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/materiels`, { headers: authHeaders() });
      setLignes(res.data.lignes || []);
      setEquipes(res.data.equipes || []);
      setSelection([]);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger le matériel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibles = useMemo(
    () => lignes.filter((item) => filtre === 'tous' || item.etat === filtre),
    [lignes, filtre]
  );

  const run = async (action) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Action impossible.');
    } finally {
      setSaving(false);
    }
  };

  const ajouter = (event) => {
    event.preventDefault();
    run(async () => {
      await axios.post(`${API_BASE_URL}/api/materiels`, { marque, modele, code, type }, { headers: authHeaders() });
      setMarque('');
      setModele('');
      setCode('');
      setNotice('Équipement ajouté au stock.');
    });
  };

  const importer = () => {
    if (!fichier) {
      setError('Choisissez un fichier Excel ou CSV.');
      return;
    }
    const form = new FormData();
    form.append('fichier', fichier);
    run(async () => {
      const res = await axios.post(`${API_BASE_URL}/api/materiels/import`, form, { headers: authHeaders() });
      const ignores = res.data.ignores || [];
      setFichier(null);
      setNotice(`${res.data.crees || 0} équipement(s) importé(s).${ignores.length ? ` ${ignores.length} ligne(s) ignorée(s).` : ''}`);
    });
  };

  const affecter = () => {
    run(async () => {
      const res = await axios.post(`${API_BASE_URL}/api/materiels/lot`, { ids: selection, eamId }, { headers: authHeaders() });
      setNotice(`${res.data.affectes} équipement(s) en transit vers ${res.data.equipe}.`);
    });
  };

  const rendre = (etat) => {
    run(async () => {
      await axios.post(`${API_BASE_URL}/api/materiels/restituer`, { code: restitution, etat }, { headers: authHeaders() });
      setRestitution('');
      setNotice('Équipement détaché de l’équipe.');
    });
  };

  const exporter = async () => {
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/materiels/export`, { headers: authHeaders(), responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'materiel.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Impossible d’exporter le matériel.');
    }
  };

  const modeleFichier = () => {
    const contenu = '\uFEFFMarque;Modèle;IMEI;Type\nSamsung;Galaxy Tab;123456789012345;tablette\nZebra;ZQ220;SN-ACC-001;imprimante\n';
    const url = window.URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-materiel.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const basculer = (id) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content materiel-page">
        <header className="main-header"><h1>Matériel</h1></header>
        <p className="materiel-intro">
          Une fiche porte la marque, le modèle et l’IMEI ou le numéro de série. L’affectation d’un lot passe les équipements en transit. L’équipe les confirme sur le téléphone : l’appareil maître par son identifiant, l’accessoire par scan. Au retour au siège, le scan détache l’équipe.
        </p>
        {error && <div className="materiel-alert">{error}</div>}
        {notice && <div className="materiel-alert materiel-alert-ok">{notice}</div>}

        <section className="materiel-section">
          <h2>Entrée en stock</h2>
          <form className="materiel-form" onSubmit={ajouter}>
            <label>Marque<input className="form-control" value={marque} onChange={(event) => setMarque(event.target.value)} required /></label>
            <label>Modèle<input className="form-control" value={modele} onChange={(event) => setModele(event.target.value)} required /></label>
            <label>
              IMEI ou numéro de série
              <input className="form-control" value={code} onChange={(event) => setCode(event.target.value)} required />
            </label>
            <label>
              Type
              <select className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="maitre">Appareil maître</option>
                <option value="tiers">Accessoire</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>Ajouter</button>
          </form>
          <ScanButton onCode={setCode} />
          <p className="materiel-scan-note">La douchette écrit dans le champ IMEI. La webcam remplit le même champ.</p>
        </section>

        <section className="materiel-section">
          <h2>Import en masse</h2>
          <div className="materiel-toolbar">
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFichier(event.target.files && event.target.files[0])} />
            <button className="btn btn-primary" type="button" disabled={saving} onClick={importer}>Importer</button>
            <button className="btn btn-outline-primary" type="button" onClick={modeleFichier}>Modèle CSV</button>
          </div>
          <p className="materiel-scan-note">Colonnes : Marque, Modèle, IMEI, Type. Type : tablette, smartphone, imprimante ou accessoire.</p>
        </section>

        <section className="materiel-section">
          <h2>Restitution au siège</h2>
          <div className="materiel-toolbar">
            <label>
              Code scanné
              <input className="form-control" value={restitution} onChange={(event) => setRestitution(event.target.value)} />
            </label>
            <ScanButton onCode={setRestitution} />
            <button className="btn btn-secondary" type="button" disabled={saving} onClick={() => rendre('en_stock')}>En stock</button>
            <button className="btn btn-secondary" type="button" disabled={saving} onClick={() => rendre('en_reparation')}>En réparation</button>
            <button className="btn btn-outline-primary" type="button" disabled={saving} onClick={() => rendre('rebut')}>Rebut</button>
          </div>
        </section>

        <div className="materiel-toolbar">
          <label>
            État
            <select className="form-control" value={filtre} onChange={(event) => setFiltre(event.target.value)}>
              <option value="tous">Tous</option>
              <option value="en_stock">En stock</option>
              <option value="en_transit">En transit</option>
              <option value="affecte">Affecté</option>
              <option value="incident">Incident signalé</option>
              <option value="en_reparation">En réparation</option>
              <option value="rebut">Rebut</option>
            </select>
          </label>
          <label>
            Équipe du lot
            <select className="form-control" value={eamId} onChange={(event) => setEamId(event.target.value)}>
              <option value="">Choisir</option>
              {equipes.map((equipe) => <option key={equipe._id} value={equipe._id}>{equipe.nom}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" type="button" disabled={saving || selection.length === 0} onClick={affecter}>
            Affecter la sélection
          </button>
          <button className="btn btn-secondary" type="button" onClick={exporter}>Exporter</button>
        </div>

        {loading ? <div className="loading-container">Chargement...</div> : (
          <table className="materiel-table">
            <thead>
              <tr>
                <th />
                <th>Marque</th>
                <th>Modèle</th>
                <th>IMEI / série</th>
                <th>Type</th>
                <th>État</th>
                <th>Équipe</th>
                <th>Réception</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr><td colSpan="9">Aucun équipement.</td></tr>
              ) : visibles.map((item) => (
                <tr key={item._id}>
                  <td>
                    <input
                      type="checkbox"
                      disabled={item.etat !== 'en_stock'}
                      checked={selection.includes(item._id)}
                      onChange={() => basculer(item._id)}
                    />
                  </td>
                  <td>{item.marque || '—'}</td>
                  <td>{item.modele || item.designation}</td>
                  <td>{item.code}</td>
                  <td>{item.typeLabel}</td>
                  <td>{item.etatLabel}{item.incidentLabel ? ` · ${item.incidentLabel}` : ''}</td>
                  <td>{item.equipe || '—'}</td>
                  <td>{formatDate(item.recuAt)}</td>
                  <td>
                    {item.etat === 'en_stock' && (
                      <button
                        className="btn btn-outline-primary"
                        type="button"
                        disabled={saving}
                        onClick={() => run(async () => {
                          await axios.delete(`${API_BASE_URL}/api/materiels/${item._id}`, { headers: authHeaders() });
                          setNotice('Équipement retiré du stock.');
                        })}
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default Materiel;
