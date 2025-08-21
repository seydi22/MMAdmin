// src/pages/Reports.js

import React from 'react';
import Sidebar from '../components/Sidebar';
import MerchantsExport from '../components/MerchantsExport';
import './Dashboard.css';

const Reports = () => {
  return (
    <div className="dashboard-layout">
      {/* Barre latérale */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="main-content">
        <header className="main-header">
          <h2>📊 Rapports</h2>
        </header>

        <div className="placeholder-content">
          <p>
            La page des rapports est en cours de développement. 
            Vous pouvez néanmoins <strong>exporter la liste des marchands</strong>.
          </p>

          {/* Zone d’actions pour l’export */}
          <div className="report-actions" style={{ marginTop: '20px' }}>
            <MerchantsExport />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
