import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API_BASE_URL from "../config/apiConfig";
import { formatMerchantStatutLabel, statusBadgeCssSuffix } from "../utils/merchantStatus";
import { formatRecruiterLabel } from "../utils/recruiterDisplay";
import "./Merchants.css";
import "../pages/Dashboard.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const Merchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [search, statut, limit]);

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        setLoading(false);
        return;
      }
      try {
        const params = { page, limit };
        if (search) params.search = search;
        if (statut) params.statut = statut;
        const res = await axios.get(`${API_BASE_URL}/api/merchants/all`, {
          headers: { "x-auth-token": token },
          params,
        });

        const data = res.data;
        if (Array.isArray(data)) {
          setMerchants(data);
          setTotal(data.length);
          setTotalPages(1);
        } else {
          setMerchants(Array.isArray(data.merchants) ? data.merchants : []);
          const pagination = data.pagination || {};
          setTotal(pagination.total ?? data.total ?? 0);
          setTotalPages(pagination.totalPages ?? data.totalPages ?? 0);
        }
      } catch (err) {
        setError(err.response?.data?.msg || "Erreur lors du chargement des marchands.");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchMerchants, 250);
    return () => clearTimeout(timer);
  }, [search, statut, page, limit]);

  const statusOptions = useMemo(
    () => ["", "validé_par_superviseur", "cree", "rejeté", "livré", "rejeté_définitivement"],
    []
  );

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Marchands</h1>
        </header>
        {error && <div className="merchants-error">{error}</div>}
        <div className="merchants-filters">
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {statusOptions.filter(Boolean).map((s) => (
              <option key={s} value={s}>{formatMerchantStatutLabel(s)}</option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Marchands par page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
        <div className="card">
          <div className="card-body table-responsive">
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <table className="merchants-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Contact</th>
                    <th>AAM</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.length === 0 ? (
                    <tr><td colSpan="5">Aucun marchand trouve.</td></tr>
                  ) : merchants.map((m) => (
                    <tr key={m._id}>
                      <td>{m.displayName || m.nom}</td>
                      <td>{m.contact}</td>
                      <td>{formatRecruiterLabel(m.agentRecruteurId) || "N/A"}</td>
                      <td>
                        <span className={`status-badge status-${statusBadgeCssSuffix(m.statut)}`}>
                          {formatMerchantStatutLabel(m.statut)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-details"
                          onClick={() => navigate(`/merchants/${m._id}`)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="merchants-pagination">
            <span className="pagination-info">
              {total === 0 ? "0 resultat" : `${from}-${to} sur ${total}`}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-details"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Precedent
              </button>
              <span className="pagination-page">
                Page {totalPages === 0 ? 0 : page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-details"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Merchants;
