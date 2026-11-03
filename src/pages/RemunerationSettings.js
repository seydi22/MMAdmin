import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './RemunerationSettings.css';
import '../pages/Dashboard.css';

const STATUS_OPTIONS = [
  { value: 'cree', label: 'cree' },
  { value: 'livré', label: 'livré' },
];

const RemunerationSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [jobResult, setJobResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showSkipped, setShowSkipped] = useState(false);

  const [amountPerMerchant, setAmountPerMerchant] = useState(50);
  const [currency, setCurrency] = useState('MRU');
  const [merchantStatuses, setMerchantStatuses] = useState(['cree', 'livré']);

  const [jobMonth, setJobMonth] = useState('');

  const [reportMonth, setReportMonth] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportPage, setReportPage] = useState(1);

  const token = () => localStorage.getItem('token');
  const headers = () => ({ 'x-auth-token': token() });

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/remuneration/settings`, {
        headers: headers(),
      });
      setAmountPerMerchant(res.data.amountPerMerchant ?? 50);
      setCurrency(res.data.currency || 'MRU');
      setMerchantStatuses(
        Array.isArray(res.data.merchantStatuses) && res.data.merchantStatuses.length
          ? res.data.merchantStatuses
          : ['cree', 'livré']
      );
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger les parametres.');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = useCallback(async (page = 1) => {
    setReportLoading(true);
    try {
      const params = { page, limit: 25 };
      if (reportMonth.trim()) params.month = reportMonth.trim();
      if (reportStatus) params.status = reportStatus;
      const res = await axios.get(`${API_BASE_URL}/api/remuneration/report`, {
        headers: headers(),
        params,
      });
      setReport(res.data);
      setReportPage(page);
    } catch (err) {
      setError(err.response?.data?.msg || 'Impossible de charger le rapport.');
    } finally {
      setReportLoading(false);
    }
  }, [reportMonth, reportStatus]);

  useEffect(() => {
    loadSettings();
    loadReport(1);
  }, []);

  const toggleStatus = (value) => {
    setMerchantStatuses((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== value);
      }
      return [...prev, value];
    });
  };

  const handleSaveStatuses = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/remuneration/settings`,
        {
          merchantStatuses,
          amountPerMerchant: Number(amountPerMerchant),
        },
        { headers: headers() }
      );
      setMessage(res.data.msg || 'Enregistre.');
      if (res.data.settings) {
        if (res.data.settings.merchantStatuses) {
          setMerchantStatuses(res.data.settings.merchantStatuses);
        }
        if (res.data.settings.amountPerMerchant != null) {
          setAmountPerMerchant(res.data.settings.amountPerMerchant);
        }
        if (res.data.settings.currency) {
          setCurrency(res.data.settings.currency);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);
    setJobResult(null);
    setError('');
    setMessage('');
    try {
      const body = {};
      if (jobMonth.trim()) body.month = jobMonth.trim();
      const res = await axios.post(`${API_BASE_URL}/api/remuneration/preview`, body, {
        headers: headers(),
      });
      setPreview(res.data);
      if (res.data.warning) {
        setMessage(res.data.warning);
      } else {
        setMessage(
          `Verification OK — ${res.data.eligibleCount} marchand(s) eligibile(s), total estime ${res.data.estimatedTotal} ${res.data.currency}`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          err.response?.data?.reason ||
          'Erreur lors de la verification.'
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleRunJob = async () => {
    if (!preview || preview.eligibleCount < 1) {
      setError('Verifiez d abord les eligibles avant de lancer le paiement.');
      return;
    }
    const ok = window.confirm(
      `Lancer le paiement pour ${preview.eligibleCount} marchand(s) ` +
        `(${preview.estimatedTotal} ${preview.currency}) — periode ${preview.period} ?`
    );
    if (!ok) return;

    setRunning(true);
    setJobResult(null);
    setError('');
    setMessage('');
    try {
      const body = { dryRun: false };
      if (jobMonth.trim()) body.month = jobMonth.trim();
      const res = await axios.post(`${API_BASE_URL}/api/remuneration/run-job`, body, {
        headers: headers(),
      });
      setJobResult(res.data);
      setMessage(
        res.data.skipped
          ? `Job ignore : ${res.data.reason}`
          : `Paiement termine — periode ${res.data.period}`
      );
      setPreview(null);
      await loadReport(1);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erreur lors du lancement du job.');
    } finally {
      setRunning(false);
    }
  };

  const formatRemStatus = (s) => {
    if (s === 'paid') return 'Paye';
    if (s === 'failed') return 'Echec';
    if (s === 'eligible') return 'Eligible';
    return s || '—';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content rem-settings-page">
        <header className="main-header">
          <h1>Remuneration agents</h1>
          <p className="rem-subtitle">
            Paiement mensuel. Devise fixe ({currency}) — montant parametrable.
          </p>
        </header>

        {error && <div className="rem-alert rem-alert-error">{error}</div>}
        {message && <div className="rem-alert rem-alert-ok">{message}</div>}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className="card rem-card">
              <h2>Regles fixes</h2>
              <div className="rem-fixed-row rem-fixed-row-3">
                <div>
                  <span className="rem-label">Mode</span>
                  <strong>Mensuel</strong>
                </div>
                <div>
                  <span className="rem-label">Devise</span>
                  <strong>{currency}</strong>
                </div>
                <div>
                  <span className="rem-label">Eligibilite</span>
                  <strong>≥ 1 txn Completed depuis le mois de creation</strong>
                </div>
              </div>
            </div>

            <form className="card rem-card" onSubmit={handleSaveStatuses}>
              <h2>Parametres</h2>
              <div className="rem-grid">
                <div className="form-group">
                  <label>Montant par marchand eligibile ({currency})</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amountPerMerchant}
                    onChange={(e) => setAmountPerMerchant(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="rem-hint">
                Seuls les marchands dans ces statuts entrent dans le calcul mensuel.
              </p>
              <div className="rem-status-checks">
                {STATUS_OPTIONS.map((opt) => (
                  <label key={opt.value} className="rem-check">
                    <input
                      type="checkbox"
                      checked={merchantStatuses.includes(opt.value)}
                      onChange={() => toggleStatus(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <button type="submit" className="btn-details" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>

            <div className="card rem-card">
              <h2>1. Verifier les eligibles</h2>
              <p className="rem-hint">
                1) Marchands crees dans le mois choisi (cohorte) — 2) SyncQueryOrgTxn du debut de ce mois
                jusqu&apos;a maintenant (≥ 1 txn Completed, meme si la 1re txn arrive plus tard).
              </p>
              <div className="rem-grid">
                <div className="form-group">
                  <label>Mois (YYYY-MM, optionnel)</label>
                  <input
                    type="text"
                    value={jobMonth}
                    onChange={(e) => {
                      setJobMonth(e.target.value);
                      setPreview(null);
                    }}
                    placeholder="Ex. 2026-07"
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-details"
                onClick={handlePreview}
                disabled={previewing || running}
              >
                {previewing ? 'Verification en cours...' : 'Verifier les eligibles'}
              </button>

              {preview && (
                <div className="rem-preview-block">
                  {preview.warning && (
                    <div className="rem-alert rem-alert-error">{preview.warning}</div>
                  )}
                  <div className="rem-summary">
                    <span>Cohorte : {preview.period}</span>
                    <span>
                      Fenetre CPS : {preview.txnStartDateTime || preview.startDateTime} →{' '}
                      {preview.txnEndDateTime || preview.endDateTime}
                    </span>
                    <span>Candidats : {preview.candidateTotal ?? '—'}</span>
                    <span>Eligibles : {preview.eligibleCount}</span>
                    <span>Ignores : {preview.skippedCount}</span>
                    <span>
                      Total estime : {preview.estimatedTotal} {preview.currency}
                    </span>
                    <span>
                      Agents avec MSISDN : {preview.agentsWithMsisdn}
                      {preview.agentsWithoutMsisdn
                        ? ` (${preview.agentsWithoutMsisdn} sans)`
                        : ''}
                    </span>
                  </div>

                  <h3 className="rem-subheading">Par agent</h3>
                  <div className="table-responsive">
                    <table className="merchants-table">
                      <thead>
                        <tr>
                          <th>Agent</th>
                          <th>MSISDN</th>
                          <th>Candidats</th>
                          <th>Eligibles</th>
                          <th>Montant estime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(preview.byAgent || []).map((a) => (
                          <tr key={a.agentId}>
                            <td>{a.matricule}</td>
                            <td>{a.msisdn}</td>
                            <td>{a.candidateCount}</td>
                            <td>{a.eligibleCount}</td>
                            <td>
                              {a.estimatedAmount} {preview.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3 className="rem-subheading">Marchands eligibles</h3>
                  <div className="table-responsive">
                    <table className="merchants-table">
                      <thead>
                        <tr>
                          <th>Marchand</th>
                          <th>ShortCode</th>
                          <th>Agent</th>
                          <th>Statut</th>
                          <th>Txn fenetre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!preview.eligibleMerchants?.length ? (
                          <tr>
                            <td colSpan="5">Aucun marchand eligibile.</td>
                          </tr>
                        ) : (
                          preview.eligibleMerchants.map((m) => (
                            <tr key={m.merchantId}>
                              <td>{m.nom}</td>
                              <td>{m.shortCode}</td>
                              <td>{m.agentMatricule}</td>
                              <td>{m.statut}</td>
                              <td>{m.transactionCount ?? '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {preview.skippedMerchants?.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="btn-details rem-linkish"
                        onClick={() => setShowSkipped((v) => !v)}
                      >
                        {showSkipped ? 'Masquer' : 'Voir'} les ignores (
                        {preview.skippedMerchants.length})
                      </button>
                      {showSkipped && (
                        <div className="table-responsive">
                          <table className="merchants-table">
                            <thead>
                              <tr>
                                <th>Marchand</th>
                                <th>ShortCode</th>
                                <th>Agent</th>
                                <th>Motif</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.skippedMerchants.map((m) => (
                                <tr key={m.merchantId}>
                                  <td>{m.nom}</td>
                                  <td>{m.shortCode}</td>
                                  <td>{m.agentMatricule}</td>
                                  <td>{m.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  <h2 className="rem-step2">2. Lancer le paiement</h2>
                  <p className="rem-hint">
                    Confirme le paiement CPS pour les marchands eligibles ci-dessus.
                  </p>
                  <button
                    type="button"
                    className="btn-details"
                    onClick={handleRunJob}
                    disabled={running || preview.eligibleCount < 1}
                  >
                    {running ? 'Paiement en cours...' : 'Lancer le paiement'}
                  </button>
                </div>
              )}

              {jobResult && (
                <pre className="rem-report">{JSON.stringify(jobResult, null, 2)}</pre>
              )}
            </div>

            <div className="card rem-card">
              <h2>Rapport des remunerations</h2>
              <div className="rem-grid rem-report-filters">
                <div className="form-group">
                  <label>Mois (YYYY-MM)</label>
                  <input
                    type="text"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    placeholder="Ex. 2026-07"
                  />
                </div>
                <div className="form-group">
                  <label>Statut remuneration</label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="paid">Paye</option>
                    <option value="failed">Echec</option>
                    <option value="eligible">Eligible</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="btn-details"
                onClick={() => loadReport(1)}
                disabled={reportLoading}
              >
                {reportLoading ? 'Chargement...' : 'Filtrer'}
              </button>

              {report?.summary && (
                <div className="rem-summary">
                  <span>Payes : {report.summary.paidCount}</span>
                  <span>Echecs : {report.summary.failedCount}</span>
                  <span>Eligibles : {report.summary.eligibleCount}</span>
                  <span>
                    Total paye : {report.summary.paidTotalAmount} {currency}
                  </span>
                </div>
              )}

              <div className="table-responsive" style={{ marginTop: '1rem' }}>
                <table className="merchants-table">
                  <thead>
                    <tr>
                      <th>Marchand</th>
                      <th>ShortCode</th>
                      <th>Agent</th>
                      <th>Statut rem.</th>
                      <th>Montant</th>
                      <th>Mois</th>
                      <th>TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!report?.items?.length ? (
                      <tr>
                        <td colSpan="7">Aucun resultat.</td>
                      </tr>
                    ) : (
                      report.items.map((row) => (
                        <tr key={row._id}>
                          <td>{row.nom}</td>
                          <td>{row.shortCode || '—'}</td>
                          <td>{row.agentMatricule || '—'}</td>
                          <td>{formatRemStatus(row.remuneration?.status)}</td>
                          <td>
                            {row.remuneration?.amount != null
                              ? `${row.remuneration.amount} ${currency}`
                              : '—'}
                          </td>
                          <td>{row.remuneration?.paidForMonth || '—'}</td>
                          <td>{row.remuneration?.transactionId || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {report?.pagination && report.pagination.totalPages > 1 && (
                <div className="rem-pager">
                  <button
                    type="button"
                    className="btn-details"
                    disabled={reportPage <= 1 || reportLoading}
                    onClick={() => loadReport(reportPage - 1)}
                  >
                    Precedent
                  </button>
                  <span>
                    Page {reportPage} / {report.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-details"
                    disabled={
                      reportPage >= report.pagination.totalPages || reportLoading
                    }
                    onClick={() => loadReport(reportPage + 1)}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default RemunerationSettingsPage;
