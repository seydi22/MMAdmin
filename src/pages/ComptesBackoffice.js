import React, { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';
import { DASHBOARD_BLOCS } from '../utils/portalAccess';
import './Dashboard.css';
import './ComptesBackoffice.css';

function headers() {
  return { 'x-auth-token': localStorage.getItem('token') };
}

const emptyForm = {
  nom: '',
  prenom: '',
  matricule: '',
  motDePasse: '',
  actif: true,
  habilitations: [],
};

const ComptesBackoffice = () => {
  const [catalogue, setCatalogue] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/portal-users`, { headers: headers() });
      setCatalogue(res.data.habilitations || []);
      setComptes(res.data.comptes || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger les comptes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const basculer = (key) => {
    setForm((prev) => {
      let habs = [...prev.habilitations];
      const estBloc = DASHBOARD_BLOCS.includes(key);
      if (key === 'dashboard') {
        habs = habs.includes('dashboard')
          ? habs.filter((item) => item !== 'dashboard' && !item.startsWith('dashboard-'))
          : [...habs, 'dashboard', 'dashboard-choix', ...DASHBOARD_BLOCS];
        return { ...prev, habilitations: [...new Set(habs)] };
      }
      if (estBloc) {
        if (!habs.includes('dashboard')) habs.push('dashboard');
        habs.push('dashboard-choix');
        const explicite = DASHBOARD_BLOCS.some((item) => habs.includes(item));
        if (!explicite) habs.push(...DASHBOARD_BLOCS.filter((item) => item !== key));
        else if (habs.includes(key)) habs = habs.filter((item) => item !== key);
        else habs.push(key);
        return { ...prev, habilitations: [...new Set(habs)] };
      }
      const has = habs.includes(key);
      return {
        ...prev,
        habilitations: has ? habs.filter((item) => item !== key) : [...habs, key],
      };
    });
  };

  const blocCoche = (key) => {
    const explicite = DASHBOARD_BLOCS.some((item) => form.habilitations.includes(item));
    if (!explicite && form.habilitations.includes('dashboard')) return true;
    return form.habilitations.includes(key);
  };

  const habilitationsEnvoi = (habs) => {
    if (!habs.includes('dashboard')) return habs.filter((item) => !item.startsWith('dashboard-'));
    const explicite = DASHBOARD_BLOCS.some((item) => habs.includes(item));
    const blocs = explicite ? DASHBOARD_BLOCS.filter((item) => habs.includes(item)) : [...DASHBOARD_BLOCS];
    return [...new Set([...habs.filter((item) => !item.startsWith('dashboard-')), 'dashboard-choix', ...blocs])];
  };

  const editer = (compte) => {
    setEditId(compte._id);
    setForm({
      nom: compte.nom || '',
      prenom: compte.prenom || '',
      matricule: compte.matricule,
      motDePasse: '',
      actif: compte.actif !== false,
      habilitations: compte.habilitations || [],
    });
    setNotice('');
    setError('');
  };

  const annuler = () => {
    setEditId('');
    setForm(emptyForm);
  };

  const enregistrer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editId) {
        const body = {
          nom: form.nom,
          prenom: form.prenom,
          actif: form.actif,
          habilitations: habilitationsEnvoi(form.habilitations),
        };
        if (form.motDePasse) body.motDePasse = form.motDePasse;
        await axios.put(`${API_BASE_URL}/api/portal-users/${editId}`, body, { headers: headers() });
        setNotice('Compte mis à jour. Les écrans changent à la prochaine action de ce compte.');
      } else {
        await axios.post(`${API_BASE_URL}/api/portal-users`, { ...form, habilitations: habilitationsEnvoi(form.habilitations) }, { headers: headers() });
        setNotice('Compte back-office créé.');
      }
      annuler();
      await load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portal-page settings-accounts">
        <p className="portal-intro">
          L’administrateur central voit tout le portail. Un compte back-office se connecte au même endroit et ne voit que les fonctions cochées.
        </p>
        {error && <div className="portal-alert">{error}</div>}
        {notice && <div className="portal-alert portal-alert-ok">{notice}</div>}

        <form className="portal-form" onSubmit={enregistrer}>
          <h2>{editId ? 'Modifier le compte' : 'Nouveau compte'}</h2>
          <div className="portal-fields">
            <label>Nom<input className="form-control" value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} /></label>
            <label>Prénom<input className="form-control" value={form.prenom} onChange={(event) => setForm({ ...form, prenom: event.target.value })} /></label>
            <label>Matricule<input className="form-control" value={form.matricule} onChange={(event) => setForm({ ...form, matricule: event.target.value })} required disabled={Boolean(editId)} /></label>
            <label>
              {editId ? 'Nouveau mot de passe' : 'Mot de passe'}
              <input className="form-control" type="password" value={form.motDePasse} onChange={(event) => setForm({ ...form, motDePasse: event.target.value })} required={!editId} />
            </label>
          </div>
          {editId && (
            <label className="portal-check">
              <input type="checkbox" checked={form.actif} onChange={(event) => setForm({ ...form, actif: event.target.checked })} />
              Compte actif
            </label>
          )}
          <fieldset className="portal-habilitations">
            <legend>Habilitations</legend>
            {catalogue.filter((item) => !item.key.startsWith('dashboard-')).map((item) => (
              <React.Fragment key={item.key}>
                <label className="portal-check">
                  <input
                    type="checkbox"
                    checked={form.habilitations.includes(item.key)}
                    onChange={() => basculer(item.key)}
                  />
                  {item.label}
                </label>
                {item.key === 'dashboard' && form.habilitations.includes('dashboard') && (
                  <div className="portal-blocs">
                    {catalogue.filter((bloc) => DASHBOARD_BLOCS.includes(bloc.key)).map((bloc) => (
                      <label key={bloc.key} className="portal-check">
                        <input
                          type="checkbox"
                          checked={blocCoche(bloc.key)}
                          onChange={() => basculer(bloc.key)}
                        />
                        {bloc.label}
                      </label>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </fieldset>
          <div className="portal-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {editId ? 'Enregistrer' : 'Créer le compte'}
            </button>
            {editId && <button className="btn btn-outline-primary" type="button" onClick={annuler}>Annuler</button>}
          </div>
        </form>

        {loading ? <div className="loading-container">Chargement...</div> : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>État</th>
                <th>Fonctions</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {comptes.length === 0 ? (
                <tr><td colSpan="5">Aucun compte back-office.</td></tr>
              ) : comptes.map((compte) => (
                <tr key={compte._id}>
                  <td>{compte.matricule}</td>
                  <td>{`${compte.prenom} ${compte.nom}`.trim() || '—'}</td>
                  <td>{compte.actif ? 'Actif' : 'Désactivé'}</td>
                  <td>{(compte.habilitations || []).length}</td>
                  <td><button className="btn btn-secondary" type="button" onClick={() => editer(compte)}>Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default ComptesBackoffice;
