// src/components/DossierRow.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Import du hook

const DossierRow = ({ dossier }) => {
  const navigate = useNavigate(); // Initialisation du hook

  const handleRowClick = () => {
    // Navigue vers la route des détails en utilisant l'ID du dossier
    navigate(`/merchant/${dossier._id}`);
  };
  

    return (
    <tr onClick={handleRowClick} style={{ cursor: 'pointer' }}> {/* Ajout du gestionnaire de clic */}
      <td>{dossier.nom}</td>
      <td>{dossier.secteur}</td>
      <td>{new Date(dossier.createdAt).toLocaleDateString()}</td>
      <td>
        <span className={`status-badge ${getStatusClass(dossier.statut)}`}>
          {dossier.statut}
        </span>
      </td>
      <td className="actions">
        {dossier.statut === 'en attente' && (
          <>
            <button className="action-btn validate-btn" title="Valider">
              <FontAwesomeIcon icon={faCheckCircle} />
            </button>
            <button className="action-btn reject-btn" title="Rejeter">
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </>
        )}
      </td>
    </tr>
  );
};


export default DossierRow;