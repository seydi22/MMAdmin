// src/components/SupervisorsTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Import du hook de navigation
import './SupervisorsTable.css';

const SupervisorsTable = ({ supervisors, onDeleteSupervisor }) => {
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/supervisors/edit/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce superviseur ?')) {
      onDeleteSupervisor(id);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Affiliation</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.map((sup) => (
            <tr key={sup._id}>
              <td>{sup.matricule}</td>
              <td>{sup.affiliation}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleEdit(sup._id)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(sup._id)}
                >
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