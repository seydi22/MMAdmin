import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faUsers, faShieldHalved, faEye, faEllipsis, faPen, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Organisation.css';
import './Dashboard.css';
import { backendMsisdn, isLocalMsisdn, isNni, localMsisdn, nniDigits } from '../utils/saisie';

const EMPTY_SEAT = {
  matricule: '',
  motDePasse: '',
  nom: '',
  prenom: '',
  nni: '',
  moovMoneyMsisdn: '',
};

const EMPTY_MEMBER = { nom: '', prenom: '', nni: '', msisdn: '' };
const NOUAKCHOTT = ['Nouakchott-Nord', 'Nouakchott-Ouest', 'Nouakchott-Sud'];

function pamReady(pam) {
  return Boolean(pam && (pam.zoneId || (pam.region && pam.moughataa)));
}

function terrainLabel(pam, zones) {
  if (pam && pam.zoneId) {
    const zone = (zones || []).find((item) => String(item._id) === String(pam.zoneId));
    if (!zone) return 'Zone à réaffecter';
    const names = (zone.wilayas || []).join(', ');
    return names ? `${zone.nom} · ${names}` : zone.nom;
  }
  if (pam && pam.region && pam.moughataa) return `${pam.region} · ${pam.moughataa}`;
  return 'À rattacher';
}

function freshEam() {
  return {
    nom: '',
    samMode: 'existing',
    samId: '',
    sam: { ...EMPTY_SEAT },
    equipe: { ...EMPTY_SEAT },
    membre1: { ...EMPTY_MEMBER },
    membre2: { ...EMPTY_MEMBER },
  };
}

const EMPTY_USER = {
  matricule: '',
  motDePasse: '',
  nom: '',
  prenom: '',
  nni: '',
  moovMoneyMsisdn: '',
};

function personLabel(person) {
  if (!person || typeof person !== 'object') return '—';
  const name = [person.prenom, person.nom].filter(Boolean).join(' ').trim();
  if (name && person.matricule) return `${name} (${person.matricule})`;
  return name || person.matricule || '—';
}

function refId(ref) {
  if (!ref) return '';
  if (typeof ref === 'object') return String(ref._id || '');
  return String(ref);
}

function isActive(item) {
  return item && item.actif !== false;
}

function memberBody(member) {
  return {
    nom: String(member.nom || '').trim(),
    prenom: String(member.prenom || '').trim(),
    nni: nniDigits(member.nni),
    msisdn: backendMsisdn(member.msisdn),
  };
}

function memberProblem(member) {
  const body = memberBody(member);
  if (!body.nom || !body.prenom) return 'Renseignez le nom et le prénom.';
  if (!isNni(body.nni)) return 'Le NNI doit contenir exactement 10 chiffres.';
  if (!isLocalMsisdn(member.msisdn)) return 'Le numéro Moov doit comporter 8 chiffres et commencer par 4, par exemple 48503366.';
  return '';
}

function identityBody(seat) {
  return {
    nom: String(seat.nom || '').trim(),
    prenom: String(seat.prenom || '').trim(),
    nni: nniDigits(seat.nni),
    moovMoneyMsisdn: backendMsisdn(seat.moovMoneyMsisdn),
    motDePasse: seat.motDePasse,
  };
}

function identityProblem(seat) {
  const body = identityBody(seat);
  if (!body.nom || !body.prenom) return 'Renseignez le nom et le prénom.';
  if (!isNni(body.nni)) return 'Le NNI doit contenir exactement 10 chiffres.';
  if (!isLocalMsisdn(seat.moovMoneyMsisdn)) return 'Le numéro Moov doit comporter 8 chiffres et commencer par 4, par exemple 48503366.';
  if (String(body.motDePasse || '').length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return '';
}

const Organisation = () => {
  const [data, setData] = useState({ pams: [], eams: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPamId, setSelectedPamId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [menuKey, setMenuKey] = useState('');
  const [composer, setComposer] = useState(null);
  const [territoires, setTerritoires] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [zoneDraft, setZoneDraft] = useState({ id: '', nom: '', wilayas: [] });
  const [previewCode, setPreviewCode] = useState('');

  const [pamForm, setPamForm] = useState({ nom: '', compte: { ...EMPTY_SEAT } });
  const [linkForm, setLinkForm] = useState({ mode: 'create', role: 'sam', userId: '', seat: { ...EMPTY_SEAT } });
  const [eamForm, setEamForm] = useState(freshEam);
  const [eamEditId, setEamEditId] = useState(null);
  const [eamTeam, setEamTeam] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [userEditId, setUserEditId] = useState(null);

  const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

  const loadCode = async (params) => {
    try {
      const query = new URLSearchParams(params);
      const res = await axios.get(`${API_BASE_URL}/api/organization/prochain-code?${query}`, { headers: headers() });
      setPreviewCode(res.data.code || '');
    } catch (err) {
      setPreviewCode('');
    }
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const [res, geo] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/organization`, { headers: headers() }),
        axios.get(`${API_BASE_URL}/api/organization/territoire`, { headers: headers() }),
      ]);
      setData(res.data);
      setTerritoires(geo.data.territoires || []);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger l\'organisation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPam = data.pams.find((pam) => String(pam._id) === String(selectedPamId)) || null;

  const peopleOf = useCallback((pamId, role) => (
    data.users.filter((user) => user.role === role && refId(user.pamId) === String(pamId))
  ), [data.users]);

  const holder = useMemo(() => {
    if (!selectedPam) return null;
    const holders = peopleOf(selectedPam._id, 'pam');
    return holders.find(isActive) || holders[0] || null;
  }, [peopleOf, selectedPam]);

  const sams = useMemo(
    () => (selectedPam ? peopleOf(selectedPam._id, 'sam') : []),
    [peopleOf, selectedPam]
  );
  const cams = useMemo(
    () => (selectedPam ? peopleOf(selectedPam._id, 'cam') : []),
    [peopleOf, selectedPam]
  );
  const teams = useMemo(() => (
    selectedPam ? data.eams.filter((eam) => refId(eam.pamId) === String(selectedPam._id)) : []
  ), [data.eams, selectedPam]);

  const activeSams = sams.filter(isActive);

  const submit = async (request) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await request();
      setMessage('Enregistrement effectué.');
      await load();
    } catch (err) {
      setError(err.response?.data?.msg || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const focusEditor = () => {
    requestAnimationFrame(() => {
      document.getElementById('org-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openPam = (pam) => {
    setSelectedZoneId(pam.zoneId || null);
    setSelectedPamId(pam._id);
    setEamEditId(null);
    setUserEditId(null);
    setError('');
    setMessage('');
    if (!pam.zoneId) {
      setPamForm({ zoneId: '', compte: { ...EMPTY_SEAT } });
      setComposer('pam-territory');
      focusEditor();
      return;
    }
    setComposer(null);
  };

  const closeComposer = () => {
    setComposer(null);
    setEamEditId(null);
    setEamTeam(null);
    setUserEditId(null);
    setPamForm({ nom: '', compte: { ...EMPTY_SEAT } });
    setLinkForm({ mode: 'create', role: 'sam', userId: '', seat: { ...EMPTY_SEAT } });
    setEamForm(freshEam());
    setUserForm(EMPTY_USER);
    setPreviewCode('');
  };

  const removeZone = (zone) => {
    const wilayas = zone.wilayas || [];
    const officielles = wilayas.filter((name) => NOUAKCHOTT.includes(name));
    const autres = wilayas.filter((name) => !NOUAKCHOTT.includes(name));
    if (officielles.length && !autres.length) {
      setMessage('');
      setError(`${officielles.join(', ')} ${officielles.length > 1 ? 'restent des zones' : 'reste une zone'} du référentiel. Vous pouvez la renommer.`);
      return;
    }
    const lies = data.pams.filter((pam) => String(pam.zoneId) === String(zone._id));
    const details = [`Supprimer la zone ${zone.nom} ?`];
    if (lies.length) {
      details.push(`${lies.length} PAM ${lies.length > 1 ? 'reviennent' : 'revient'} dans PAM à affecter. Leurs équipes retrouvent un territoire quand vous les réaffectez.`);
    } else if (wilayas.length && !officielles.length) {
      details.push('Ses wilayas redeviennent disponibles.');
    }
    if (officielles.length) {
      details.push(`${officielles.join(', ')} ${officielles.length > 1 ? 'redeviennent des zones' : 'redevient une zone'} à part.`);
    }
    if (!window.confirm(details.join('\n\n'))) return;
    submit(async () => {
      await axios.delete(`${API_BASE_URL}/api/organization/zones/${zone._id}`, { headers: headers() });
      if (String(zoneDraft.id) === String(zone._id)) setZoneDraft({ id: '', nom: '', wilayas: [] });
    });
  };

  const saveZone = (event) => {
    event.preventDefault();
    const nom = zoneDraft.nom.trim();
    if (!nom) {
      setError('Donnez un nom à la zone.');
      return;
    }
    submit(async () => {
      const body = { nom, wilayas: zoneDraft.wilayas };
      if (zoneDraft.id) {
        await axios.put(`${API_BASE_URL}/api/organization/zones/${zoneDraft.id}`, body, { headers: headers() });
      } else {
        await axios.post(`${API_BASE_URL}/api/organization/zones`, body, { headers: headers() });
      }
      setZoneDraft({ id: '', nom: '', wilayas: [] });
    });
  };

  const savePam = (event) => {
    event.preventDefault();
    if (!zoneId) {
      setError('Choisissez une zone.');
      return;
    }
    const body = { compte: identityBody(pamForm.compte), zoneId };
    const holderGap = identityProblem(pamForm.compte);
    if (holderGap) {
      setError(holderGap);
      return;
    }
    submit(async () => {
      const res = await axios.post(`${API_BASE_URL}/api/organization/pams`, body, { headers: headers() });
      closeComposer();
      setSelectedPamId(res.data._id);
    });
  };

  const saveTerritory = (event) => {
    event.preventDefault();
    if (!selectedPam) return;
    if (!pamForm.zoneId) {
      setError('Choisissez une zone.');
      return;
    }
    submit(async () => {
      await axios.put(`${API_BASE_URL}/api/organization/pams/${selectedPam._id}`, {
        zoneId: pamForm.zoneId,
      }, { headers: headers() });
      setSelectedZoneId(pamForm.zoneId);
      closeComposer();
    });
  };

  const saveLink = (event, role) => {
    event.preventDefault();
    if (!selectedPam) return;
    if (linkForm.mode === 'assign') {
      if (!linkForm.userId) {
        setError(role === 'sam' ? 'Choisissez le SAM à affecter.' : 'Choisissez le CAM à affecter.');
        return;
      }
      submit(async () => {
        await axios.put(`${API_BASE_URL}/api/organization/users/${linkForm.userId}`, {
          role,
          pamId: selectedPam._id,
        }, { headers: headers() });
        closeComposer();
      });
      return;
    }
    const identityGap = identityProblem(linkForm.seat);
    if (identityGap) {
      setError(identityGap);
      return;
    }
    submit(async () => {
      await axios.post(`${API_BASE_URL}/api/organization/users`, {
        ...identityBody(linkForm.seat),
        role,
        pamId: selectedPam._id,
      }, { headers: headers() });
      closeComposer();
    });
  };

  const saveEam = (event) => {
    event.preventDefault();
    if (!selectedPam) return;
    const body = { pamId: selectedPam._id };
    if (eamForm.samMode === 'new') {
      const samGap = identityProblem(eamForm.sam);
      if (samGap) {
        setError(samGap);
        return;
      }
      body.sam = identityBody(eamForm.sam);
    } else if (!eamForm.samId) {
      setError('Affectez un SAM de ce PAM, ou créez-en un dans le même formulaire.');
      return;
    } else {
      body.samId = eamForm.samId;
    }
    const memberGap = memberProblem(eamForm.membre1) || memberProblem(eamForm.membre2);
    if (memberGap) {
      setError(memberGap);
      return;
    }
    if (memberBody(eamForm.membre1).nni === memberBody(eamForm.membre2).nni) {
      setError('Les deux membres doivent avoir des NNI différents.');
      return;
    }
    if (memberBody(eamForm.membre1).msisdn === memberBody(eamForm.membre2).msisdn) {
      setError('Les deux membres doivent avoir des MSISDN différents.');
      return;
    }
    body.membres = [memberBody(eamForm.membre1), memberBody(eamForm.membre2)];
    if (!eamTeam) {
      if (String(eamForm.equipe.motDePasse || '').length < 6) {
        setError('Indiquez le mot de passe du compte de l\'équipe (6 caractères minimum).');
        return;
      }
      body.equipe = { motDePasse: eamForm.equipe.motDePasse };
    }
    submit(async () => {
      if (eamEditId) {
        await axios.put(`${API_BASE_URL}/api/organization/eams/${eamEditId}`, body, { headers: headers() });
        if (eamTeam && String(eamForm.equipe.motDePasse || '').length >= 6) {
          await axios.put(`${API_BASE_URL}/api/organization/users/${eamTeam._id}`, {
            motDePasse: eamForm.equipe.motDePasse,
          }, { headers: headers() });
        }
      } else {
        await axios.post(`${API_BASE_URL}/api/organization/eams`, body, { headers: headers() });
      }
      closeComposer();
    });
  };

  const saveUser = (event) => {
    event.preventDefault();
    if (!userForm.nom.trim() || !userForm.prenom.trim()) {
      setError('Renseignez le nom et le prénom.');
      return;
    }
    if (!isNni(userForm.nni)) {
      setError('Le NNI doit contenir exactement 10 chiffres.');
      return;
    }
    if (!isLocalMsisdn(userForm.moovMoneyMsisdn)) {
      setError('Le numéro Moov doit comporter 8 chiffres et commencer par 4, par exemple 48503366.');
      return;
    }
    if (userForm.motDePasse && userForm.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    const body = {
      nom: userForm.nom.trim(),
      prenom: userForm.prenom.trim(),
      nni: nniDigits(userForm.nni),
      moovMoneyMsisdn: backendMsisdn(userForm.moovMoneyMsisdn),
    };
    if (userForm.motDePasse) body.motDePasse = userForm.motDePasse;
    submit(async () => {
      await axios.put(`${API_BASE_URL}/api/organization/users/${userEditId}`, body, { headers: headers() });
      closeComposer();
    });
  };

  const toggleActif = (kind, item) => {
    const next = !isActive(item);
    const path = kind === 'users'
      ? `${API_BASE_URL}/api/organization/users/${item._id}`
      : `${API_BASE_URL}/api/organization/${kind}/${item._id}`;
    submit(() => axios.put(path, { actif: next }, { headers: headers() }));
  };

  const startUserEdit = (user) => {
    setComposer('user');
    setUserEditId(user._id);
    setUserForm({
      matricule: user.matricule || '',
      motDePasse: '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      nni: nniDigits(user.nni),
      moovMoneyMsisdn: localMsisdn(user.moovMoneyMsisdn),
    });
    focusEditor();
  };

  const startTeam = () => {
    setEamEditId(null);
    setEamTeam(null);
    setEamForm({
      ...freshEam(),
      samMode: activeSams.length ? 'existing' : 'new',
    });
    setComposer('eam');
    if (selectedPam) loadCode({ role: 'eam', pamId: selectedPam._id });
    focusEditor();
  };

  const startTeamEdit = (eam) => {
    const equipe = eam.equipe || data.users.find(
      (user) => user.role === 'aam' && refId(user.eamId) === String(eam._id) && isActive(user)
    );
    setEamEditId(eam._id);
    setEamTeam(equipe || null);
    const membres = Array.isArray(eam.membres) ? eam.membres : [];
    const memberForm = (member) => ({
      nom: member?.nom || '',
      prenom: member?.prenom || '',
      nni: nniDigits(member?.nni),
      msisdn: localMsisdn(member?.msisdn),
    });
    setEamForm({
      ...freshEam(),
      nom: eam.nom,
      samMode: 'existing',
      samId: refId(eam.samId),
      membre1: memberForm(membres[0]),
      membre2: memberForm(membres[1]),
    });
    setPreviewCode(eam.nom || '');
    setComposer('eam');
    focusEditor();
  };

  const openZone = (zone) => {
    const linked = data.pams.filter((pam) => String(pam.zoneId) === String(zone._id));
    const current = linked.find(isActive) || linked[0] || null;
    setSelectedZoneId(zone._id);
    setSelectedPamId(current ? current._id : null);
    closeComposer();
    setError('');
    setMessage('');
  };

  const startCollab = (role) => {
    if (!selectedPam || !pamReady(selectedPam)) {
      setError('Créez d\'abord le PAM de cette zone.');
      return;
    }
    setLinkForm({ mode: 'create', role, userId: '', seat: { ...EMPTY_SEAT } });
    setComposer('collab');
    loadCode({ role, pamId: selectedPam._id });
    focusEditor();
  };

  const zones = data.zones || [];

  useEffect(() => {
    const list = data.zones || [];
    if (selectedZoneId || list.length === 0) return;
    const zone = list[0];
    const linked = data.pams.filter((pam) => String(pam.zoneId) === String(zone._id));
    const current = linked.find(isActive) || linked[0] || null;
    setSelectedZoneId(zone._id);
    setSelectedPamId(current ? current._id : null);
  }, [data.zones, data.pams, selectedZoneId]);

  const zoneName = zones.find((item) => String(item._id) === String(zoneId));
  const loosePams = data.pams.filter((pam) => !zones.some((zone) => String(zone._id) === String(pam.zoneId)));

  const selectedZone = zones.find((zone) => String(zone._id) === String(selectedZoneId)) || null;
  const zonePams = selectedZone
    ? data.pams.filter((pam) => String(pam.zoneId) === String(selectedZone._id))
    : [];
  const collaborators = [...sams, ...cams].sort((a, b) => String(a.matricule || '').localeCompare(String(b.matricule || '')));
  const zoneEstOfficielle = (zone) => {
    const wilayas = zone.wilayas || [];
    return wilayas.length > 0 && wilayas.every((name) => NOUAKCHOTT.includes(name));
  };

  if (loading && data.pams.length === 0 && !error) {
    return <div className="loading-container">Chargement...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content org-page">
        <header className="main-header org-head">
          <div className="org-title">
            <span className="org-title-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>
            <div>
              <h1>Organisation</h1>
              <p>Gérez facilement votre structure organisationnelle</p>
            </div>
          </div>
        </header>

        <section className="org-flow" aria-label="Chaîne d'organisation">
          <article className="org-flow-card org-flow-zone">
            <FontAwesomeIcon icon={faLocationDot} />
            <strong>Zone</strong>
            <span>Regroupe une ou plusieurs wilayas</span>
          </article>
          <span className="org-flow-arrow" aria-hidden="true">→</span>
          <article className="org-flow-card org-flow-pam">
            <FontAwesomeIcon icon={faUsers} />
            <strong>PAM</strong>
            <span>Responsable de la zone et de son organisation</span>
          </article>
          <span className="org-flow-arrow" aria-hidden="true">→</span>
          <article className="org-flow-split">
            <div className="org-flow-sam">
              <FontAwesomeIcon icon={faUsers} />
              <strong>SAM</strong>
              <span>Supervise les équipes</span>
            </div>
            <div className="org-flow-cam">
              <FontAwesomeIcon icon={faShieldHalved} />
              <strong>CAM</strong>
              <span>Valide les marchands de grande taille</span>
            </div>
          </article>
          <span className="org-flow-arrow" aria-hidden="true">→</span>
          <article className="org-flow-card org-flow-team">
            <FontAwesomeIcon icon={faUsers} />
            <strong>Équipes</strong>
            <span>Chaque équipe a un SAM et deux membres</span>
          </article>
        </section>

        {error && <div className="org-alert org-alert-error">{error}</div>}
        {message && <div className="org-alert org-alert-ok">{message}</div>}

        <section className="org-panel">
          <div className="org-section-head">
            <h2><FontAwesomeIcon icon={faLocationDot} /> Zones</h2>
            <button
              type="button"
              className="org-btn-solid"
              onClick={() => {
                setZoneDraft({ id: '', nom: '', wilayas: [] });
                setComposer('zone');
                focusEditor();
              }}
            >
              + Nouvelle zone
            </button>
          </div>
          {composer === 'zone' && (
            <form id="org-editor" className="card org-form" onSubmit={saveZone}>
              <div className="card-header">
                <h3>{zoneDraft.id ? 'Modifier la zone' : 'Nouvelle zone'}</h3>
                <p className="org-card-hint">Une wilaya n'appartient qu'à une seule zone. Nouakchott-Nord, Nouakchott-Ouest et Nouakchott-Sud existent déjà.</p>
              </div>
              <div className="card-body org-form-grid">
                <Field label="Nom de la zone">
                  <input className="form-control" value={zoneDraft.nom} onChange={(e) => setZoneDraft({ ...zoneDraft, nom: e.target.value })} placeholder="Tiris et Adrar" />
                </Field>
                <div className="org-wilayas">
                  {territoires.map((item) => {
                    const owner = zones.find((zone) => String(zone._id) !== String(zoneDraft.id) && (zone.wilayas || []).includes(item.region));
                    return (
                      <label key={item.region}>
                        <input
                          type="checkbox"
                          checked={zoneDraft.wilayas.includes(item.region)}
                          disabled={Boolean(owner)}
                          onChange={() => setZoneDraft((current) => ({
                            ...current,
                            wilayas: current.wilayas.includes(item.region)
                              ? current.wilayas.filter((name) => name !== item.region)
                              : [...current.wilayas, item.region],
                          }))}
                        />
                        <span>{item.region}{owner ? ` · ${owner.nom}` : ''}</span>
                      </label>
                    );
                  })}
                </div>
                <FormActions saving={saving} label={zoneDraft.id ? 'Enregistrer la zone' : 'Créer la zone'} onCancel={closeComposer} />
              </div>
            </form>
          )}
          <OrgTable
            headers={['Zone', 'Wilayas', 'PAM associé', 'Statut', 'Actions']}
            rows={zones.map((zone) => {
              const linked = data.pams.filter((pam) => String(pam.zoneId) === String(zone._id));
              const current = String(zone._id) === String(selectedZoneId);
              return [
                <span className={current ? 'org-zone-name is-current' : 'org-zone-name'} key={zone._id}>{zone.nom}</span>,
                String((zone.wilayas || []).length),
                linked.length ? linked.map((pam) => pam.nom).join(', ') : '—',
                <StatusBadge key={`${zone._id}-s`} active />,
                <div className="org-row-actions" key={`${zone._id}-a`}>
                  <button type="button" className="org-btn org-btn-eye" onClick={() => openZone(zone)}>
                    <FontAwesomeIcon icon={faEye} /> Consulter
                  </button>
                  <RowMenu id={`zone-${zone._id}`} menuKey={menuKey} setMenuKey={setMenuKey}>
                    <button type="button" onClick={() => { setMenuKey(''); setZoneDraft({ id: zone._id, nom: zone.nom, wilayas: [...(zone.wilayas || [])] }); setComposer('zone'); focusEditor(); }}>Wilayas</button>
                    {!zoneEstOfficielle(zone) && (
                      <button type="button" onClick={() => { setMenuKey(''); removeZone(zone); }}>Supprimer</button>
                    )}
                  </RowMenu>
                </div>,
              ];
            })}
          />
        </section>

        {selectedZone && (
          <section className="org-split">
            <article className="org-panel org-pam-card">
              <div className="org-section-head">
                <h2><FontAwesomeIcon icon={faShieldHalved} /> Détails du PAM</h2>
                {zonePams.length === 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!(selectedZone.wilayas || []).length}
                    onClick={() => {
                      closeComposer();
                      setZoneId(selectedZone._id);
                      setComposer('pam');
                      loadCode({ role: 'pam', zoneId: selectedZone._id });
                      focusEditor();
                    }}
                  >
                    Créer le PAM
                  </button>
                )}
              </div>
              {zonePams.length > 1 && (
                <Field label="PAM de la zone">
                  <select className="form-control" value={selectedPamId || ''} onChange={(e) => { setSelectedPamId(e.target.value); closeComposer(); }}>
                    {zonePams.map((pam) => <option key={pam._id} value={pam._id}>{pam.nom}</option>)}
                  </select>
                </Field>
              )}
              {selectedPam ? (
                <dl className="org-facts">
                  <div><dt>Zone d'affectation</dt><dd>{selectedZone.nom}</dd></div>
                  <div><dt>Nom du compte</dt><dd>{selectedPam.nom}</dd></div>
                  <div><dt>Responsable</dt><dd>{personLabel(holder)}</dd></div>
                  <div><dt>Statut</dt><dd>{isActive(selectedPam) && (!holder || isActive(holder)) ? <StatusBadge active /> : <StatusBadge />}</dd></div>
                </dl>
              ) : (
                <p className="org-card-hint">Cette zone n'a pas encore de PAM. Le matricule, par exemple P04, est généré à la création.</p>
              )}
              {selectedPam && (
                <div className="org-row-actions">
                  {holder && <button type="button" className="org-btn org-btn-ghost" onClick={() => startUserEdit(holder)}>Modifier</button>}
                  <button type="button" className="org-btn org-btn-ghost" onClick={() => {
                    setPamForm({ zoneId: selectedPam.zoneId || '', compte: { ...EMPTY_SEAT } });
                    setComposer('pam-territory');
                    focusEditor();
                  }}>Changer la zone</button>
                  <button
                    type="button"
                    className={(holder ? isActive(holder) : isActive(selectedPam)) ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'}
                    onClick={() => toggleActif(holder ? 'users' : 'pams', holder || selectedPam)}
                  >
                    {(holder ? isActive(holder) : isActive(selectedPam)) ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              )}
            </article>

            <article className="org-panel">
              <div className="org-section-head">
                <h2><FontAwesomeIcon icon={faUsers} /> Collaborateurs{selectedPam ? ` du PAM (${selectedPam.nom})` : ''}</h2>
                <button type="button" className="org-btn-soft" onClick={() => startCollab(linkForm.role || 'sam')} disabled={!selectedPam}>
                  <FontAwesomeIcon icon={faUserPlus} /> Ajouter un collaborateur
                </button>
              </div>
              <OrgTable
                headers={['Nom', 'Matricule', 'Rôle', 'Statut', 'Actions']}
                rows={collaborators.map((user) => [
                  [user.prenom, user.nom].filter(Boolean).join(' ') || '—',
                  user.matricule,
                  <span key={user._id} className={user.role === 'cam' ? 'org-role org-role-cam' : 'org-role org-role-sam'}>{user.role === 'cam' ? 'CAM' : 'SAM'}</span>,
                  isActive(user) ? <StatusBadge active /> : <StatusBadge />,
                  <div className="org-row-actions" key={`${user._id}-a`}>
                    <button type="button" className="org-icon-btn" aria-label="Modifier" onClick={() => startUserEdit(user)}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className="org-icon-btn org-icon-danger"
                      aria-label={isActive(user) ? 'Désactiver' : 'Réactiver'}
                      onClick={() => toggleActif('users', user)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>,
                ])}
              />
            </article>
          </section>
        )}

        {composer === 'pam' && (
          <PamAccountForm
            title="Nouveau PAM"
            hint={`Zone ${zoneName ? zoneName.nom : ''}. Le compte et le matricule sont créés ensemble.`}
            code={previewCode}
            pamForm={pamForm}
            setPamForm={setPamForm}
            saving={saving}
            onSubmit={savePam}
            onCancel={closeComposer}
          />
        )}

        {composer === 'pam-territory' && selectedPam && (
          <form id="org-editor" className="card org-form" onSubmit={saveTerritory}>
            <div className="card-header">
              <h3>Zone du PAM</h3>
              <p className="org-card-hint">Le matricule ne change pas. Les équipes enrôlent ensuite dans la nouvelle zone.</p>
            </div>
            <div className="card-body org-form-grid">
              <Field label="Zone d'affectation">
                <select className="form-control" required value={pamForm.zoneId || ''} onChange={(e) => setPamForm({ ...pamForm, zoneId: e.target.value })}>
                  <option value="">Choisir</option>
                  {zones.filter((zone) => (zone.wilayas || []).length).map((zone) => (
                    <option key={zone._id} value={zone._id}>{zone.nom}</option>
                  ))}
                </select>
              </Field>
              <FormActions saving={saving} label="Affecter" onCancel={closeComposer} />
            </div>
          </form>
        )}

        {composer === 'collab' && selectedPam && (
          <form id="org-editor" className="card org-form" onSubmit={(event) => saveLink(event, linkForm.role)}>
            <div className="card-header">
              <h3>Ajouter un collaborateur</h3>
              <p className="org-card-hint">SAM : il peut superviser plusieurs équipes. CAM : il valide les marchands Gros de toute la zone du PAM.</p>
            </div>
            <div className="card-body org-form-grid">
              <div className="org-choice">
                <button type="button" className={linkForm.role === 'sam' ? 'is-active' : ''} onClick={() => { setLinkForm({ ...linkForm, role: 'sam' }); loadCode({ role: 'sam', pamId: selectedPam._id }); }}>SAM</button>
                <button type="button" className={linkForm.role === 'cam' ? 'is-active' : ''} onClick={() => { setLinkForm({ ...linkForm, role: 'cam' }); loadCode({ role: 'cam', pamId: selectedPam._id }); }}>CAM</button>
              </div>
              <Field label="Matricule">
                <input className="form-control org-code" readOnly value={previewCode || 'Calcul…'} />
              </Field>
              <IdentityBlock title="Identité" hint="Le matricule est généré. Il sert à la connexion." seat={linkForm.seat} onChange={(seat) => setLinkForm({ ...linkForm, seat })} />
              <FormActions saving={saving} label="Enregistrer" onCancel={closeComposer} />
            </div>
          </form>
        )}

        {composer === 'user' && (
          <form id="org-editor" className="card org-form" onSubmit={saveUser}>
            <div className="card-header">
              <h3>Modifier le compte</h3>
              <p className="org-card-hint">Matricule {userForm.matricule}. Laissez le mot de passe vide pour le conserver.</p>
            </div>
            <div className="card-body org-form-grid">
              <Field label="Nom"><input className="form-control" required value={userForm.nom} onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })} /></Field>
              <Field label="Prénom"><input className="form-control" required value={userForm.prenom} onChange={(e) => setUserForm({ ...userForm, prenom: e.target.value })} /></Field>
              <NniField value={userForm.nni} onChange={(nni) => setUserForm({ ...userForm, nni })} />
              <MsisdnField value={userForm.moovMoneyMsisdn} onChange={(moovMoneyMsisdn) => setUserForm({ ...userForm, moovMoneyMsisdn })} />
              <Field label="Nouveau mot de passe"><input className="form-control" type="password" value={userForm.motDePasse} minLength={userForm.motDePasse ? 6 : undefined} onChange={(e) => setUserForm({ ...userForm, motDePasse: e.target.value })} /></Field>
              <FormActions saving={saving} label="Enregistrer" onCancel={closeComposer} />
            </div>
          </form>
        )}

        {selectedZone && (
          <section className="org-panel">
            <div className="org-section-head">
              <h2><FontAwesomeIcon icon={faUsers} /> Équipes</h2>
              <button
                type="button"
                className="org-btn-solid"
                disabled={!selectedPam}
                onClick={() => {
                  if (!pamReady(selectedPam)) {
                    setError('Créez d\'abord le PAM de cette zone.');
                    return;
                  }
                  if (!activeSams.length) {
                    setError('Ajoutez d\'abord un collaborateur SAM.');
                    return;
                  }
                  startTeam();
                }}
              >
                + Créer une équipe
              </button>
            </div>
            {composer === 'eam' && (
              <form id="org-editor" className="card org-form" onSubmit={saveEam}>
                <div className="card-header">
                  <h3>{eamEditId ? 'Équipe' : 'Nouvelle équipe'}</h3>
                  <p className="org-card-hint">Le SAM est choisi parmi les collaborateurs de ce PAM. Le matricule de l'équipe est généré.</p>
                </div>
                <div className="card-body org-form-grid">
                  <Field label="Matricule">
                    <input className="form-control org-code" readOnly value={previewCode || (eamEditId ? eamForm.nom : '')} />
                  </Field>
                  <Field label="SAM responsable">
                    <select className="form-control" required value={eamForm.samId} onChange={(e) => setEamForm({ ...eamForm, samMode: 'existing', samId: e.target.value })}>
                      <option value="">Choisir</option>
                      {activeSams.map((sam) => <option key={sam._id} value={sam._id}>{personLabel(sam)}</option>)}
                    </select>
                  </Field>
                  <Field label={eamTeam ? 'Nouveau mot de passe du compte' : 'Mot de passe du compte'}>
                    <input
                      className="form-control"
                      type="password"
                      required={!eamTeam}
                      minLength={eamForm.equipe.motDePasse ? 6 : undefined}
                      value={eamForm.equipe.motDePasse}
                      onChange={(e) => setEamForm({ ...eamForm, equipe: { ...eamForm.equipe, motDePasse: e.target.value } })}
                    />
                  </Field>
                  <MemberBlock title="Membre 1" hint="NNI et MSISDN de la matrice." member={eamForm.membre1} onChange={(membre1) => setEamForm({ ...eamForm, membre1 })} />
                  <MemberBlock title="Membre 2" hint="NNI et MSISDN de la matrice." member={eamForm.membre2} onChange={(membre2) => setEamForm({ ...eamForm, membre2 })} />
                  <FormActions saving={saving} label={eamEditId ? 'Enregistrer' : 'Créer l\'équipe'} onCancel={closeComposer} />
                </div>
              </form>
            )}
            <OrgTable
              headers={['Équipe', 'SAM responsable', 'Membres', 'Moughataa(x) / Localités', 'Statut', 'Actions']}
              rows={teams.map((eam) => {
                const count = Array.isArray(eam.membres) ? eam.membres.length : 0;
                const cover = (selectedZone.wilayas || []).join(', ') || selectedZone.nom;
                return [
                  eam.nom,
                  personLabel(eam.samId),
                  <span className="org-members" key={`${eam._id}-m`}><FontAwesomeIcon icon={faUsers} /> {count} membre{count > 1 ? 's' : ''}</span>,
                  cover,
                  isActive(eam) ? <StatusBadge active /> : <StatusBadge />,
                  <div className="org-row-actions" key={eam._id}>
                    <button type="button" className="org-btn org-btn-eye" onClick={() => startTeamEdit(eam)}>
                      <FontAwesomeIcon icon={faEye} /> Détails
                    </button>
                    <RowMenu id={`eam-${eam._id}`} menuKey={menuKey} setMenuKey={setMenuKey}>
                      <button type="button" onClick={() => { setMenuKey(''); toggleActif('eams', eam); }}>
                        {isActive(eam) ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </RowMenu>
                  </div>,
                ];
              })}
            />
          </section>
        )}

        {loosePams.length > 0 && (
          <section className="org-panel">
            <div className="org-section-head">
              <div>
                <h2>PAM à affecter</h2>
                <p>Ces PAM ne sont pas encore dans une zone. Ouvrez-en un, puis changez sa zone.</p>
              </div>
            </div>
            <OrgTable
              headers={['PAM', 'Terrain actuel', 'Compte', 'Statut', 'Actions']}
              rows={loosePams.map((pam) => {
                const holders = peopleOf(pam._id, 'pam');
                const person = holders.find(isActive) || holders[0];
                return [
                  pam.nom,
                  terrainLabel(pam, zones),
                  personLabel(person),
                  isActive(pam) ? <StatusBadge active /> : <StatusBadge />,
                  <button key={pam._id} type="button" className="org-btn org-btn-ghost" onClick={() => openPam(pam)}>Ouvrir</button>,
                ];
              })}
            />
          </section>
        )}
      </main>
    </div>
  );
};

function PamAccountForm({ title, hint, code, pamForm, setPamForm, saving, onSubmit, onCancel }) {
  return (
    <form id="org-editor" className="card org-form" onSubmit={onSubmit}>
      <div className="card-header">
        <h3>{title}</h3>
        <p className="org-card-hint">{hint}</p>
      </div>
      <div className="card-body org-form-grid">
        <Field label="Code">
          <input className="form-control org-code" readOnly value={code || 'Calcul…'} />
        </Field>
        <IdentityBlock
          title="Titulaire"
          hint="Ce code devient aussi le matricule de connexion."
          seat={pamForm.compte}
          onChange={(compte) => setPamForm({ ...pamForm, compte })}
        />
        <FormActions saving={saving} label="Créer le PAM" onCancel={onCancel} />
      </div>
    </form>
  );
}

function FormActions({ saving, label, onCancel }) {
  return (
    <div className="org-form-actions">
      <button className="btn btn-primary" type="submit" disabled={saving}>{label}</button>
      <button className="org-btn org-btn-ghost" type="button" onClick={onCancel}>Annuler</button>
    </div>
  );
}

function MemberBlock({ title, hint, member, onChange }) {
  const set = (key) => (event) => onChange({ ...member, [key]: event.target.value });
  return (
    <div className="org-seat">
      <div className="org-seat-head">
        <h4>{title}</h4>
        {hint ? <p className="org-seat-hint">{hint}</p> : null}
      </div>
      <div className="org-seat-grid">
        <Field label="Nom"><input className="form-control" required value={member.nom} onChange={set('nom')} /></Field>
        <Field label="Prénom"><input className="form-control" required value={member.prenom} onChange={set('prenom')} /></Field>
        <NniField value={member.nni} onChange={(nni) => onChange({ ...member, nni })} />
        <MsisdnField value={member.msisdn} onChange={(msisdn) => onChange({ ...member, msisdn })} />
      </div>
    </div>
  );
}

function IdentityBlock({ title, hint, seat, onChange }) {
  const set = (key) => (event) => onChange({ ...seat, [key]: event.target.value });
  return (
    <div className="org-seat">
      <div className="org-seat-head">
        <h4>{title}</h4>
        {hint ? <p className="org-seat-hint">{hint}</p> : null}
      </div>
      <div className="org-seat-grid">
        <Field label="Nom"><input className="form-control" required value={seat.nom} onChange={set('nom')} /></Field>
        <Field label="Prénom"><input className="form-control" required value={seat.prenom} onChange={set('prenom')} /></Field>
        <NniField value={seat.nni} onChange={(nni) => onChange({ ...seat, nni })} />
        <MsisdnField value={seat.moovMoneyMsisdn} onChange={(moovMoneyMsisdn) => onChange({ ...seat, moovMoneyMsisdn })} />
        <Field label="Mot de passe"><input className="form-control" type="password" required minLength={6} value={seat.motDePasse} onChange={set('motDePasse')} /></Field>
      </div>
    </div>
  );
}

function NniField({ value, onChange, required = true }) {
  return (
    <Field label="NNI">
      <input
        className="form-control"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder="10 chiffres"
        required={required}
        value={value}
        onChange={(event) => onChange(nniDigits(event.target.value))}
      />
      <p className="org-field-hint">Exactement 10 chiffres.</p>
    </Field>
  );
}

function MsisdnField({ value, onChange, required = true }) {
  const local = localMsisdn(value);
  const started = local.length > 0;
  const invalid = started && !local.startsWith('4');
  return (
    <Field label="MSISDN Moov Money">
      <div className="org-msisdn">
        <span>+222</span>
        <input
          className="form-control"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          placeholder="48503366"
          required={required}
          value={local}
          onChange={(event) => onChange(localMsisdn(event.target.value))}
        />
      </div>
      <p className={invalid ? 'org-field-hint org-field-hint-bad' : 'org-field-hint'}>
        8 chiffres, toujours commençant par 4. Exemple : 48503366.
      </p>
    </Field>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ active = false }) {
  return <span className={active ? 'org-badge org-badge-on' : 'org-badge org-badge-off'}>{active ? 'Actif' : 'Inactif'}</span>;
}

function RowMenu({ id, menuKey, setMenuKey, children }) {
  const open = menuKey === id;
  return (
    <div className="org-menu">
      <button type="button" className="org-icon-btn" aria-label="Autres actions" aria-expanded={open} onClick={() => setMenuKey(open ? '' : id)}>
        <FontAwesomeIcon icon={faEllipsis} />
      </button>
      {open && <div className="org-menu-pop">{children}</div>}
    </div>
  );
}

function OrgTable({ headers, rows }) {
  return (
    <div className="card org-table-wrap">
      <div className="card-body table-responsive">
        <table className="table org-table">
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="org-empty" colSpan={headers.length}>Aucun élément.</td></tr>
            ) : rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Organisation;
