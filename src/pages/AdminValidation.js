import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API_BASE_URL from "../config/apiConfig";
import { formatMerchantStatutLabel } from "../utils/merchantStatus";
import { formatRecruiterLabel } from "../utils/recruiterDisplay";
import "./Merchants.css";
import "../pages/Dashboard.css";

function enRetard(merchant) {
  const at = merchant.validatedBySupervisorAt || merchant.createdAt;
  if (!at) return false;
  return Date.now() - new Date(at).getTime() >= 24 * 60 * 60 * 1000;
}

const AdminValidation = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();
  const token = () => localStorage.getItem("token");

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    if (!token()) { setError("Authentification requise."); setLoading(false); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/merchants/pending-admin-validation`, {
        headers: { "x-auth-token": token() },
      });
      setMerchants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.msg || "Erreur lors du chargement des dossiers.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleValidate = async (id) => {
    setActionId(id); setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/merchants/admin-validate/${id}`, {}, { headers: { "x-auth-token": token() } });
      await fetchPending();
    } catch (err) { setError(err.response?.data?.msg || "Echec de la validation."); }
    finally { setActionId(null); }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { setError("Indiquez une raison de rejet."); return; }
    setActionId(id); setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/merchants/admin-reject/${id}`, { rejectionReason: rejectReason.trim() }, { headers: { "x-auth-token": token() } });
      setRejectId(null); setRejectReason(""); await fetchPending();
    } catch (err) { setError(err.response?.data?.msg || "Echec du rejet."); }
    finally { setActionId(null); }
  };

  if (loading) return <div className="loading-container">Chargement...</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header"><h1>Validation finale des marchands</h1></header>
        <p style={{ maxWidth: 760, color: '#555' }}>Ces dossiers sont au statut validé par superviseur. La validation finale, faite ici, crée le marchand.</p>
        {merchants.some((m) => enRetard(m)) && (
          <div className="delay-banner">
            {merchants.filter((m) => enRetard(m)).length} dossier(s) attendent la création depuis plus de 24 h.
          </div>
        )}
        {error && <div className="merchants-error">{error}</div>}
        <div className="card"><div className="card-body table-responsive">
          <table className="merchants-table">
            <thead><tr><th>Nom</th><th>Contact</th><th>AAM</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {merchants.length === 0 ? (
                <tr><td colSpan="5">Aucun dossier en attente de validation admin.</td></tr>
              ) : merchants.map((m) => (
                <tr key={m._id} className={enRetard(m) ? 'row-late' : ''}>
                  <td>{m.nom}</td><td>{m.contact}</td><td>{formatRecruiterLabel(m.agentRecruteurId) || "N/A"}</td>
                  <td>{formatMerchantStatutLabel(m.statut)}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn-details" onClick={() => navigate(`/merchants/${m._id}`)}>Details</button>
                    <button type="button" className="btn-validate" disabled={actionId === m._id} onClick={() => handleValidate(m._id)}>{actionId === m._id ? "..." : "Valider / Creer"}</button>
                    {rejectId === m._id ? (
                      <div className="reject-inline">
                        <input type="text" placeholder="Raison du rejet" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                        <button type="button" className="btn-reject" disabled={actionId === m._id} onClick={() => handleReject(m._id)}>Confirmer</button>
                        <button type="button" className="btn-details" onClick={() => setRejectId(null)}>Annuler</button>
                      </div>
                    ) : (
                      <button type="button" className="btn-reject" onClick={() => { setRejectId(m._id); setRejectReason(""); }}>Rejeter</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </main>
    </div>
  );
};

export default AdminValidation;