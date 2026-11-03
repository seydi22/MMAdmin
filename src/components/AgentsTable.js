// src/components/AgentsTable.js

import React from 'react';
import './AgentsTable.css';

const AgentsTable = ({ agents }) => {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Rôle</th>
            <th>Affiliation</th>
            <th>Moov Money</th>
            <th>Enrôlements</th>
            <th>Validations</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent._id}>
              <td>{agent.matricule}</td>
              <td>{agent.role}</td>
              <td>{agent.affiliation}</td>
              <td>{agent.moovMoneyMsisdn || '—'}</td>
              <td>{agent.performance?.enrôlements ?? 0}</td>
              <td>{agent.performance?.validations ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentsTable;