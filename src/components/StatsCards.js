import React from 'react';
import './StatsCards.css';

const StatsCards = ({ title, value }) => {
  return (
    <div className="stat-card">
      <h2 className="stat-value">{value}</h2>
      <p className="stat-title">{title}</p>
    </div>
  );
};

export default StatsCards;