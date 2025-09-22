import React from 'react';
import './StatsCards.css';

const StatsCards = ({ title, value, icon }) => {
  return (
    <div className="card stat-card">
      <div className="card-body">
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-content">
          <h3 className="stat-value">{value}</h3>
          <p className="stat-title">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;