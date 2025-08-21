// src/pages/Merchants.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // S'assurer que les styles du tableau de bord sont inclus
import './Merchants.css';

const Merchants = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const navigate = useNavigate();
    
    // Fonction pour naviguer vers la page de détail d'un marchand
    const handleMerchantClick = (merchantId) => {
        navigate(`/merchants/${merchantId}`);
    };

    const fetchMerchants = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentification requise.');
            }

            const url = `https://moov-money-backend.onrender.com/api/merchants/all`;
            const params = {
                statut: statusFilter === 'Tous' ? '' : statusFilter,
                search: searchTerm,
            };

            const response = await axios.get(url, {
                headers: {
                    'x-auth-token': token,
                },
                params: params,
            });
            setMerchants(response.data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erreur lors du chargement des marchands.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, [statusFilter, searchTerm]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <header className="main-header">
                    <h2>Gestion des marchands</h2>
                </header>

                <div className="p-4">
                    <div className="filter-container">
                         <input
                            type="text"
                            placeholder="Rechercher par nom, gérant ou contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-select"
                        >
                            <option value="Tous">Tous les statuts</option>
                            <option value="en attente">En attente</option>
                            <option value="validé">Validé</option>
                            <option value="rejeté">Rejeté</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p>Chargement des marchands...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : merchants.length === 0 ? (
                    <p>Aucun marchand trouvé.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Enseigne</th>
                                    <th className="py-2 px-4 border-b">Gérant</th>
                                    <th className="py-2 px-4 border-b">Contact</th>
                                    <th className="py-2 px-4 border-b">Statut</th>
                                    <th className="py-2 px-4 border-b">Enrôlé par</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchants.map((merchant) => (
                                    <tr key={merchant._id} onClick={() => handleMerchantClick(merchant._id)} className="cursor-pointer hover:bg-gray-100">
                                        <td className="py-2 px-4 border-b">{merchant.nom}</td>
                                        <td className="py-2 px-4 border-b">{merchant.nomGerant}</td>
                                        <td className="py-2 px-4 border-b">{merchant.contact}</td>
                                        <td className="py-2 px-4 border-b">{merchant.statut}</td>
                                        <td className="py-2 px-4 border-b">
                                            {merchant.agentRecruteurId?.matricule || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Merchants;