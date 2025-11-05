import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaSearch, FaFilter } from 'react-icons/fa';
import Modal from '../components/Modal/Modal';
import SupervisorMerchantDetail from './SupervisorMerchantDetail';

/**
 * Composant pour afficher et gérer tous les commerçants pour un superviseur.
 * Il permet la recherche, le filtrage par statut et la visualisation des détails.
 */
const SupervisorAllMerchants = () => {
  // Définition des états du composant
  const [allMerchants, setAllMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);

  // URL de l'API backend
  const API_URL = 'http://localhost:5000/api/merchants';

  /**
   * Fonction asynchrone pour récupérer la liste des commerçants depuis l'API.
   * Elle gère l'authentification et les erreurs de réseau.
   */
  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Veuillez vous reconnecter. Le jeton d\'authentification est manquant.');
        setIsLoading(false);
        return;
      }

      // Requête GET vers l'API
      const response = await fetch(`${API_URL}/superviseur-merchants`, {
        headers: {
          'x-auth-token': token,
        },
      });

      // Vérifie si la réponse est réussie
      if (response.ok) { // response.ok est plus robuste que de vérifier le statut 200
        const data = await response.json();
        setAllMerchants(data);
        setFilteredMerchants(data);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.msg || 'Erreur lors du chargement des commerçants.');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setErrorMessage('Impossible de se connecter au serveur. Vérifiez que le backend est en cours d\'exécution.');
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Hook useEffect pour récupérer les données au montage du composant
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // Hook useEffect pour filtrer les données à chaque changement de filtre ou de recherche
  useEffect(() => {
    let tempMerchants = [...allMerchants];

    // Filtrage par statut
    if (selectedStatus !== 'all') {
      tempMerchants = tempMerchants.filter(merchant => merchant.statut === selectedStatus);
    }

    // Recherche par terme (nom ou nom du gérant)
    if (searchTerm) {
      tempMerchants = tempMerchants.filter(merchant =>
        merchant.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant.nomGerant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMerchants(tempMerchants);
  }, [allMerchants, searchTerm, selectedStatus]);

  // Fonctions pour gérer le modal
  const openMerchantDetail = (merchant) => {
    setCurrentMerchant(merchant);
    setIsModalOpen(true);
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    fetchMerchants();
  };

  const formatReadableDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Affichage conditionnel basé sur l'état
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (errorMessage) {
    return <div className="text-center text-red-500 font-bold p-4">{errorMessage}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Tous les commerçants</h2>
      
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        {/* Champ de recherche */}
        <div className="relative w-full md:w-1/2">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou gérant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtrage par statut */}
        <div className="relative w-full md:w-1/3">
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="validé">Validé</option>
            <option value="rejeté">Rejeté</option>
            <option value="assigné">Assigné</option>
            <option value="livré">Livré</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        {filteredMerchants.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Aucun commerçant ne correspond à votre recherche.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gérant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d’enrôlement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de validation par superviseur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de validation finale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de livraison</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant._id} onClick={() => openMerchantDetail(merchant)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">{merchant.nom ?? 'Nom inconnu'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{merchant.nomGerant ?? 'Non spécifié'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{merchant.contact ?? 'Non spécifié'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        merchant.statut === 'validé' ? 'bg-green-100 text-green-800' :
                        merchant.statut === 'rejeté' ? 'bg-red-100 text-red-800' :
                        merchant.statut === 'livré' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {merchant.statut ?? 'Non défini'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatReadableDate(merchant.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatReadableDate(merchant.supervisorValidationDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatReadableDate(merchant.finalValidationDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatReadableDate(merchant.deliveredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour afficher les détails du commerçant */}
      {isModalOpen && (
        <Modal onClose={closeModalAndRefresh}>
          <SupervisorMerchantDetail merchant={currentMerchant} onStatusUpdate={closeModalAndRefresh} />
        </Modal>
      )}
    </div>
  );
};

export default SupervisorAllMerchants;
