// src/components/MerchantsTable.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MerchantsTable.css';

const MerchantsTable = ({ merchants, onValidate, onReject }) => {
  const navigate = useNavigate();

  const handleViewDetail = (id) => {
    navigate(`/merchants/${id}`);
  };

  return (
    <div className="table-container">
      <h3>Liste des Marchands</h3>
      <table>
        <thead>
          <tr>
            <th>Nom du Marchand</th>
            <th>Contact</th>
            <th>Agent Recruteur</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map(merchant => (
            <tr key={merchant._id}>
              {/* Correction 1 : Utilisation de merchant.nom (comme dans le JSON) */}
              <td>{merchant.nom}</td>
              <td>{merchant.contact}</td>
              {/* Correction 2 : Utilisation de merchant.agentRecruteurId.matricule pour accéder au matricule de l'objet */}
              <td>{merchant.agentRecruteurId.matricule}</td>
              <td>
                <span className={`status-badge status-${merchant.statut.toLowerCase()}`}>
                  {merchant.statut}
                </span>
              </td>
              <td className="actions">
                <button 
                  className="action-btn view-btn" 
                  onClick={() => handleViewDetail(merchant._id)}
                >
                  Détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MerchantsTable;