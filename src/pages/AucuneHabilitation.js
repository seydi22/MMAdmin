import React from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const AucuneHabilitation = () => (
  <div className="dashboard-layout">
    <Sidebar />
    <main className="main-content">
      <header className="main-header"><h1>Back-office</h1></header>
      <p>Aucune fonction n’est ouverte sur ce compte. L’administrateur central peut cocher les écrans à afficher.</p>
    </main>
  </div>
);

export default AucuneHabilitation;
