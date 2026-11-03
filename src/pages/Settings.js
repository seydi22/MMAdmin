import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import ComptesBackoffice from './ComptesBackoffice';
import ComptesLogistique from './ComptesLogistique';
import './Dashboard.css';
import './Settings.css';

const SEMVER = /^\d+\.\d+\.\d+$/;

const sessionUser = () => {
    try {
        const token = localStorage.getItem('token') || '';
        const part = token.split('.')[1];
        if (!part) return {};
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = JSON.parse(atob(padded));
        return json.user || {};
    } catch (err) {
        return {};
    }
};

const SECTIONS = ['compte', 'application', 'backoffice', 'logistique'];

const Settings = () => {
    const account = sessionUser();
    const isCentral = localStorage.getItem('userRole') === 'admin';
    const [searchParams, setSearchParams] = useSearchParams();
    const asked = searchParams.get('section');
    const section = SECTIONS.includes(asked) && (isCentral || (asked !== 'backoffice' && asked !== 'logistique'))
        ? asked
        : 'compte';
    const openSection = (id) => setSearchParams(id === 'compte' ? {} : { section: id }, { replace: true });

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [version, setVersion] = useState({
        minimumVersion: '',
        latestVersion: '',
        androidDownloadUrl: '',
        webUrl: '',
        iosDownloadUrl: '',
        updateMessage: '',
    });
    const [versionLoading, setVersionLoading] = useState(true);
    const [versionSaving, setVersionSaving] = useState(false);
    const [versionMessage, setVersionMessage] = useState('');
    const [versionError, setVersionError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/api/app/version');
                const data = res.data || {};
                setVersion({
                    minimumVersion: data.minimumVersion || '',
                    latestVersion: data.latestVersion || '',
                    androidDownloadUrl: data.androidDownloadUrl || '',
                    webUrl: data.webUrl || '',
                    iosDownloadUrl: data.iosDownloadUrl || '',
                    updateMessage: data.updateMessage || '',
                });
            } catch (err) {
                setVersionError('Impossible de lire la version de l’application.');
            } finally {
                setVersionLoading(false);
            }
        };
        load();
    }, []);

    const savePassword = async (event) => {
        event.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError('Tous les champs sont obligatoires.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Les deux nouveaux mots de passe doivent être identiques.');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/api/agents/change-password', {
                ancienMotDePasse: oldPassword,
                nouveauMotDePasse: newPassword,
            });
            setPasswordMessage('Mot de passe mis à jour. Il sera demandé à la prochaine connexion.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (err.response && err.response.status !== 401) {
                setPasswordError(err.response.data?.msg || 'Une erreur s’est produite.');
            } else if (!err.response) {
                setPasswordError('Erreur de connexion, veuillez vérifier votre réseau.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const saveVersion = async (event) => {
        event.preventDefault();
        setVersionMessage('');
        setVersionError('');

        const minimumVersion = version.minimumVersion.trim();
        const latestVersion = version.latestVersion.trim();
        if (!SEMVER.test(minimumVersion)) {
            setVersionError('La version minimale s’écrit sous la forme 1.0.3.');
            return;
        }
        if (latestVersion && !SEMVER.test(latestVersion)) {
            setVersionError('La dernière version s’écrit sous la forme 1.0.3.');
            return;
        }

        setVersionSaving(true);
        try {
            const res = await api.put('/api/app/version', {
                minimumVersion,
                latestVersion: latestVersion || null,
                androidDownloadUrl: version.androidDownloadUrl.trim() || null,
                webUrl: version.webUrl.trim() || null,
                iosDownloadUrl: version.iosDownloadUrl.trim() || null,
                updateMessage: version.updateMessage.trim() || null,
            });
            const data = res.data || {};
            setVersion({
                minimumVersion: data.minimumVersion || minimumVersion,
                latestVersion: data.latestVersion || '',
                androidDownloadUrl: data.androidDownloadUrl || '',
                webUrl: data.webUrl || '',
                iosDownloadUrl: data.iosDownloadUrl || '',
                updateMessage: data.updateMessage || '',
            });
            setVersionMessage('Version enregistrée. L’application terrain la prend en compte.');
        } catch (err) {
            setVersionError(err.response?.data?.msg || 'Enregistrement impossible.');
        } finally {
            setVersionSaving(false);
        }
    };

    const setField = (key, value) => setVersion((current) => ({ ...current, [key]: value }));

    const passwordField = (id, label, value, setValue, shown, setShown) => (
        <div className="settings-field">
            <label htmlFor={id}>{label}</label>
            <div className="settings-password">
                <input
                    id={id}
                    className="form-control"
                    type={shown ? 'text' : 'password'}
                    value={value}
                    autoComplete={id === 'old-password' ? 'current-password' : 'new-password'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button
                    type="button"
                    className="settings-eye"
                    aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    onClick={() => setShown(!shown)}
                >
                    {shown ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content settings-page">
                <header className="main-header">
                    <div>
                        <h1>Paramètres</h1>
                        <p className="settings-lead">
                            {isCentral
                                ? 'Le compte du portail, les comptes back-office, les comptes logistique et la version exigée sur le terrain.'
                                : 'Le compte du back-office et la version exigée sur le terrain.'}
                        </p>
                    </div>
                </header>

                <div className="settings-layout">
                    <nav className="settings-nav" aria-label="Sections des paramètres">
                        <button
                            type="button"
                            className={section === 'compte' ? 'is-active' : ''}
                            onClick={() => openSection('compte')}
                        >
                            <strong>Compte</strong>
                            <span>Mot de passe de connexion</span>
                        </button>
                        <button
                            type="button"
                            className={section === 'application' ? 'is-active' : ''}
                            onClick={() => openSection('application')}
                        >
                            <strong>Application terrain</strong>
                            <span>Version minimale et lien de mise à jour</span>
                        </button>
                        {isCentral && (
                            <button
                                type="button"
                                className={section === 'backoffice' ? 'is-active' : ''}
                                onClick={() => openSection('backoffice')}
                            >
                                <strong>Comptes back-office</strong>
                                <span>Accès limités au portail</span>
                            </button>
                        )}
                        {isCentral && (
                            <button
                                type="button"
                                className={section === 'logistique' ? 'is-active' : ''}
                                onClick={() => openSection('logistique')}
                            >
                                <strong>Comptes logistique</strong>
                                <span>Gestionnaires du parc matériel</span>
                            </button>
                        )}
                    </nav>

                    {section === 'compte' && (
                        <section className="settings-panel">
                            <h2>Compte du portail</h2>
                            <p className="settings-hint">Ce mot de passe ouvre uniquement le back-office. Il ne change pas les comptes AAM, SAM, CAM ou PAM.</p>
                            <dl className="settings-identity">
                                <div>
                                    <dt>Matricule</dt>
                                    <dd>{account.matricule || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Rôle</dt>
                                    <dd>{localStorage.getItem('userRole') === 'backoffice' ? 'Back-office' : 'Administrateur central'}</dd>
                                </div>
                            </dl>
                            <form className="settings-form" onSubmit={savePassword}>
                                {passwordField('old-password', 'Mot de passe actuel', oldPassword, setOldPassword, showOldPassword, setShowOldPassword)}
                                {passwordField('new-password', 'Nouveau mot de passe', newPassword, setNewPassword, showNewPassword, setShowNewPassword)}
                                {passwordField('confirm-password', 'Confirmer le nouveau mot de passe', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword)}
                                <p className="settings-note">6 caractères minimum.</p>
                                {passwordError && <p className="settings-alert settings-alert-error">{passwordError}</p>}
                                {passwordMessage && <p className="settings-alert settings-alert-ok">{passwordMessage}</p>}
                                <div className="settings-actions">
                                    <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                                        {passwordLoading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    {section === 'backoffice' && isCentral && (
                        <section className="settings-panel">
                            <h2>Comptes back-office</h2>
                            <ComptesBackoffice />
                        </section>
                    )}

                    {section === 'logistique' && isCentral && (
                        <section className="settings-panel">
                            <h2>Comptes logistique</h2>
                            <ComptesLogistique />
                        </section>
                    )}

                    {section === 'application' && (
                        <section className="settings-panel">
                            <h2>Application terrain</h2>
                            <p className="settings-hint">
                                Si l’application installée est plus ancienne que la version minimale, l’agent doit la mettre à jour avant de continuer.
                                Le lien Android est celui proposé sur le téléphone.
                            </p>
                            {versionLoading ? (
                                <p className="settings-note">Chargement de la configuration...</p>
                            ) : (
                                <form onSubmit={saveVersion}>
                                    <div className="settings-grid">
                                        <div className="settings-field">
                                            <label htmlFor="minimum-version">Version minimale</label>
                                            <input
                                                id="minimum-version"
                                                className="form-control"
                                                value={version.minimumVersion}
                                                placeholder="1.0.3"
                                                onChange={(e) => setField('minimumVersion', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="settings-field">
                                            <label htmlFor="latest-version">Dernière version publiée</label>
                                            <input
                                                id="latest-version"
                                                className="form-control"
                                                value={version.latestVersion}
                                                placeholder="1.0.4"
                                                onChange={(e) => setField('latestVersion', e.target.value)}
                                            />
                                        </div>
                                        <div className="settings-field is-wide">
                                            <label htmlFor="android-url">Lien de téléchargement Android</label>
                                            <input
                                                id="android-url"
                                                className="form-control"
                                                value={version.androidDownloadUrl}
                                                placeholder="https://"
                                                onChange={(e) => setField('androidDownloadUrl', e.target.value)}
                                            />
                                        </div>
                                        <div className="settings-field">
                                            <label htmlFor="web-url">Lien web</label>
                                            <input
                                                id="web-url"
                                                className="form-control"
                                                value={version.webUrl}
                                                placeholder="https://"
                                                onChange={(e) => setField('webUrl', e.target.value)}
                                            />
                                        </div>
                                        <div className="settings-field">
                                            <label htmlFor="ios-url">Lien iOS</label>
                                            <input
                                                id="ios-url"
                                                className="form-control"
                                                value={version.iosDownloadUrl}
                                                placeholder="https://"
                                                onChange={(e) => setField('iosDownloadUrl', e.target.value)}
                                            />
                                        </div>
                                        <div className="settings-field is-wide">
                                            <label htmlFor="update-message">Message affiché à l’agent</label>
                                            <textarea
                                                id="update-message"
                                                className="form-control"
                                                rows="3"
                                                value={version.updateMessage}
                                                onChange={(e) => setField('updateMessage', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {versionError && <p className="settings-alert settings-alert-error">{versionError}</p>}
                                    {versionMessage && <p className="settings-alert settings-alert-ok">{versionMessage}</p>}
                                    <div className="settings-actions">
                                        <button type="submit" className="btn btn-primary" disabled={versionSaving}>
                                            {versionSaving ? 'Enregistrement...' : 'Enregistrer la version'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
