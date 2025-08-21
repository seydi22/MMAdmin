// src/pages/SupervisorAgentPerformance.js

import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

const SupervisorAgentPerformance = () => {
  const [agentsPerformance, setAgentsPerformance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const API_URL = 'http://localhost:5000/api/agents/all-performance';

  const fetchAllAgentsPerformance = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        setAgentsPerformance(data);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.msg || 'Erreur lors du chargement des performances.');
      }
    } catch (error) {
      setErrorMessage('Impossible de se connecter au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAgentsPerformance();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (errorMessage) {
    return <div className="text-center text-red-500 font-bold">{errorMessage}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Performance des agents</h2>
      {agentsPerformance.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Aucun agent trouvé.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {agentsPerformance.map((agent) => (
            <div key={agent._id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{agent.matricule}</h3>
                <p className="text-sm text-gray-600 mb-4">Rôle: {agent.role}</p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">Enrôlements:</span> {agent.performance?.enrôlements ?? 0}
                  </p>
                  <p>
                    <span className="font-medium">Validations:</span> {agent.performance?.validations ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisorAgentPerformance;
