// src/components/SupervisorsTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Import du hook de navigation
import './SupervisorsTable.css';

const SupervisorsTable = ({ supervisors, onDeleteSupervisor }) => {
  const navigate = useNavigate();

  const handleEdit = (id) => {
    // Redirige vers la page d'édition avec l'ID du superviseur
    navigate(`/supervisors/edit/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce superviseur ?')) {
      // Appelle la fonction de suppression passée par le parent (Dashboard.js)
      onDeleteSupervisor(id);
    }
  };

  return (
    <div className="table-container">
      <h3>Liste des superviseurs</h3>
      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Affiliation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.map(sup => (
             <tr key={sup._id}>
              {/* L'erreur est probablement ici : il faut afficher sup.matricule et sup.affiliation */}
              <td>{sup.matricule}</td>
              <td>{sup.affiliation}</td>
              <td className="actions">
                <button className="action-btn edit-btn" onClick={() => handleEdit(sup._id)}>
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(sup._id)}>
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupervisorsTable;