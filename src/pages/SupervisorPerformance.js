import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SupervisorPerformanceTable from '../components/SupervisorPerformanceTable';
import API_BASE_URL from '../config/apiConfig';
import './SupervisorPerformance.css';

const SupervisorPerformance = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/merchants/supervisors/performance`, {
                    headers: {
                        'x-auth-token': localStorage.getItem('token'),
                    },
                });
                setPerformanceData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Erreur lors de la récupération des données de performance.');
                setLoading(false);
            }
        };

        fetchPerformanceData();
    }, []);

    return (
        <div className="supervisor-performance-page">
            <Sidebar />
            <div className="main-content">
                <header>
                    <h1>Performance des Equipes</h1>
                    <p>Suivi du nombre de validations de dossiers par superviseur.</p>
                </header>
                <main>
                    {loading ? (
                        <p>Chargement des données...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <SupervisorPerformanceTable data={performanceData} />
                    )}
                </main>
            </div>
        </div>
    );
};

export default SupervisorPerformance;