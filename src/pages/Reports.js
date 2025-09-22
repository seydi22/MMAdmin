// src/pages/Reports.js

import React from 'react';
import Sidebar from '../components/Sidebar';
import MerchantsExport from '../components/MerchantsExport';
import './Dashboard.css';
import './Reports.css';

const Reports = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Rapports</h1>
        </header>

        <div className="card">
          <div className="card-body">
            <MerchantsExport />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
