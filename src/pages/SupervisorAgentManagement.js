// src/pages/SupervisorAgentManagement.js

import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaSpinner, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Modal from '../components/Modal/Modal'; // Assurez-vous d'avoir un composant Modal générique
import API_BASE_URL from '../config/apiConfig';

const SupervisorAgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' ou 'edit'
  const [currentAgent, setCurrentAgent] = useState(null);

  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [role, setRole] = useState('agent');

  const API_URL = `${API_BASE_URL}/api/agents`;

  const fetchAgents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }
      const response = await fetch(`${API_URL}/all-performance`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        setAgents(data);
      } else {
        setErrorMessage('Erreur lors du chargement des agents.');
      }
    } catch (error) {
      setErrorMessage('Impossible de se connecter au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ matricule, motDePasse: password, affiliation, role: 'agent' }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Agent ajouté avec succès.');
        setIsModalOpen(false);
        fetchAgents();
      } else {
        alert(data.msg || 'Erreur lors de l\'ajout de l\'agent.');
      }
    } catch (error) {
      alert('Erreur réseau lors de l\'ajout de l\'agent.');
    }
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !currentAgent) return;

    const body = {};
    if (password) body.motDePasse = password;
    if (role !== currentAgent.role) body.role = role;

    try {
      const response = await fetch(`${API_URL}/${currentAgent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Agent mis à jour avec succès.');
        setIsModalOpen(false);
        fetchAgents();
      } else {
        alert(data.msg || 'Erreur lors de la mise à jour de l\'agent.');
      }
    } catch (error) {
      alert('Erreur réseau lors de la mise à jour de l\'agent.');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/${agentId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Agent supprimé avec succès.');
        fetchAgents();
      } else {
        alert(data.msg || 'Erreur lors de la suppression de l\'agent.');
      }
    } catch (error) {
      alert('Erreur réseau lors de la suppression de l\'agent.');
    }
  };

  const openAddModal = () => {
    setModalType('add');
    setMatricule('');
    setPassword('');
    setAffiliation('');
    setRole('agent');
    setIsModalOpen(true);
  };

  const openEditModal = (agent) => {
    setModalType('edit');
    setCurrentAgent(agent);
    setMatricule(agent.matricule);
    setPassword(''); // Laisser vide pour ne pas envoyer le mot de passe
    setRole(agent.role);
    setIsModalOpen(true);
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gestion des agents</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center"
        >
          <FaUserPlus className="mr-2" />
          Ajouter un agent
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        {agents.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Aucun agent à gérer.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrôlements</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{agent.matricule}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{agent.affiliation ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{agent.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{agent.performance?.enrôlements ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{agent.performance?.validations ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(agent)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteAgent(agent._id)} className="text-red-600 hover:text-red-900">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h3 className="text-2xl font-bold mb-4">{modalType === 'add' ? 'Ajouter un agent' : `Modifier ${currentAgent.matricule}`}</h3>
          <form onSubmit={modalType === 'add' ? handleAddAgent : handleUpdateAgent}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Matricule</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                disabled={modalType === 'edit'}
                required
              />
            </div>
            {modalType === 'add' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Affiliation</label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  required
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                placeholder={modalType === 'edit' ? "Laissez vide pour ne pas changer" : ""}
                required={modalType === 'add'}
              />
            </div>
            {modalType === 'edit' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Rôle</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value="agent">agent</option>
                  <option value="superviseur">superviseur</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {modalType === 'add' ? 'Ajouter' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SupervisorAgentManagement;
