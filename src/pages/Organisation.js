import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Organisation.css';
import './Dashboard.css';
import { backendMsisdn, formatMsisdn, isLocalMsisdn, isNni, localMsisdn, nniDigits } from '../utils/saisie';

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

function membersLabel(eam) {
  const list = Array.isArray(eam && eam.membres) ? eam.membres : [];
  if (list.length === 0) return '—';
  return list.map((member) => {
    const name = [member.prenom, member.nom].filter(Boolean).join(' ');
    const ids = [member.nni, formatMsisdn(member.msisdn)].filter((item) => item && item !== '—').join(' · ');
    if (name && ids) return `${name} (${ids})`;
    return name || ids || '—';
  }).join(' · ');
}

const Organisation = () => {
  const [data, setData] = useState({ pams: [], eams: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPamId, setSelectedPamId] = useState(null);
  const [composer, setComposer] = useState(null);
  const [territoires, setTerritoires] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [zoneDraft, setZoneDraft] = useState({ id: '', nom: '', wilayas: [] });
  const [previewCode, setPreviewCode] = useState('');

  const [pamForm, setPamForm] = useState({ nom: '', compte: { ...EMPTY_SEAT } });
  const [linkForm, setLinkForm] = useState({ mode: 'create', userId: '', seat: { ...EMPTY_SEAT } });
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
  const movable = (role) => data.users.filter(
    (user) => user.role === role && isActive(user) && refId(user.pamId) !== String(selectedPamId)
  );

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
    setSelectedPamId(pam._id);
    setComposer(null);
    setEamEditId(null);
    setUserEditId(null);
    setError('');
    setMessage('');
  };

  const closeComposer = () => {
    setComposer(null);
    setEamEditId(null);
    setEamTeam(null);
    setUserEditId(null);
    setPamForm({ nom: '', compte: { ...EMPTY_SEAT } });
    setLinkForm({ mode: 'create', userId: '', seat: { ...EMPTY_SEAT } });
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

  const zones = data.zones || [];
  const zoneName = zones.find((item) => String(item._id) === String(zoneId));
  const loosePams = data.pams.filter((pam) => !zones.some((zone) => String(zone._id) === String(pam.zoneId)));
  const pamCells = (pam) => {
    const holders = peopleOf(pam._id, 'pam');
    const person = holders.find(isActive) || holders[0];
    return [
      pam.nom,
      personLabel(person),
      String(peopleOf(pam._id, 'sam').length),
      String(peopleOf(pam._id, 'cam').length),
      String(pam.eamCount || 0),
      isActive(pam) ? <StatusBadge active /> : <StatusBadge />,
      <div className="org-row-actions" key={pam._id}>
        <button type="button" className="org-btn org-btn-ghost" onClick={() => openPam(pam)}>Consulter</button>
        <button type="button" className={isActive(pam) ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'} onClick={() => toggleActif('pams', pam)}>
          {isActive(pam) ? 'Désactiver' : 'Réactiver'}
        </button>
      </div>,
    ];
  };

  if (loading && data.pams.length === 0 && !error) {
    return <div className="loading-container">Chargement...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content org-page">
        <header className="main-header">
          <h1>{selectedPam ? selectedPam.nom : 'Organisation'}</h1>
        </header>

        {selectedPam ? (
          <button type="button" className="org-back" onClick={() => { setSelectedPamId(null); closeComposer(); }}>
            Tous les PAM
          </button>
        ) : (
          <p className="org-intro">
            Une zone regroupe une ou plusieurs wilayas. Le back-office y affecte le PAM, et peut le changer de zone.
            Nouakchott-Nord, Nouakchott-Ouest et Nouakchott-Sud sont chacune une zone : toutes les moughataas et localités de la wilaya.
            Le matricule reste court : P01, S01, C01, E01.
          </p>
        )}

        {error && <div className="org-alert org-alert-error">{error}</div>}
        {message && <div className="org-alert org-alert-ok">{message}</div>}

        {!selectedPam && (
          <form className="card org-form" onSubmit={saveZone}>
            <div className="card-header">
              <h3>{zoneDraft.id ? 'Modifier la zone' : 'Nouvelle zone'}</h3>
              <p className="org-card-hint">Le nom est libre. Une wilaya ne peut appartenir qu'à une seule zone. Nouakchott-Nord, Nouakchott-Ouest et Nouakchott-Sud sont déjà des zones.</p>
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
              <FormActions saving={saving} label={zoneDraft.id ? 'Enregistrer la zone' : 'Créer la zone'} onCancel={() => setZoneDraft({ id: '', nom: '', wilayas: [] })} />
            </div>
          </form>
        )}

        {!selectedPam && zones.map((zone) => (
          <section className="org-section" key={zone._id}>
            <div className="org-section-head">
              <div>
                <h2>{zone.nom}</h2>
                <p>{(zone.wilayas || []).length ? zone.wilayas.join(', ') : 'Aucune wilaya pour le moment.'}</p>
              </div>
              <div className="org-row-actions">
                <button type="button" className="org-btn org-btn-ghost" onClick={() => setZoneDraft({ id: zone._id, nom: zone.nom, wilayas: [...(zone.wilayas || [])] })}>Renommer et wilayas</button>
                <button type="button" className="org-btn org-btn-danger" onClick={() => removeZone(zone)}>Supprimer</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!(zone.wilayas || []).length}
                  onClick={() => {
                    closeComposer();
                    setZoneId(zone._id);
                    setComposer('pam');
                    loadCode({ role: 'pam', zoneId: zone._id });
                    focusEditor();
                  }}
                >Nouveau PAM</button>
              </div>
            </div>
            <OrgTable
              headers={['PAM', 'Compte', 'SAM', 'CAM', 'Équipes', 'Statut', 'Actions']}
              rows={data.pams.filter((pam) => String(pam.zoneId) === String(zone._id)).map(pamCells)}
            />
          </section>
        ))}

        {!selectedPam && composer === 'pam' && (
          <PamAccountForm
            title="Nouveau PAM"
            hint={`Zone ${zoneName ? zoneName.nom : ''}. Le matricule est court, par exemple P01. Saisissez seulement l'identité du titulaire.`}
            code={previewCode}
            pamForm={pamForm}
            setPamForm={setPamForm}
            saving={saving}
            onSubmit={savePam}
            onCancel={closeComposer}
          />
        )}

        {!selectedPam && loosePams.length > 0 && (
          <section className="org-section">
            <div className="org-section-head">
              <div>
                <h2>PAM à affecter</h2>
                <p>Ouvrez le PAM pour le placer dans une zone. Tant qu'il reste sur une moughataa, l'équipe ne voit que cette moughataa.</p>
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
                  <button key={pam._id} type="button" className="org-btn org-btn-ghost" onClick={() => openPam(pam)}>Consulter</button>,
                ];
              })}
            />
          </section>
        )}

        {selectedPam && (
          <>
            <div className="org-summary">
              <article>
                <span>Terrain</span>
                <strong>{terrainLabel(selectedPam, zones)}</strong>
              </article>
              <article>
                <span>Code</span>
                <strong>{selectedPam.nom}</strong>
              </article>
              <article>
                <span>Compte PAM</span>
                <strong>{personLabel(holder)}</strong>
              </article>
              <article>
                <span>SAM</span>
                <strong>{sams.length}</strong>
              </article>
              <article>
                <span>CAM</span>
                <strong>{cams.length}</strong>
              </article>
              <article>
                <span>Équipes</span>
                <strong>{teams.length}</strong>
              </article>
            </div>

            <div className="org-row-actions" style={{ marginBottom: '1.25rem' }}>
              <button type="button" className="org-btn org-btn-ghost" onClick={() => {
                setPamForm({
                  zoneId: selectedPam.zoneId || '',
                  compte: { ...EMPTY_SEAT },
                });
                setComposer('pam-territory');
                focusEditor();
              }}>Changer l'affectation</button>
              {holder && (
                <button type="button" className="org-btn org-btn-ghost" onClick={() => startUserEdit(holder)}>Modifier le compte</button>
              )}
              {holder && (
                <button type="button" className={isActive(holder) ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'} onClick={() => toggleActif('users', holder)}>
                  {isActive(holder) ? 'Désactiver le compte' : 'Réactiver le compte'}
                </button>
              )}
              {!holder && (
                <button type="button" className="org-btn org-btn-ghost" onClick={() => {
                  if (!pamReady(selectedPam)) {
                    setError('Rattachez d\'abord ce PAM à une zone.');
                    return;
                  }
                  setLinkForm({ mode: 'create', userId: '', seat: { ...EMPTY_SEAT } });
                  setComposer('holder');
                  loadCode({ role: 'pam', pamId: selectedPam._id });
                  focusEditor();
                }}>Créer le compte</button>
              )}
              <button type="button" className={isActive(selectedPam) ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'} onClick={() => toggleActif('pams', selectedPam)}>
                {isActive(selectedPam) ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>

            {composer === 'pam-territory' && (
              <form id="org-editor" className="card org-form" onSubmit={saveTerritory}>
                <div className="card-header">
                  <h3>Affectation du PAM</h3>
                  <p className="org-card-hint">Le matricule ne change pas. Dès l'enregistrement, les équipes enrôlent dans le nouveau terrain.</p>
                </div>
                <div className="card-body org-form-grid">
                  <Field label="Zone">
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

            {composer === 'holder' && (
              <form id="org-editor" className="card org-form" onSubmit={(event) => saveLink(event, 'pam')}>
                <div className="card-header">
                  <h3>Compte du PAM</h3>
                  <p className="org-card-hint">Ce PAM n'a pas encore de titulaire. Le compte est créé maintenant.</p>
                </div>
                <div className="card-body org-form-grid">
                  <IdentityBlock title="Titulaire" hint="Le matricule reprend le code du PAM." seat={linkForm.seat} onChange={(seat) => setLinkForm({ ...linkForm, seat })} />
                  <FormActions saving={saving} label="Créer le compte" onCancel={closeComposer} />
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

            <section className="org-section">
              <div className="org-section-head">
                <div>
                  <h2>SAM</h2>
                  <p>Rattachés à ce PAM. Un SAM peut superviser plusieurs équipes.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => {
                  if (!pamReady(selectedPam)) {
                    setError('Rattachez d\'abord ce PAM à une zone.');
                    return;
                  }
                  setLinkForm({ mode: 'create', userId: '', seat: { ...EMPTY_SEAT } });
                  setComposer('sam');
                  loadCode({ role: 'sam', pamId: selectedPam._id });
                  focusEditor();
                }}>Ajouter un SAM</button>
              </div>
              {composer === 'sam' && (
                <LinkForm
                  roleLabel="SAM"
                  hint="Le matricule est généré. Saisissez l'identité, ou affectez un SAM déjà existant."
                  code={previewCode}
                  linkForm={linkForm}
                  setLinkForm={setLinkForm}
                  candidates={movable('sam')}
                  saving={saving}
                  onSubmit={(event) => saveLink(event, 'sam')}
                  onCancel={closeComposer}
                />
              )}
              <PeopleTable people={sams} onEdit={startUserEdit} onToggle={(user) => toggleActif('users', user)} extraHeader="Équipes" extraCell={(user) => String(user.eamCount || 0)} />
            </section>

            <section className="org-section">
              <div className="org-section-head">
                <div>
                  <h2>CAM</h2>
                  <p>Même niveau que le SAM. Il valide les marchands de taille Gros.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => {
                  if (!pamReady(selectedPam)) {
                    setError('Rattachez d\'abord ce PAM à une zone.');
                    return;
                  }
                  setLinkForm({ mode: 'create', userId: '', seat: { ...EMPTY_SEAT } });
                  setComposer('cam');
                  loadCode({ role: 'cam', pamId: selectedPam._id });
                  focusEditor();
                }}>Ajouter un CAM</button>
              </div>
              {composer === 'cam' && (
                <LinkForm
                  roleLabel="CAM"
                  hint="Le matricule est généré. Saisissez l'identité, ou affectez un CAM déjà existant."
                  code={previewCode}
                  linkForm={linkForm}
                  setLinkForm={setLinkForm}
                  candidates={movable('cam')}
                  saving={saving}
                  onSubmit={(event) => saveLink(event, 'cam')}
                  onCancel={closeComposer}
                />
              )}
              <PeopleTable people={cams} onEdit={startUserEdit} onToggle={(user) => toggleActif('users', user)} />
            </section>

            <section className="org-section">
              <div className="org-section-head">
                <div>
                  <h2>Équipes</h2>
                  <p>Un seul compte, avec un matricule court du type E01. L'équipe enrôle dans toutes les moughataas et localités de la zone du PAM.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => {
                  if (!pamReady(selectedPam)) {
                    setError('Rattachez d\'abord ce PAM à une zone.');
                    return;
                  }
                  setPreviewCode('');
                  startTeam();
                }}>Nouvelle équipe</button>
              </div>
              {composer === 'eam' && (
                <form id="org-editor" className="card org-form" onSubmit={saveEam}>
                  <div className="card-header">
                    <h3>{eamEditId ? 'Équipe' : 'Nouvelle équipe'}</h3>
                    <p className="org-card-hint">
                      {eamEditId
                        ? 'Affectez un SAM de ce PAM, ou créez-en un nouveau. Les deux MSISDN restent dans la matrice.'
                        : 'Le SAM, le compte et les deux membres font partie de la même création.'}
                    </p>
                  </div>
                  <div className="card-body org-form-grid">
                    <Field label="Code de l'équipe">
                      <input className="form-control org-code" readOnly value={previewCode || (eamEditId ? eamForm.nom : '')} />
                    </Field>
                    <div className="org-choice">
                      <button type="button" className={eamForm.samMode === 'existing' ? 'is-active' : ''} onClick={() => setEamForm({ ...eamForm, samMode: 'existing' })}>
                        Affecter un SAM
                      </button>
                      <button type="button" className={eamForm.samMode === 'new' ? 'is-active' : ''} onClick={() => setEamForm({ ...eamForm, samMode: 'new', samId: '' })}>
                        Créer un SAM
                      </button>
                    </div>
                    {eamForm.samMode === 'existing' ? (
                      <Field label="SAM de ce PAM">
                        <select className="form-control" required value={eamForm.samId} onChange={(e) => setEamForm({ ...eamForm, samId: e.target.value })}>
                          <option value="">Choisir</option>
                          {activeSams.map((sam) => <option key={sam._id} value={sam._id}>{personLabel(sam)}</option>)}
                        </select>
                      </Field>
                    ) : (
                      <IdentityBlock title="Nouveau SAM" hint="Le matricule est généré. Saisissez l'identité et le mot de passe." seat={eamForm.sam} onChange={(sam) => setEamForm({ ...eamForm, sam })} />
                    )}
                    {eamTeam ? (
                      <SeatBlock title="Compte de l'équipe" person={eamTeam} seat={eamForm.equipe} onChange={() => {}} />
                    ) : (
                      <div className="org-seat">
                        <div className="org-seat-head">
                          <h4>Compte de l'équipe</h4>
                          <p className="org-seat-hint">Le matricule est le code généré. Une nouvelle connexion déconnecte l'autre téléphone.</p>
                        </div>
                        <div className="org-seat-grid">
                          <Field label="Mot de passe">
                            <input className="form-control" type="password" required minLength={6} value={eamForm.equipe.motDePasse} onChange={(e) => setEamForm({ ...eamForm, equipe: { ...eamForm.equipe, motDePasse: e.target.value } })} />
                          </Field>
                        </div>
                      </div>
                    )}
                    <MemberBlock title="Membre 1" hint="NNI et MSISDN envoyés dans la matrice." member={eamForm.membre1} onChange={(membre1) => setEamForm({ ...eamForm, membre1 })} />
                    <MemberBlock title="Membre 2" hint="NNI et MSISDN envoyés dans la matrice." member={eamForm.membre2} onChange={(membre2) => setEamForm({ ...eamForm, membre2 })} />
                    <FormActions saving={saving} label={eamEditId ? 'Enregistrer' : 'Créer l\'équipe'} onCancel={closeComposer} />
                  </div>
                </form>
              )}
              <OrgTable
                headers={['Équipe', 'SAM', 'Compte', 'Membres', 'Statut', 'Actions']}
                rows={teams.map((eam) => {
                  const equipe = eam.equipe || data.users.find(
                    (user) => user.role === 'aam' && refId(user.eamId) === String(eam._id) && isActive(user)
                  );
                  return [
                    eam.nom,
                    personLabel(eam.samId),
                    personLabel(equipe),
                    membersLabel(eam),
                    isActive(eam) ? <StatusBadge active /> : <StatusBadge />,
                    <div className="org-row-actions" key={eam._id}>
                      <button type="button" className="org-btn org-btn-ghost" onClick={() => startTeamEdit(eam)}>Affecter</button>
                      {equipe && <button type="button" className="org-btn org-btn-ghost" onClick={() => startUserEdit(equipe)}>Compte</button>}
                      <button type="button" className={isActive(eam) ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'} onClick={() => toggleActif('eams', eam)}>
                        {isActive(eam) ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>,
                  ];
                })}
              />
            </section>
          </>
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

function LinkForm({ roleLabel, hint, code, linkForm, setLinkForm, candidates, saving, onSubmit, onCancel }) {
  return (
    <form id="org-editor" className="card org-form" onSubmit={onSubmit}>
      <div className="card-header">
        <h3>{roleLabel}</h3>
        <p className="org-card-hint">{hint}</p>
      </div>
      <div className="card-body org-form-grid">
        <div className="org-choice">
          <button type="button" className={linkForm.mode === 'create' ? 'is-active' : ''} onClick={() => setLinkForm({ ...linkForm, mode: 'create' })}>
            Créer le compte
          </button>
          <button type="button" className={linkForm.mode === 'assign' ? 'is-active' : ''} onClick={() => setLinkForm({ ...linkForm, mode: 'assign' })}>
            Affecter un {roleLabel} existant
          </button>
        </div>
        {linkForm.mode === 'assign' ? (
          <Field label={roleLabel}>
            <select className="form-control" required value={linkForm.userId} onChange={(e) => setLinkForm({ ...linkForm, userId: e.target.value })}>
              <option value="">Choisir</option>
              {candidates.map((user) => <option key={user._id} value={user._id}>{personLabel(user)}</option>)}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Code">
              <input className="form-control org-code" readOnly value={code || 'Calcul…'} />
            </Field>
            <IdentityBlock title={`Identité ${roleLabel}`} seat={linkForm.seat} onChange={(seat) => setLinkForm({ ...linkForm, seat })} />
          </>
        )}
        <FormActions saving={saving} label={linkForm.mode === 'assign' ? 'Affecter' : `Créer le ${roleLabel}`} onCancel={onCancel} />
      </div>
    </form>
  );
}

function PeopleTable({ people, onEdit, onToggle, extraHeader, extraCell }) {
  const headers = ['Nom', 'Matricule', 'NNI', 'MSISDN', ...(extraHeader ? [extraHeader] : []), 'Statut', 'Actions'];
  return (
    <OrgTable
      headers={headers}
      rows={people.map((user) => [
        [user.prenom, user.nom].filter(Boolean).join(' ') || '—',
        user.matricule,
        user.nni || '—',
        formatMsisdn(user.moovMoneyMsisdn),
        ...(extraCell ? [extraCell(user)] : []),
        isActive(user) ? <StatusBadge active /> : <StatusBadge />,
        <RowActions key={user._id} onEdit={() => onEdit(user)} onToggle={() => onToggle(user)} active={isActive(user)} />,
      ])}
    />
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

function SeatBlock({ title, hint, person, seat, onChange, required = false }) {
  if (person) {
    return (
      <div className="org-seat">
        <div className="org-seat-head">
          <h4>{title}</h4>
        </div>
        <p className="org-person">{personLabel(person)}</p>
      </div>
    );
  }
  const set = (key) => (event) => onChange({ ...seat, [key]: event.target.value });
  return (
    <div className="org-seat">
      <div className="org-seat-head">
        <h4>{title}</h4>
        {hint ? <p className="org-seat-hint">{hint}</p> : null}
      </div>
      <div className="org-seat-grid">
        <Field label="Matricule"><input className="form-control" required={required} value={seat.matricule} onChange={set('matricule')} /></Field>
        <Field label="Nom"><input className="form-control" required={required} value={seat.nom} onChange={set('nom')} /></Field>
        <Field label="Prénom"><input className="form-control" required={required} value={seat.prenom} onChange={set('prenom')} /></Field>
        <NniField value={seat.nni} onChange={(nni) => onChange({ ...seat, nni })} required={required} />
        <MsisdnField value={seat.moovMoneyMsisdn} onChange={(moovMoneyMsisdn) => onChange({ ...seat, moovMoneyMsisdn })} required={required} />
        <Field label="Mot de passe"><input className="form-control" type="password" required={required} minLength={required ? 6 : undefined} value={seat.motDePasse} onChange={set('motDePasse')} /></Field>
      </div>
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

function RowActions({ onEdit, onToggle, active }) {
  return (
    <div className="org-row-actions">
      <button type="button" className="org-btn org-btn-ghost" onClick={onEdit}>Modifier</button>
      <button type="button" className={active ? 'org-btn org-btn-warn' : 'org-btn org-btn-ok'} onClick={onToggle}>
        {active ? 'Désactiver' : 'Réactiver'}
      </button>
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
