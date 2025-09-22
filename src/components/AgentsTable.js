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
              <td>{agent.performance.enrôlements}</td>
              <td>{agent.performance.validations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentsTable;