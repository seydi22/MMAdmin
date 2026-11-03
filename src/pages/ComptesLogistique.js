import React, { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';
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
};

const ComptesLogistique = () => {
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
      const res = await axios.get(`${API_BASE_URL}/api/portal-users/logisticiens`, { headers: headers() });
      setComptes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger les comptes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const editer = (compte) => {
    setEditId(compte._id);
    setForm({
      nom: compte.nom || '',
      prenom: compte.prenom || '',
      matricule: compte.matricule,
      motDePasse: '',
      actif: compte.actif !== false,
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
        const body = { nom: form.nom, prenom: form.prenom, actif: form.actif };
        if (form.motDePasse) body.motDePasse = form.motDePasse;
        await axios.put(`${API_BASE_URL}/api/portal-users/logisticiens/${editId}`, body, { headers: headers() });
        setNotice('Compte logistique mis à jour.');
      } else {
        await axios.post(`${API_BASE_URL}/api/portal-users/logisticiens`, form, { headers: headers() });
        setNotice('Compte logistique créé. Il n’ouvre que le parc matériel.');
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
          Le gestionnaire de stock se connecte sur ce portail et ne voit que le parc matériel. Il n’ouvre ni les dossiers marchands, ni Moov Money, ni les commissions.
        </p>
        {error && <div className="portal-alert">{error}</div>}
        {notice && <div className="portal-alert portal-alert-ok">{notice}</div>}

        <form className="portal-form" onSubmit={enregistrer}>
          <h2>{editId ? 'Modifier le compte' : 'Nouveau gestionnaire de stock'}</h2>
          <div className="portal-fields">
            <label>Nom<input className="form-control" value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} /></label>
            <label>Prénom<input className="form-control" value={form.prenom} onChange={(event) => setForm({ ...form, prenom: event.target.value })} /></label>
            <label>Matricule<input className="form-control" value={form.matricule} onChange={(event) => setForm({ ...form, matricule: event.target.value })} required disabled={Boolean(editId)} /></label>
            <label>
              {editId ? 'Nouveau mot de passe' : 'Mot de passe'}
              <input className="form-control" type="password" value={form.motDePasse} onChange={(event) => setForm({ ...form, motDePasse: event.target.value })} required={!editId} minLength={editId ? undefined : 6} />
            </label>
          </div>
          {editId && (
            <label className="portal-check">
              <input type="checkbox" checked={form.actif} onChange={(event) => setForm({ ...form, actif: event.target.checked })} />
              Compte actif
            </label>
          )}
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
                <th />
              </tr>
            </thead>
            <tbody>
              {comptes.length === 0 ? (
                <tr><td colSpan="4">Aucun gestionnaire de stock.</td></tr>
              ) : comptes.map((compte) => (
                <tr key={compte._id}>
                  <td>{compte.matricule}</td>
                  <td>{`${compte.prenom} ${compte.nom}`.trim() || '—'}</td>
                  <td>{compte.actif ? 'Actif' : 'Désactivé'}</td>
                  <td><button className="btn btn-secondary" type="button" onClick={() => editer(compte)}>Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default ComptesLogistique;
