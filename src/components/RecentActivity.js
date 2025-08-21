import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './RecentActivity.css';

const recentActivities = [
  { id: 1, text: 'Admin a validé le dossier de Martin Commerce', time: '25 min' },
  { id: 2, text: 'Admin a ajouté un nouveau superviseur', time: '15 min' },
  { id: 3, text: 'Admin a modifié les paramètres de sécurité', time: '10 min' },
  { id: 4, text: 'Admin s\'est connecté au système', time: '5 min' },
];

const RecentActivity = () => {
  return (
    <div className="activity-card">
      <h4>Activité Récente</h4>
      <ul>
        {recentActivities.map(activity => (
          <li key={activity.id}>
            <div className="activity-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="activity-details">
              <p>{activity.text}</p>
              <span>{activity.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;