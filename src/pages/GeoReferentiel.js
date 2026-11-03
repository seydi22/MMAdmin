import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './GeoReferentiel.css';

const GeoReferentiel = () => {
  const [territoires, setTerritoires] = useState([]);
  const [regionIndex, setRegionIndex] = useState(0);
  const [moughataaIndex, setMoughataaIndex] = useState(0);
  const [communeIndex, setCommuneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState({ wilaya: '', moughataa: '', commune: '', localite: '' });

  const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/organization/territoire`, { headers: headers() });
        setTerritoires(normalizeTree(res.data.territoires));
      } catch (err) {
        setError(err.response?.data?.msg || 'Impossible de charger le référentiel.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const region = territoires[regionIndex];
  const moughataa = region?.moughataas?.[moughataaIndex];
  const commune = moughataa?.communes?.[communeIndex];

  const patchRegion = (patch) => {
    setTerritoires((current) => current.map((item, index) => (
      index === regionIndex ? { ...item, ...patch } : item
    )));
  };

  const patchMoughataa = (patch) => {
    if (!region) return;
    const moughataas = region.moughataas.map((item, index) => (
      index === moughataaIndex ? { ...item, ...patch } : item
    ));
    patchRegion({ moughataas });
  };

  const patchCommune = (patch) => {
    if (!moughataa) return;
    const communes = moughataa.communes.map((item, index) => (
      index === communeIndex ? { ...item, ...patch } : item
    ));
    patchMoughataa({ communes });
  };

  const addMoughataa = () => {
    if (!region) return;
    const moughataas = [...region.moughataas, { nom: '', communes: [{ nom: '', localites: [''] }] }];
    patchRegion({ moughataas });
    setMoughataaIndex(moughataas.length - 1);
    setCommuneIndex(0);
  };

  const addCommune = () => {
    if (!moughataa) return;
    const communes = [...moughataa.communes, { nom: '', localites: [''] }];
    patchMoughataa({ communes });
    setCommuneIndex(communes.length - 1);
  };

  const updateLocalite = (localiteIndex, value) => {
    if (!commune) return;
    const localites = commune.localites.map((item, index) => (index === localiteIndex ? value : item));
    patchCommune({ localites });
  };

  const addLocalite = () => {
    if (!commune) return;
    patchCommune({ localites: [...(commune.localites || []), ''] });
  };

  const removeLocalite = (localiteIndex) => {
    if (!commune || commune.localites.length < 2) return;
    patchCommune({ localites: commune.localites.filter((_, index) => index !== localiteIndex) });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/organization/territoire`,
        { territoires },
        { headers: headers() }
      );
      setTerritoires(normalizeTree(res.data.territoires));
      setMessage('Référentiel enregistré.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const visible = (items, query, nameOf) => items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => contains(nameOf(item), query));

  const wilayas = visible(territoires, search.wilaya, (item) => item.region);
  const moughataas = visible(region?.moughataas || [], search.moughataa, (item) => item.nom);
  const communes = visible(moughataa?.communes || [], search.commune, (item) => item.nom);
  const localites = visible(commune?.localites || [], search.localite, (item) => item);
  const path = [region?.region, moughataa?.nom, commune?.nom].filter(Boolean).join(' · ');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content geo-page">
        <header className="main-header">
          <h1>Référentiel géographique</h1>
        </header>
        <p className="geo-intro">
          Wilaya, moughataa, commune et localité utilisées par les équipes. Choisissez une ligne pour ouvrir le niveau suivant. Le code de la wilaya ne change pas quand le nom est corrigé.
        </p>
        {error && <div className="geo-alert geo-alert-error">{error}</div>}
        {message && <div className="geo-alert geo-alert-ok">{message}</div>}
        {loading ? <div className="geo-loading">Chargement...</div> : (
          <form className="geo-board" onSubmit={save}>
            <Column
              title="Wilayas"
              count={territoires.length}
              query={search.wilaya}
              onQuery={(wilaya) => setSearch({ ...search, wilaya })}
            >
              {wilayas.map(({ item, index }) => (
                <Row
                  key={`${item.code}-${index}`}
                  active={index === regionIndex}
                  onSelect={() => {
                    setRegionIndex(index);
                    setMoughataaIndex(0);
                    setCommuneIndex(0);
                  }}
                  value={item.region || ''}
                  onChange={(value) => {
                    setRegionIndex(index);
                    setTerritoires((current) => current.map((zone, zoneIndex) => (
                      zoneIndex === index ? { ...zone, region: value } : zone
                    )));
                  }}
                  badge={item.code}
                />
              ))}
            </Column>
            <Column
              title="Moughataas"
              count={(region?.moughataas || []).length}
              query={search.moughataa}
              onQuery={(moughataa) => setSearch({ ...search, moughataa })}
              onAdd={addMoughataa}
              addLabel="Ajouter"
            >
              {moughataas.map(({ item, index }) => (
                <Row
                  key={`${item.nom}-${index}`}
                  active={index === moughataaIndex}
                  onSelect={() => {
                    setMoughataaIndex(index);
                    setCommuneIndex(0);
                  }}
                  value={item.nom || ''}
                  placeholder="Nouvelle moughataa"
                  onChange={(value) => {
                    setMoughataaIndex(index);
                    const next = region.moughataas.map((zone, zoneIndex) => (
                      zoneIndex === index ? { ...zone, nom: value } : zone
                    ));
                    patchRegion({ moughataas: next });
                  }}
                />
              ))}
            </Column>
            <Column
              title="Communes"
              count={(moughataa?.communes || []).length}
              query={search.commune}
              onQuery={(communeName) => setSearch({ ...search, commune: communeName })}
              onAdd={addCommune}
              addLabel="Ajouter"
            >
              {communes.map(({ item, index }) => (
                <Row
                  key={`${item.nom}-${index}`}
                  active={index === communeIndex}
                  onSelect={() => setCommuneIndex(index)}
                  value={item.nom || ''}
                  placeholder="Nouvelle commune"
                  onChange={(value) => {
                    setCommuneIndex(index);
                    const next = moughataa.communes.map((zone, zoneIndex) => (
                      zoneIndex === index ? { ...zone, nom: value } : zone
                    ));
                    patchMoughataa({ communes: next });
                  }}
                  onRemove={(moughataa?.communes || []).length > 1 ? () => {
                    const next = moughataa.communes.filter((_, zoneIndex) => zoneIndex !== index);
                    patchMoughataa({ communes: next });
                    setCommuneIndex((current) => Math.min(current > index ? current - 1 : current, next.length - 1));
                  } : null}
                />
              ))}
            </Column>
            <Column
              title="Localités"
              count={(commune?.localites || []).length}
              query={search.localite}
              onQuery={(localite) => setSearch({ ...search, localite })}
              onAdd={addLocalite}
              addLabel="Ajouter"
            >
              {localites.map(({ item, index }) => (
                <Row
                  key={`localite-${index}`}
                  value={item}
                  placeholder="Nouvelle localité"
                  onChange={(value) => updateLocalite(index, value)}
                  onRemove={(commune?.localites || []).length > 1 ? () => removeLocalite(index) : null}
                />
              ))}
            </Column>
            <div className="geo-savebar">
              <p>{path || 'Choisissez une wilaya.'}</p>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

function contains(value, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return true;
  return String(value || '').toLowerCase().includes(needle);
}

function normalizeTree(tree) {
  if (!Array.isArray(tree)) return [];
  return tree.map((zone) => ({
    region: zone?.region || '',
    code: zone?.code || '',
    moughataas: (zone?.moughataas || []).map((moughataa) => ({
      nom: moughataa?.nom || '',
      communes: (moughataa?.communes || []).map((commune) => {
        if (typeof commune === 'string') return { nom: commune, localites: [commune] };
        const localites = Array.isArray(commune?.localites) ? commune.localites.map((item) => String(item ?? '')) : [''];
        return { nom: commune?.nom || '', localites: localites.length ? localites : [''] };
      }),
    })),
  }));
}

function Column({ title, count, query, onQuery, onAdd, addLabel, children }) {
  return (
    <section className="geo-col">
      <header className="geo-col-head">
        <h2>{title}</h2>
        <span>{count}</span>
      </header>
      <input
        className="form-control geo-search"
        value={query}
        placeholder="Rechercher"
        onChange={(event) => onQuery(event.target.value)}
      />
      <div className="geo-col-list">{children}</div>
      {onAdd && (
        <button type="button" className="btn btn-secondary geo-add" onClick={onAdd}>{addLabel}</button>
      )}
    </section>
  );
}

function Row({ active, onSelect, value, onChange, placeholder, badge, onRemove }) {
  return (
    <div className={active ? 'geo-row is-active' : 'geo-row'} onClick={onSelect}>
      <input
        className="geo-name"
        value={value}
        placeholder={placeholder}
        onClick={(event) => event.stopPropagation()}
        onFocus={onSelect}
        onChange={(event) => onChange(event.target.value)}
      />
      {badge ? <span className="geo-code">{badge}</span> : null}
      {onRemove ? (
        <button type="button" className="geo-remove" onClick={(event) => { event.stopPropagation(); onRemove(); }}>
          Retirer
        </button>
      ) : null}
    </div>
  );
}

export default GeoReferentiel;
