import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/apiConfig";
import { formatMerchantStatutLabel } from "../utils/merchantStatus";
import "./SupervisorAllMerchants.css";

const SupervisorAllMerchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("Tous");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { setError("Authentification requise."); setLoading(false); return; }
      try {
        const params = {};
        if (search) params.search = search;
        if (statut && statut !== "Tous") params.statut = statut;
        const res = await axios.get(`${API_BASE_URL}/api/merchants/superviseur-merchants`, {
          headers: { "x-auth-token": token }, params,
        });
        setMerchants(Array.isArray(res.data) ? res.data : []);
      } catch (err) { setError(err.response?.data?.msg || "Erreur de chargement."); }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [search, statut]);

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <div className="superviseur-all-merchants-container">
      <h2 className="page-title">Marchands de mon equipe</h2>
      {error && <p className="error-text">{error}</p>}
      <div className="search-filter-container">
        <div className="input-container search">
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
        </div>
        <div className="input-container filter">
          <select className="select-field" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="Tous">Tous</option>
            <option value="en attente">En attente</option>
            <option value="validé_par_superviseur">Validé par superviseur</option>
            <option value="cree">Créé</option>
            <option value="rejeté">Rejeté</option>
            <option value="livré">Livré</option>
          </select>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="merchants-list-table">
          <thead><tr><th>Nom</th><th>Contact</th><th>Agent</th><th>Statut</th></tr></thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m._id}>
                <td>{m.nom}</td><td>{m.contact}</td><td>{m.agentRecruteurId?.matricule || "N/A"}</td>
                <td>{formatMerchantStatutLabel(m.statut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupervisorAllMerchants;