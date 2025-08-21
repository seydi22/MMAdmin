// src/components/DossiersTable.js
import React from 'react';
import DossierRow from './DossierRow';
import './DossiersTable.css';

const DossiersTable = ({ dossiers }) => {
  return (
    <div className="table-container">
      <h3>Liste des dossiers</h3>
      <table>
        <thead>
          <tr>
            <th>Nom du marchand</th>
            <th>Secteur</th>
            <th>Date de soumission</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map(dossier => (
            <DossierRow key={dossier._id} dossier={dossier} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DossiersTable;